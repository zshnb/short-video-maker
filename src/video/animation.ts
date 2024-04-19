import { SceneInfo } from './types'

export function animation(sceneInfos: SceneInfo[]) {
  function zoompan() {
    const directions = [
      "x='x-10':y='y'",
      "x='x+10':y='y'",
      "y='if(gte(ih,y),ih,y)-10':x='x'",
      "y='y+10':x='x'",
    ]
    let complexFilter = sceneInfos
      .map(
        (scene, index) =>
          `[${index}:v]scale=8000x4000,zoompan=z='min(zoom+0.0015,1.5)':${directions[index % directions.length]}:d=${Math.round(25 * scene.duration)}[v${index}]`,
      )
      .join(';')

    const videoSymbols = sceneInfos.map((_, index) => `[v${index}]`).join('')
    complexFilter += `;${videoSymbols}concat=n=${sceneInfos.length}:v=1:a=0,format=yuv420p[v]`
    return complexFilter
  }

  return {
    zoompan,
  }
}
