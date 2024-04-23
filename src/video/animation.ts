import { SceneInfo } from './types'

export function animation() {
  function zoompan(index: number, scene: SceneInfo) {
    const directions = [
      "x='x-10':y='y'",
      "x='x+10':y='y'",
      "y='if(gte(ih,y),ih,y)-10':x='x'",
      "y='y+10':x='x'",
    ]
    return `scale=8000x4000,zoompan=z='min(zoom+0.0015,1.5)':${directions[index % directions.length]}:d=${Math.round(25 * scene.duration)}`
  }

  return {
    zoompan,
  }
}
