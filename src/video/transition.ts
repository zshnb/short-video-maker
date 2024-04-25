export type xFadeParams = {
  transition: string
  duration: number
  offset: number
}
export function transition() {
  function fade() {
    return 'fade=t=in:st=0:d=1'
  }

  function xFade({ transition, duration, offset }: xFadeParams) {
    return `xfade=transition=${transition}:duration=${duration}:offset=${offset}`
  }

  return {
    fade,
    xFade,
  }
}
