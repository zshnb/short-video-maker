import { Injectable } from '@nestjs/common'
import { animation } from './animation'
import { transition } from './transition'
import { SceneInfo } from './types'

@Injectable()
export class Composition {
  composite(sceneInfos: SceneInfo[]) {
    const { zoompan } = animation()
    const { fade } = transition()

    let complexFilter = sceneInfos
      .map((scene, index) => {
        const zoomOutFilter = zoompan(index, scene)
        const fadeFilter = fade()

        return `[${index}:v]${zoomOutFilter},${fadeFilter}[v${index}]`
      })
      .join(';')
    const videoSymbols = sceneInfos.map((_, index) => `[v${index}]`).join('')
    complexFilter += `;${videoSymbols}concat=n=${sceneInfos.length}:v=1:a=0,format=yuv420p[v]`
    return complexFilter
  }
}
