import { describe, it, expect } from 'vitest'
import { sma, rsi, bollingerBands } from '../src/utils/indicators'

const RISING = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115]

describe('sma', () => {
  it('returns null for indices before period', () => {
    const result = sma([1, 2, 3, 4, 5], 3)
    expect(result[0]).toBeNull()
    expect(result[1]).toBeNull()
  })

  it('computes correct SMA at period boundary', () => {
    const result = sma([1, 2, 3, 4, 5], 3)
    expect(result[2]).toBeCloseTo(2)   // avg(1,2,3)
    expect(result[4]).toBeCloseTo(4)   // avg(3,4,5)
  })

  it('output length equals input length', () => {
    const result = sma([1, 2, 3, 4, 5], 3)
    expect(result).toHaveLength(5)
  })
})

describe('rsi', () => {
  it('returns null for first period indices', () => {
    const result = rsi(RISING, 14)
    for (let i = 0; i < 14; i++) expect(result[i]).toBeNull()
  })

  it('returns 100 on a continuously rising series', () => {
    const result = rsi(RISING, 14)
    expect(result[14]).toBeCloseTo(100, 0)
  })

  it('returns ~50 on alternating series', () => {
    const alternating = Array.from({ length: 30 }, (_, i) => 100 + (i % 2 === 0 ? 1 : -1))
    const result = rsi(alternating, 14)
    const last = result[result.length - 1]
    expect(last).toBeGreaterThan(40)
    expect(last).toBeLessThan(60)
  })

  it('output length equals input length', () => {
    expect(rsi(RISING, 14)).toHaveLength(RISING.length)
  })
})

describe('bollingerBands', () => {
  it('returns null bands for indices before period', () => {
    const data = Array.from({ length: 30 }, (_, i) => 100 + i)
    const result = bollingerBands(data, 20)
    expect(result[0]).toEqual({ upper: null, middle: null, lower: null })
    expect(result[18]).toEqual({ upper: null, middle: null, lower: null })
  })

  it('upper > middle > lower when period is met', () => {
    const data = Array.from({ length: 25 }, (_, i) => 100 + Math.sin(i))
    const result = bollingerBands(data, 20, 2)
    const band = result[20]
    expect(band.upper).toBeGreaterThan(band.middle)
    expect(band.lower).toBeLessThan(band.middle)
  })

  it('bands are symmetric around middle', () => {
    const data = Array.from({ length: 25 }, (_, i) => 100 + Math.sin(i))
    const result = bollingerBands(data, 20, 2)
    const band = result[20]
    expect(band.upper - band.middle).toBeCloseTo(band.middle - band.lower, 5)
  })
})
