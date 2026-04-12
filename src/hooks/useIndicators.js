import { useMemo } from 'react'
import { sma, rsi, bollingerBands } from '../utils/indicators'

/**
 * useIndicators — derives technical indicators from a prices array.
 *
 * @param {number[]} prices  Daily closing prices, ascending order
 * @returns {{
 *   sma7: (number|null)[],
 *   sma30: (number|null)[],
 *   rsi14: (number|null)[],
 *   bb: { upper: number|null, middle: number|null, lower: number|null }[],
 *   signal: 'GOOD' | 'NEUTRAL' | 'WAIT',
 *   latestRSI: number | null,
 *   latestSMA30: number | null,
 * }}
 */
export function useIndicators(prices) {
  return useMemo(() => {
    const empty = {
      sma7: [], sma30: [], rsi14: [], bb: [],
      signal: 'NEUTRAL', latestRSI: null, latestSMA30: null,
    }
    if (!prices || prices.length < 14) return empty

    const sma7 = sma(prices, 7)
    const sma30 = sma(prices, 30)
    const rsi14 = rsi(prices, 14)
    const bb = bollingerBands(prices, 20, 2)

    const latestRSI = rsi14[rsi14.length - 1]
    const latestSMA30 = sma30[sma30.length - 1]
    const latestPrice = prices[prices.length - 1]

    let signal = 'NEUTRAL'
    if (latestRSI !== null && latestSMA30 !== null) {
      if (latestRSI < 40 && latestPrice < latestSMA30) signal = 'GOOD'
      else if (latestRSI > 70) signal = 'WAIT'
    }

    return { sma7, sma30, rsi14, bb, signal, latestRSI, latestSMA30 }
  }, [prices])
}
