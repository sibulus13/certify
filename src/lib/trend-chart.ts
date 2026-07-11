/**
 * Pure geometry for the score-trend line chart. Kept separate from the React
 * component so the path math is unit-testable. Values are percentages in [0, 100],
 * plotted evenly spaced along x in chronological (attempt) order — a time-ordered
 * series. y is inverted because SVG's origin is top-left.
 */

export type ChartPoint = { x: number; y: number }

export type TrendGeometry = {
  points: ChartPoint[]
  /** SVG path `d` for the line */
  line: string
  /** SVG path `d` for the filled area under the line */
  area: string
}

export function trendGeometry(
  values: number[],
  width: number,
  height: number,
  pad: number
): TrendGeometry {
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const n = values.length

  const clampPct = (v: number) => Math.max(0, Math.min(100, v))

  const xAt = (i: number) => (n <= 1 ? pad + innerW / 2 : pad + (i / (n - 1)) * innerW)
  const yAt = (v: number) => pad + (1 - clampPct(v) / 100) * innerH

  const points: ChartPoint[] = values.map((v, i) => ({ x: xAt(i), y: yAt(v) }))

  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const baseline = (height - pad).toFixed(1)
  const area =
    points.length === 0
      ? ''
      : `${line} L ${points[n - 1].x.toFixed(1)} ${baseline} L ${points[0].x.toFixed(1)} ${baseline} Z`

  return { points, line, area }
}
