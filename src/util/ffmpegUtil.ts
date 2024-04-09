import { spawn } from 'child-process-promise'
import { getLogger } from '../logger'

const logger = getLogger('ffmpegUtil')
export async function runRawFfmpeg(ffmpegCommand: string): Promise<number> {
  const stderr: string[] = []
  const start = Date.now()
  logger.info(`Run ffmpeg cmd: ffmpeg ${ffmpegCommand}`)
  return new Promise((res, rej) => {
    const p = spawn(
      'ffmpeg',
      ['-loglevel', 'error'].concat(ffmpegCommand.split(' ')),
    )
    p.childProcess.stderr?.on('data', (data: Buffer) => {
      data
        .toString()
        .split('\n')
        .forEach((line: string) => {
          if (line) {
            logger.info('ffmpeg stdout: %s', line.trim())
            stderr.push(line)
          }
        })
    })

    p.childProcess.on('error', (err) => {
      const error = err as Error
      logger.error(err, `ffmpeg error: ${error.message}}`)
      rej(new Error(error.message))
    })

    p.childProcess.on('exit', (code) => {
      logger.info(
        `ffmpeg ${ffmpegCommand} exited with code ${code}, cost ${Date.now() - start}ms`,
      )
      if (code !== 0) {
        rej(new Error(stderr[0]))
      } else {
        res(Date.now() - start)
      }
    })
  })
}
