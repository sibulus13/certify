import type { OptionId } from './types'

export function isAnswerCorrect(selected: OptionId[], correctAnswers: OptionId[]): boolean {
  return (
    selected.length === correctAnswers.length &&
    selected.every((s) => correctAnswers.includes(s))
  )
}
