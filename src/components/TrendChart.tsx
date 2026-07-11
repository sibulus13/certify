'use client'

import { useState } from 'react'
import { trendGeometry } from '@/lib/trend-chart'

export type TrendDatum = { pct: number; label: string }

const WIDTH = 640
const HEIGHT = 240
const PAD = 28

/**
 * Dependency-free SVG line chart of score % over successive attempts.
 * Hover a point to see its exam + date. Theme-matched to the app (slate/sky).
 */
export function TrendChart({ data }: { data: TrendDatum[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const { points, line, area } = trendGeometry(
    data.map((d) => d.pct),
    WIDTH,
    HEIGHT,
    PAD
  )

  // Horizontal gridlines at 0/50/70/100% (70 = AWS pass line).
  const gridY = [0, 50, 70, 100].map((v) => ({
    v,
    y: PAD + (1 - v / 100) * (HEIGHT - PAD * 2),
  }))

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full min-w-[520px]"
        role="img"
        aria-label="Score trend over attempts"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(56 189 248)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="rgb(56 189 248)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridY.map((g) => (
          <g key={g.v}>
            <line
              x1={PAD}
              x2={WIDTH - PAD}
              y1={g.y}
              y2={g.y}
              stroke={g.v === 70 ? 'rgb(16 185 129 / 0.35)' : 'rgb(51 65 85 / 0.5)'}
              strokeDasharray={g.v === 70 ? '4 4' : undefined}
            />
            <text x={4} y={g.y + 4} fontSize="10" fill="rgb(100 116 139)">
              {g.v}
            </text>
          </g>
        ))}

        {area && <path d={area} fill="url(#trendFill)" />}
        {line && <path d={line} fill="none" stroke="rgb(56 189 248)" strokeWidth="2" />}

        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === i ? 5 : 3.5}
              fill={data[i].pct >= 70 ? 'rgb(16 185 129)' : 'rgb(244 63 94)'}
              stroke="rgb(2 6 23)"
              strokeWidth="1.5"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}

        {hover !== null && points[hover] && (
          <g>
            <rect
              x={Math.min(Math.max(points[hover].x - 70, 2), WIDTH - 142)}
              y={Math.max(points[hover].y - 42, 2)}
              width="140"
              height="34"
              rx="6"
              fill="rgb(15 23 42)"
              stroke="rgb(51 65 85)"
            />
            <text
              x={Math.min(Math.max(points[hover].x - 70, 2), WIDTH - 142) + 8}
              y={Math.max(points[hover].y - 42, 2) + 15}
              fontSize="11"
              fill="rgb(226 232 240)"
            >
              {data[hover].pct}% — {data[hover].label}
            </text>
            <text
              x={Math.min(Math.max(points[hover].x - 70, 2), WIDTH - 142) + 8}
              y={Math.max(points[hover].y - 42, 2) + 28}
              fontSize="10"
              fill="rgb(100 116 139)"
            >
              attempt {hover + 1} of {data.length}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
