import * as fs from 'fs'

export const tmpDir = './tmp'
export function localProjectPath(projectId: string) {
  const path = `${tmpDir}/${projectId}`
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, {
      recursive: true,
    })
  }
  return path
}

export function subtitleDir(projectDir: string) {
  return `${projectDir}/subtitle`
}
