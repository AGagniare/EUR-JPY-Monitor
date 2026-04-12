/**
 * Simple Moving Average
 * @param {number[]} data
 * @param {number} period
 * @returns {(number|null)[]}
 */
export function sma(data, period) {
  if (period <= 0) throw new RangeError(`period must be >= 1, got ${period}`)
  return data.map((_, i) => {
    if (i < period - 1) return null
    const slice = data.slice(i - period + 1, i + 1)
    return slice.reduce((a, b) => a + b, 0) / period
  })
}

/**
 * Wilder RSI
 * @param {number[]} closes
 * @param {number} period
 * @returns {(number|null)[]}
 */
export function rsi(closes, period = 14) {
  if (period <= 0) throw new RangeError(`period must be >= 1, got ${period}`)
  const results = closes.map(() => null)
  if (closes.length < period + 1) return results

  const changes = closes.slice(1).map((v, i) => v - closes[i])

  // Seed with simple average of first period
  let avgGain = 0, avgLoss = 0
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i]
    else avgLoss += Math.abs(changes[i])
  }
  avgGain /= period
  avgLoss /= period
  results[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  // Wilder smoothing for subsequent values
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    results[i + 1] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }

  return results
}

/**
 * Bollinger Bands (population std dev)
 * @param {number[]} data
 * @param {number} period
 * @param {number} stdDevMultiplier
 * @returns {{ upper: number|null, middle: number|null, lower: number|null }[]}
 */
export function bollingerBands(data, period = 20, stdDevMultiplier = 2) {
  if (period <= 0) throw new RangeError(`period must be >= 1, got ${period}`)
  const middles = sma(data, period)
  return data.map((_, i) => {
    if (middles[i] === null) return { upper: null, middle: null, lower: null }
    const slice = data.slice(i - period + 1, i + 1)
    const mean = middles[i]
    const variance = slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period
    const stdDev = Math.sqrt(variance)
    return {
      upper: mean + stdDevMultiplier * stdDev,
      middle: mean,
      lower: mean - stdDevMultiplier * stdDev,
    }
  })
}
