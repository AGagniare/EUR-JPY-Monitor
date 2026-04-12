import { useState, useEffect, useRef } from 'react'

const LIVE_URL = 'https://open.er-api.com/v6/latest/EUR'
const LIVE_CACHE = 'eurjpy_live'
const HIST_CACHE = 'eurjpy_hist'

async function fetchHistorical(days) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  const fmt = (d) => d.toISOString().split('T')[0]
  const url = `https://api.frankfurter.app/${fmt(start)}..${fmt(end)}?from=EUR&to=JPY`
  const res = await fetch(url)
  const data = await res.json()
  return Object.entries(data.rates)
    .map(([date, v]) => ({ date, rate: v.JPY }))
    .sort((a, b) => a.date.localeCompare(b.date))
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
 * }}
 */
export function useEURJPY(days = 365) {
  const [liveRate, setLiveRate] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(LIVE_CACHE)) } catch { return null }
  })
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(HIST_CACHE)) ?? [] } catch { return [] }
  })
  const [loading, setLoading] = useState(!liveRate)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  async function refreshLive() {
    try {
      const res = await fetch(LIVE_URL)
      const data = await res.json()
      const rate = data?.rates?.JPY
      if (rate) {
        setLiveRate(rate)
        setLastUpdated(new Date())
        sessionStorage.setItem(LIVE_CACHE, JSON.stringify(rate))
      }
    } catch { /* keep last known rate */ }
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      await refreshLive()
      try {
        const hist = await fetchHistorical(days)
        if (!cancelled) {
          setHistory(hist)
          sessionStorage.setItem(HIST_CACHE, JSON.stringify(hist))
        }
      } catch { /* keep cached */ }
      finally { if (!cancelled) setLoading(false) }
    }
    init()
    timerRef.current = setInterval(refreshLive, 60_000)
    return () => { cancelled = true; clearInterval(timerRef.current) }
  }, [days])

  return { liveRate, history, loading, lastUpdated }
}
