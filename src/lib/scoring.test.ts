import { describe, it, expect } from 'vitest'
import { isAnswerCorrect } from './scoring'
import type { OptionId } from './types'

describe('isAnswerCorrect', () => {
  describe('single-select', () => {
    it('correct single answer', () => {
      expect(isAnswerCorrect(['A'], ['A'])).toBe(true)
    })

    it('wrong single answer', () => {
      expect(isAnswerCorrect(['B'], ['A'])).toBe(false)
    })

    it('no selection', () => {
      expect(isAnswerCorrect([], ['A'])).toBe(false)
    })

    it('extra selection on single-answer question', () => {
      expect(isAnswerCorrect(['A', 'B'], ['A'])).toBe(false)
    })
  })

  describe('multi-select', () => {
    it('all correct — exact match', () => {
      expect(isAnswerCorrect(['A', 'C'], ['A', 'C'])).toBe(true)
    })

    it('correct answers in different order', () => {
      expect(isAnswerCorrect(['C', 'A'], ['A', 'C'])).toBe(true)
    })

    it('subset of correct answers', () => {
      expect(isAnswerCorrect(['A'], ['A', 'C'])).toBe(false)
    })

    it('superset of correct answers', () => {
      expect(isAnswerCorrect(['A', 'B', 'C'], ['A', 'C'])).toBe(false)
    })

    it('completely wrong answers', () => {
      expect(isAnswerCorrect(['B', 'D'], ['A', 'C'])).toBe(false)
    })

    it('one correct one wrong', () => {
      expect(isAnswerCorrect(['A', 'D'], ['A', 'C'])).toBe(false)
    })

    it('three-option correct', () => {
      const selected: OptionId[] = ['A', 'B', 'C']
      const correct: OptionId[] = ['A', 'B', 'C']
      expect(isAnswerCorrect(selected, correct)).toBe(true)
    })

    it('no selection on multi-select', () => {
      expect(isAnswerCorrect([], ['A', 'B'])).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('all five options correct', () => {
      const all: OptionId[] = ['A', 'B', 'C', 'D', 'E']
      expect(isAnswerCorrect(all, all)).toBe(true)
    })

  })
})
