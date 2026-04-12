import { useState, useEffect, useRef } from 'react'

const LIVE_URL = 'https://open.er-api.com/v6/latest/EUR'
const LIVE_CACHE = 'eurjpy_live'
const HIST_CACHE = 'eurjpy_hist'

async function fetchHistorical(days) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  const fmt = (d) => d.toISOString().split('T')[0]
  // Try frankfurter.dev (community-maintained) first, fall back to frankfurter.app
  const urls = [
    `https://api.frankfurter.dev/v1/${fmt(start)}..${fmt(end)}?base=EUR&symbols=JPY`,
    `https://api.frankfurter.app/${fmt(start)}..${fmt(end)}?from=EUR&to=JPY`,
  ]
  let lastErr
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const rates = data.rates ?? data.Rates
      if (!rates) throw new Error('No rates field in response')
      return Object.entries(rates)
        .map(([date, v]) => ({ date, rate: v.JPY ?? v.jpy }))
        .filter((r) => r.rate != null)
        .sort((a, b) => a.date.localeCompare(b.date))
    } catch (e) {
      lastErr = e
      console.warn(`fetchHistorical failed for ${url}:`, e)
    }
  }
  throw lastErr
}

/**
 * useEURJPY — live EUR/JPY rate + historical daily data.
 *
 * @param {number} days  Calendar days of history to fetch (default 365)
 * @returns {{
 *   liveRate: number | null,
 *   history: { date: string, rate: number }[],
 *   loading: boolean,
 *   lastUpdated: Date | null,
 *   histError: string | null,
 * }}
 */
export function useEURJPY(days = 365) {
  const [liveRate, setLiveRate] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(LIVE_CACHE)) } catch { return null }
  })
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(HIST_CACHE)) ?? [] } catch { return [] }
  })
  const [loading, setLoading] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(LIVE_CACHE)) == null } catch { return true }
  })
  const [lastUpdated, setLastUpdated] = useState(null)
  const [histError, setHistError] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function refreshLive() {
      try {
        const res = await fetch(LIVE_URL)
        if (!res.ok) throw new Error(`Live rate fetch failed: ${res.status}`)
        const data = await res.json()
        const rate = data?.rates?.JPY
        if (rate) {
          setLiveRate(rate)
          setLastUpdated(new Date())
          sessionStorage.setItem(LIVE_CACHE, JSON.stringify(rate))
        }
      } catch { /* keep last known rate */ }
    }

    async function init() {
      if (!liveRate) setLoading(true)
      await refreshLive()
      try {
        const hist = await fetchHistorical(days)
        if (!cancelled) {
          setHistory(hist)
          sessionStorage.setItem(HIST_CACHE, JSON.stringify(hist))
        }
      } catch (e) {
        console.error('Historical fetch failed:', e)
        if (!cancelled) setHistError(e.message)
      } finally { if (!cancelled) setLoading(false) }
    }
    init()
    timerRef.current = setInterval(refreshLive, 60_000)
    return () => { cancelled = true; clearInterval(timerRef.current) }
  }, [days])

  return { liveRate, history, loading, lastUpdated, histError }
}
