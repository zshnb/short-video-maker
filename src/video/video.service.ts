import { Injectable } from '@nestjs/common'
import { getLogger } from '../logger'
import { runRawFfmpeg } from '../util/ffmpegUtil'
import ShortUniqueId from 'short-unique-id'
import { localProjectPath, subtitleDir } from '../util/pathUtil'
import * as fs from 'fs/promises'
import { DrawSubtitleOptions, SceneInfo, ScriptFile } from './types'
import { prepFolder } from '../util/folderUtil'
import imageSize from 'image-size'
import { Composition } from './composition'
import Parser from './srtParser'
import { levenshteinEditDistance } from './levenshtein-edit-distance'

const logger = getLogger('video-service')

@Injectable()
export class VideoService {
  private srtParser: Parser = new Parser()

  constructor(private readonly composition: Composition) {}

  async generateShorts() {
    logger.info('start generate shorts')
    const projectId = new ShortUniqueId({ length: 6 })
    const projectDir = localProjectPath(projectId.rnd())
    const { sceneInfos, outputVideo } =
      await this.concatImageToVideo(projectDir)
    await this.drawSubtitles({
      projectDir,
      concatedVideo: outputVideo,
      sceneInfos,
      textOption: {
        fontSize: 80,
        color: 'white',
      },
    })
  }

  private async concatImageToVideo(projectDir: string) {
    await fs.cp(`test_data/test_data_m2`, projectDir, { recursive: true })
    const sceneInfos = await this.getAllSceneInfo(projectDir)
    const files = (await fs.readdir(projectDir))
      .filter((it) => it.endsWith('.png'))
      .sort((a, b) => {
        const aIndex = a.split('_')[1]
        const bIndex = b.split('_')[1]
        return parseInt(aIndex) < parseInt(bIndex) ? -1 : 1
      })
    const imgSize = imageSize(`${projectDir}/${files[0]}`)
    const inputArgs = sceneInfos
      .map(
        (scene, index) =>
          `-t ${scene.duration} -i ${projectDir}/${files[index]}`,
      )
      .join(' ')
    const complexFilter = this.composition.composite(sceneInfos)
    await runRawFfmpeg(
      `${inputArgs} -i ${projectDir}/input.mp3 -filter_complex ${complexFilter} -map [v] -map ${sceneInfos.length} -s ${imgSize.width}x${imgSize.height} ${projectDir}/concat.mp4`,
    )
    return {
      sceneInfos,
      outputVideo: `${projectDir}/concat.mp4`,
    }
  }

  private async drawSubtitles({
    projectDir,
    concatedVideo,
    sceneInfos,
    textOption,
  }: DrawSubtitleOptions) {
    const vfArgs = sceneInfos
      .flatMap((it, index) => {
        return it.words.map((word, j) => {
          return `drawtext=fontfile=./assets/Resolve.otf:textfile=${subtitleDir(projectDir)}/${index}_${j}.txt:x=(w-text_w)/2:y=(h-text_h)/2:fontsize=${textOption.fontSize}:fontcolor=${textOption.color}:enable='between(t,${word.start},${word.end})'`
        })
      })
      .join(',')
    await runRawFfmpeg(
      `-i ${concatedVideo} -vf ${vfArgs} ${projectDir}/draw_text.mp4`,
    )
  }

  async getAllSceneInfo(projectDir: string) {
    async function readScriptFile(): Promise<ScriptFile> {
      const jsonFile = await fs.readFile(`${projectDir}/script.json`, 'utf8')
      return JSON.parse(jsonFile) as ScriptFile
    }

    await prepFolder(subtitleDir(projectDir))
    const { scenes } = await readScriptFile()
    const srtContent = await fs.readFile(`${projectDir}/words.srt`, 'utf8')
    const srts = this.srtParser.fromSrt(srtContent)
    const srtChars = srts.map((it) => it.text).join('') // flat srt words to one-line characters, prepare for edit distance
    const sceneInfos: SceneInfo[] = []

    /*
      because we only know the character index in edit distance,
      so we need map word index with its character [start, end] index
     */
    const wordIndexWithCharacterIndex = []
    for (const srt of srts) {
      if (wordIndexWithCharacterIndex.length === 0) {
        wordIndexWithCharacterIndex.push([0, srt.text.length])
      } else {
        const last =
          wordIndexWithCharacterIndex[wordIndexWithCharacterIndex.length - 1]
        wordIndexWithCharacterIndex.push([last[1], last[1] + srt.text.length])
      }
    }
    let startIndex = 0
    let srtStartWordIndex = -1
    for (const scene of scenes) {
      let minEditDistance = scene.narration.length
      let minEditDistanceEndCharIndex = 0
      for (
        let i = startIndex;
        i < startIndex + scene.narration.length + 20;
        i++
      ) {
        const subSrtChars = srtChars.slice(startIndex, i)
        const editDistance = levenshteinEditDistance(
          scene.narration,
          subSrtChars,
          false,
        )
        if (editDistance < minEditDistance) {
          minEditDistance = editDistance
          minEditDistanceEndCharIndex = i
        }
      }

      const srtEndWordIndex = wordIndexWithCharacterIndex.findIndex(
        (it) =>
          minEditDistanceEndCharIndex >= it[0] &&
          minEditDistanceEndCharIndex <= it[1],
      )
      const words = srts
        .slice(srtStartWordIndex + 1, srtEndWordIndex + 1)
        .map((it) => {
          return {
            start: it.startSeconds,
            end: it.endSeconds,
            text: it.text,
          }
        })
      startIndex = minEditDistanceEndCharIndex
      sceneInfos.push({
        number: scene.scene_number,
        start: srts[srtStartWordIndex + 1].startSeconds,
        end: srts[srtEndWordIndex].endSeconds,
        duration:
          srts[srtEndWordIndex].endSeconds -
          (sceneInfos.length === 0
            ? srts[srtStartWordIndex + 1].startSeconds
            : sceneInfos[sceneInfos.length - 1].end),
        words,
      })
      for (let j = 0; j < words.length; j++) {
        await fs.writeFile(
          `${subtitleDir(projectDir)}/${scene.scene_number - 1}_${j}.txt`,
          words[j].text,
        )
      }
      srtStartWordIndex = srtEndWordIndex
    }
    return sceneInfos
  }
}
