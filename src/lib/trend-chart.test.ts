import { describe, it, expect } from 'vitest'
import { trendGeometry } from './trend-chart'

describe('trendGeometry', () => {
  it('maps 0% to the bottom and 100% to the top of the plot area', () => {
    const { points } = trendGeometry([0, 100], 200, 100, 10)
    expect(points[0].y).toBeCloseTo(90) // 0% -> bottom (height - pad)
    expect(points[1].y).toBeCloseTo(10) // 100% -> top (pad)
  })

  it('spaces points evenly across the inner width', () => {
    const { points } = trendGeometry([50, 50, 50], 220, 100, 10)
    expect(points[0].x).toBeCloseTo(10)
    expect(points[1].x).toBeCloseTo(110)
    expect(points[2].x).toBeCloseTo(210)
  })

  it('centers a single point', () => {
    const { points } = trendGeometry([70], 200, 100, 10)
    expect(points[0].x).toBeCloseTo(100)
  })

  it('clamps out-of-range values into the plot area', () => {
    const { points } = trendGeometry([150, -20], 200, 100, 10)
    expect(points[0].y).toBeCloseTo(10) // clamped to 100%
    expect(points[1].y).toBeCloseTo(90) // clamped to 0%
  })

  it('starts the line path with M and continues with L', () => {
    const { line } = trendGeometry([10, 20, 30], 200, 100, 10)
    expect(line.startsWith('M')).toBe(true)
    expect((line.match(/L/g) ?? []).length).toBe(2)
  })

  it('closes the area path back to the baseline', () => {
    const { area } = trendGeometry([40, 60], 200, 100, 10)
    expect(area.endsWith('Z')).toBe(true)
  })

  it('returns an empty area for no data', () => {
    expect(trendGeometry([], 200, 100, 10).area).toBe('')
  })
})
