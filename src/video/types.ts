export type ScriptFile = {
  title: string
  scenes: {
    scene_number: number
    narration: string
  }[]
}

export type SceneInfo = {
  number: number
  start: number
  end: number
  duration: number
  words: {
    text: string
    start: number
    end: number
  }[]
}

export type DrawSubtitleOptions = {
  projectDir: string
  concatedVideo: string
  sceneInfos: SceneInfo[]
  textOption: {
    color: string
    fontSize: number
  }
}
