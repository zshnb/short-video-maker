import pino, { Level } from 'pino'
import { ChildProcessPromise } from 'child-process-promise'

function buildRootLogger() {
  const isTty = process.stdout.isTTY
  const transport = isTty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      }
    : undefined
  return pino({
    level: 'debug',
    transport,
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
      bindings: () => {
        return {}
      },
    },
    timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  })
}

// create pino logger
const rootLogger = buildRootLogger()
setLevel('debug' as Level)

export function setLevel(level: Level) {
  rootLogger.level = level
}

type LoggerWithDump = pino.Logger & {
  dump: (prefix: string, object: unknown) => Promise<void>
}

/**
 * returns a logger with a name
 * with additional ".dump" method
 */
export function getLogger(name: string): LoggerWithDump {
  const logger = rootLogger.child({ name }) as LoggerWithDump
  return logger
}

/**
 * given a child process promise, e.g. return value of spawn
 * log its stdout and stderr to the given logger
 */
export function logChildProcess<T>(
  logger: pino.Logger,
  p: ChildProcessPromise<T>,
) {
  p.childProcess.stdout?.on('data', (data: Buffer) => {
    data
      .toString()
      .split('\n')
      .forEach((line) => {
        if (line) logger.debug(line.trim())
      })
  })
  p.childProcess.stderr?.on('data', (data: Buffer) => {
    data
      .toString()
      .split('\n')
      .forEach((line) => {
        if (line) logger.error('stderr: %s', line.trim())
      })
  })
}
