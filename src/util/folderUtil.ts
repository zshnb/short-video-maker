import { mkdir } from 'fs/promises'

export function prepFolder(path: string) {
  return mkdir(path, { recursive: true })
}
