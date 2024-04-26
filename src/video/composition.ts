import { Injectable } from '@nestjs/common'
import { animation } from './animation'
import { transition } from './transition'
import { SceneInfo } from './types'

@Injectable()
export class Composition {
  composite(sceneInfos: SceneInfo[], xFadeDuration: number) {
    const { zoompan } = animation()
    const { xFade } = transition()

    const zoompanFilter = sceneInfos
      .map((scene, index) => {
        const zoomOutFilter = zoompan(index, scene)
        return `[${index}:v]${zoomOutFilter}[v${index}]`
      })
      .join(';')

    let previousOffset = 0
    const xFadeFilter = sceneInfos
      .map((scene, index) => {
        const offset = scene.duration + previousOffset - xFadeDuration
        previousOffset = offset
        const fadeFilter = xFade({
          transition: 'slideleft',
          duration: xFadeDuration,
          offset,
        })
        if (index === 0) {
          return `[v${index}][v${index + 1}]${fadeFilter}[x${index}]`
        } else if (index < sceneInfos.length - 1) {
          let filter = `[x${index - 1}][v${index + 1}]${fadeFilter}`
          if (index !== sceneInfos.length - 2) {
            filter = `${filter}[x${index}]`
          }
          return filter
        } else {
          return undefined
        }
      })
      .filter((it) => it !== undefined)
      .join(';')

    const complexFilter = `${zoompanFilter};${xFadeFilter},format=yuv420p[v]`
    return complexFilter
  }
}
