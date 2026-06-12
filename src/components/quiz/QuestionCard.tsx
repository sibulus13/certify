'use client'

import type { Question, OptionId } from '@/lib/types'

type Props = {
  question: Question
  selected: OptionId[]
  onToggle: (id: OptionId) => void
  onSubmit: () => void
}

export function QuestionCard({ question, selected, onToggle, onSubmit }: Props) {
  const canSubmit = selected.length > 0

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {question.isMultiSelect && (
          <span className="inline-block rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-400 ring-1 ring-violet-500/20">
            Choose {question.correctAnswers.length}
          </span>
        )}
        <p className="text-lg text-white leading-relaxed">{question.text}</p>
      </div>

      <div className="space-y-2.5" role="group" aria-label="Answer options">
        {question.options.map((option) => {
          const isSelected = selected.includes(option.id)
          return (
            <button
              key={option.id}
              onClick={() => onToggle(option.id)}
              aria-pressed={isSelected}
              className={[
                'w-full flex items-start gap-3 rounded-lg border px-4 py-3.5 text-left text-sm transition-all',
                isSelected
                  ? 'border-sky-500 bg-sky-500/10 text-white'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800',
              ].join(' ')}
            >
              <span
                className={[
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold',
                  isSelected
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-800 text-slate-400',
                  question.isMultiSelect ? 'rounded' : 'rounded-full',
                ].join(' ')}
              >
                {option.id}
              </span>
              <span className="flex-1">{option.text}</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="mt-4 w-full rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-sky-400 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  )
}
