import { useState, useEffect, useRef } from 'react'

async function fetchHistorical(base, quote, days) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  const fmt = (d) => d.toISOString().split('T')[0]
  const urls = [
    `https://api.frankfurter.dev/v1/${fmt(start)}..${fmt(end)}?base=${base}&symbols=${quote}`,
    `https://api.frankfurter.app/${fmt(start)}..${fmt(end)}?from=${base}&to=${quote}`,
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
        .map(([date, v]) => ({ date, rate: v[quote] ?? v[quote.toLowerCase()] }))
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
 * useCurrencyPair — live rate + historical daily data for any currency pair.
 *
 * @param {string} base   Base currency (default 'EUR')
 * @param {string} quote  Quote currency (default 'JPY')
 * @param {number} days   Calendar days of history to fetch (default 365)
 * @returns {{
 *   liveRate: number | null,
 *   history: { date: string, rate: number }[],
 *   loading: boolean,
 *   lastUpdated: Date | null,
 *   histError: string | null,
 * }}
 */
export function useCurrencyPair(base = 'EUR', quote = 'JPY', days = 365) {
  const liveKey = `${base}${quote}_live`
  const histKey = `${base}${quote}_hist`

  const [liveRate, setLiveRate] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(liveKey)) } catch { return null }
  })
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(histKey)) ?? [] } catch { return [] }
  })
  const [loading, setLoading] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(liveKey)) == null } catch { return true }
  })
  const [lastUpdated, setLastUpdated] = useState(null)
  const [histError, setHistError] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    // Reset to cached values for the new pair immediately
    setLiveRate(() => {
      try { return JSON.parse(sessionStorage.getItem(liveKey)) } catch { return null }
    })
    setHistory(() => {
      try { return JSON.parse(sessionStorage.getItem(histKey)) ?? [] } catch { return [] }
    })
    setHistError(null)

    async function refreshLive() {
      const urls = [
        `https://api.frankfurter.dev/v1/latest?from=${base}&to=${quote}`,
        `https://api.frankfurter.app/latest?from=${base}&to=${quote}`,
      ]
      for (const url of urls) {
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          const rate = data?.rates?.[quote]
          if (!rate) throw new Error('No rate in response')
          if (!cancelled) {
            setLiveRate(rate)
            setLastUpdated(new Date())
            sessionStorage.setItem(liveKey, JSON.stringify(rate))
          }
          return
        } catch (e) {
          console.warn(`Live rate fetch failed for ${url}:`, e)
        }
      }
      /* all sources failed — keep last known rate */
    }

    async function init() {
      const cached = (() => { try { return JSON.parse(sessionStorage.getItem(liveKey)) } catch { return null } })()
      if (!cached) setLoading(true)
      await refreshLive()
      try {
        const hist = await fetchHistorical(base, quote, days)
        if (!cancelled) {
          setHistory(hist)
          sessionStorage.setItem(histKey, JSON.stringify(hist))
        }
      } catch (e) {
        console.error('Historical fetch failed:', e)
        if (!cancelled) setHistError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    timerRef.current = setInterval(refreshLive, 60_000)
    return () => { cancelled = true; clearInterval(timerRef.current) }
  }, [base, quote, days]) // eslint-disable-line react-hooks/exhaustive-deps

  return { liveRate, history, loading, lastUpdated, histError }
}
