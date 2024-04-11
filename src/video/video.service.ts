import { Injectable } from '@nestjs/common'
import { getLogger } from '../logger'
import { runRawFfmpeg } from '../util/ffmpegUtil'
import ShortUniqueId from 'short-unique-id'
import { localProjectPath, tmpDir } from '../util/pathUtil'
import * as fs from 'fs/promises'

const logger = getLogger('video-service')
@Injectable()
export class VideoService {
  async generateShorts() {
    logger.info('start generate shorts')
    const projectId = new ShortUniqueId({ length: 6 })
    const projectDir = localProjectPath(projectId.rnd())
    await this.prepareData(projectDir)
    await runRawFfmpeg(
      `-safe 0 -f concat -i ${projectDir}/input.txt -i ${projectDir}/input.mp3 -vsync vfr -pix_fmt yuv420p ${projectDir}/output.mp4`,
    )
  }

  private async prepareData(projectDir: string) {
    await fs.cp(`${tmpDir}/test_data`, projectDir, { recursive: true })
    async function generateConcatFile() {
      const files = await fs.readdir(projectDir)
      const fileContent = files
        .filter((it) => it.endsWith('.png'))
        .sort((a, b) => {
          const aIndex = a.split('_')[1]
          const bIndex = b.split('_')[1]
          return parseInt(aIndex) < parseInt(bIndex) ? -1 : 1
        })
        .map((it) => {
          return `file './${it}'\nduration 3`
        })
        .join('\n')
      await fs.writeFile(`${projectDir}/input.txt`, fileContent, {
        encoding: 'utf8',
      })
    }
    await generateConcatFile()
  }
}
