'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getHistory, clearHistory, type AttemptRecord } from '@/lib/history'
import { TrendChart } from './TrendChart'

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  return `${m}m ${sec % 60}s`
}

export function ProgressView() {
  const [history, setHistory] = useState<AttemptRecord[] | null>(null)
  const [examFilter, setExamFilter] = useState<string>('all')

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const exams = useMemo(() => {
    if (!history) return []
    const seen = new Map<string, string>()
    for (const r of history) seen.set(r.examId, r.examTitle)
    return [...seen.entries()].map(([id, title]) => ({ id, title }))
  }, [history])

  const filtered = useMemo(() => {
    if (!history) return []
    const rows = examFilter === 'all' ? history : history.filter((r) => r.examId === examFilter)
    return [...rows].sort((a, b) => a.completedAt.localeCompare(b.completedAt))
  }, [history, examFilter])

  const summary = useMemo(() => {
    if (filtered.length === 0) return null
    const pcts = filtered.map((r) => r.pct)
    const best = Math.max(...pcts)
    const avg = Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length)
    const latest = pcts[pcts.length - 1]
    const first = pcts[0]
    return { attempts: filtered.length, best, avg, latest, delta: latest - first }
  }, [filtered])

  // Aggregate weak topics across the filtered attempts.
  const weakTopics = useMemo(() => {
    const totals = new Map<string, number>()
    for (const r of filtered) {
      for (const w of r.weakTopics ?? []) {
        totals.set(w.topic, (totals.get(w.topic) ?? 0) + w.missed)
      }
    }
    return [...totals.entries()]
      .map(([topic, missed]) => ({ topic, missed }))
      .sort((a, b) => b.missed - a.missed)
      .slice(0, 8)
  }, [filtered])

  if (history === null) {
    return <div className="mx-auto max-w-4xl px-6 py-16 text-slate-500">Loading…</div>
  }

  if (history.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold text-white mb-3">No attempts yet</h1>
        <p className="text-slate-400 mb-6">
          Finish a practice exam and your score trend will show up here.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-400 transition-colors"
        >
          Browse exams
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white">Your progress</h1>
        {exams.length > 1 && (
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="all">All exams</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Tile label="Attempts" value={String(summary.attempts)} />
          <Tile label="Best" value={`${summary.best}%`} accent="emerald" />
          <Tile label="Average" value={`${summary.avg}%`} />
          <Tile
            label="Trend"
            value={`${summary.delta >= 0 ? '+' : ''}${summary.delta}%`}
            accent={summary.delta >= 0 ? 'emerald' : 'rose'}
          />
        </div>
      )}

      {/* Trend chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 mb-8">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">
          Score trend {examFilter === 'all' ? '(all exams)' : ''}
        </h2>
        {filtered.length >= 2 ? (
          <TrendChart data={filtered.map((r) => ({ pct: r.pct, label: `${r.examTitle} · ${fmtDate(r.completedAt)}` }))} />
        ) : (
          <p className="text-sm text-slate-500 py-8 text-center">
            Take this exam at least twice to see a trend line.
          </p>
        )}
      </div>

      {/* Weak topics rollup */}
      {weakTopics.length > 0 && (
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-6 mb-8">
          <h2 className="text-sm font-semibold text-amber-300 mb-1">What to study next</h2>
          <p className="text-xs text-slate-500 mb-4">
            Topics you&apos;ve missed most across these attempts.
          </p>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((w) => (
              <span
                key={w.topic}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300"
              >
                {w.topic}
                <span className="text-rose-300">{w.missed}×</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Attempts table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-500">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Exam</th>
              <th className="text-right font-medium px-4 py-2.5">Score</th>
              <th className="text-right font-medium px-4 py-2.5 hidden sm:table-cell">Time</th>
              <th className="text-right font-medium px-4 py-2.5">Date</th>
            </tr>
          </thead>
          <tbody>
            {[...filtered].reverse().map((r) => (
              <tr key={r.id} className="border-t border-slate-800/60">
                <td className="px-4 py-2.5 text-slate-300">{r.examTitle}</td>
                <td className={['px-4 py-2.5 text-right font-medium', r.pct >= 70 ? 'text-emerald-400' : 'text-rose-400'].join(' ')}>
                  {r.pct}%
                </td>
                <td className="px-4 py-2.5 text-right text-slate-500 hidden sm:table-cell">{fmtTime(r.timeSeconds)}</td>
                <td className="px-4 py-2.5 text-right text-slate-500">{fmtDate(r.completedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={() => {
            if (confirm('Clear all local progress history? This cannot be undone.')) {
              clearHistory()
              setHistory([])
            }
          }}
          className="text-xs text-slate-600 hover:text-rose-400 transition-colors"
        >
          Clear history
        </button>
      </div>
    </div>
  )
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: 'emerald' | 'rose' }) {
  const color = accent === 'emerald' ? 'text-emerald-400' : accent === 'rose' ? 'text-rose-400' : 'text-white'
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={['text-2xl font-bold mt-0.5', color].join(' ')}>{value}</p>
    </div>
  )
}
