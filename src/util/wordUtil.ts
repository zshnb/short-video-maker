export function removeWordSymbol(word: string) {
  return word.replace(/[!,.]/g, '')
}
