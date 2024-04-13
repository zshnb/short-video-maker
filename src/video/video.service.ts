import { Injectable } from '@nestjs/common'
import { getLogger } from '../logger'
import { runRawFfmpeg } from '../util/ffmpegUtil'
import ShortUniqueId from 'short-unique-id'
import { localProjectPath, subtitleDir, tmpDir } from '../util/pathUtil'
import * as fs from 'fs/promises'
import { SceneInfo, ScriptFile } from './types'
import srtParser2 from 'srt-parser-2'
import { removeWordSymbol } from '../util/wordUtil'
import { prepFolder } from '../util/folderUtil'

const logger = getLogger('video-service')
@Injectable()
export class VideoService {
  private srtParser: srtParser2
  constructor() {
    this.srtParser = new srtParser2()
  }
  async generateShorts() {
    logger.info('start generate shorts')
    const projectId = new ShortUniqueId({ length: 6 })
    const projectDir = localProjectPath(projectId.rnd())
    const { sceneInfos, outputVideo } =
      await this.concatImageToVideo(projectDir)
    await this.drawSubtitles(projectDir, outputVideo, sceneInfos)
  }

  private async concatImageToVideo(projectDir: string) {
    await fs.cp(`test_data/test_data_m2`, projectDir, { recursive: true })
    const sceneInfos = await this.getAllSceneInfo(projectDir)
    await this.prepareData(projectDir, sceneInfos)
    await runRawFfmpeg(
      `-safe 0 -f concat -i ${projectDir}/input.txt -i ${projectDir}/input.mp3 -vf fps=25 -vsync vfr -pix_fmt yuv420p ${projectDir}/concat.mp4`,
    )
    return {
      sceneInfos,
      outputVideo: `${projectDir}/concat.mp4`,
    }
  }

  private async drawSubtitles(
    projectDir: string,
    concatedVideo: string,
    sceneInfos: SceneInfo[],
  ) {
    const vfArgs = sceneInfos
      .flatMap((it, index) => {
        return it.words.map((word, j) => {
          return `drawtext=fontfile=./assets/Resolve.otf:textfile=${subtitleDir(projectDir)}/${index}_${j}.txt:x=(w-text_w)/2:y=(h-text_h)/2:fontsize=80:fontcolor=white:enable='between(t,${word.start},${word.end})'`
        })
      })
      .join(',')
    await runRawFfmpeg(
      `-i ${concatedVideo} -vf ${vfArgs} ${projectDir}/draw_text.mp4`,
    )
  }

  private async prepareData(projectDir: string, sceneTimeRanges: SceneInfo[]) {
    async function generateConcatFile() {
      const files = (await fs.readdir(projectDir))
        .filter((it) => it.endsWith('.png'))
        .sort((a, b) => {
          const aIndex = a.split('_')[1]
          const bIndex = b.split('_')[1]
          return parseInt(aIndex) < parseInt(bIndex) ? -1 : 1
        })
      const fileContent =
        files
          .map((it, index) => {
            return `file './${it}'\nduration ${sceneTimeRanges[index].duration}`
          })
          .join('\n') + `\nfile './${files[files.length - 1]}'`
      await fs.writeFile(`${projectDir}/input.txt`, fileContent, {
        encoding: 'utf8',
      })
    }
    await generateConcatFile()
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
    const sceneTimeRanges: SceneInfo[] = []
    let index = 0
    for (const { narration, scene_number } of scenes) {
      const words = narration.split(' ').map((it, index) => {
        return {
          start: srts[index].startSeconds,
          end: srts[index].endSeconds,
          text: it,
        }
      })
      const firstWord = removeWordSymbol(words[0].text)
      const lastWord = removeWordSymbol(words[words.length - 1].text)
      // what if index not exist?
      const firstSrtIndex = srts.findIndex((it) => it.text === firstWord)
      const lastSrtIndex = srts.findIndex((it) => it.text === lastWord)
      if (firstSrtIndex === -1 || lastSrtIndex === -1) {
        console.log(
          `first word: ${words[0]}, last word: ${words[words.length - 1]}`,
        )
      }
      sceneTimeRanges.push({
        number: scene_number,
        start: srts[firstSrtIndex].startSeconds,
        end: srts[lastSrtIndex].endSeconds,
        duration:
          srts[lastSrtIndex].endSeconds - srts[firstSrtIndex].startSeconds,
        words,
      })
      for (let j = 0; j < words.length; j++) {
        await fs.writeFile(
          `${subtitleDir(projectDir)}/${index}_${j}.txt`,
          words[j].text,
        )
      }
      srts.splice(firstSrtIndex, lastSrtIndex - firstSrtIndex + 1)
      index += 1
    }

    return sceneTimeRanges
  }
}
