import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const TF_DAYS = { '1d': 1, '3d': 3, '7d': 7, '30d': 30 }
const TFS     = ['1d', '3d', '7d', '30d']

function lsKey(base, quote) {
  return `${base.toLowerCase()}${quote.toLowerCase()}_calls`
}

function loadCalls(base, quote) {
  try { return JSON.parse(localStorage.getItem(lsKey(base, quote))) ?? [] } catch { return [] }
}

async function fetchRateOnDate(dateStr, base, quote) {
  const urls = [
    `https://api.frankfurter.dev/v1/${dateStr}?base=${base}&symbols=${quote}`,
    `https://api.frankfurter.app/${dateStr}?from=${base}&to=${quote}`,
  ]
  for (const url of urls) {
    try {
      const res  = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      return data?.rates?.[quote] ?? null
    } catch { /* try next */ }
  }
  return null
}

export default function MyCalls({ liveRate, pair }) {
  const { base = 'EUR', quote = 'JPY', label = 'EUR/JPY', decimals = 2 } = pair ?? {}
  const [calls,      setCalls]      = useState(() => loadCalls(base, quote))
  const [direction,  setDirection]  = useState('UP')
  const [timeframe,  setTimeframe]  = useState('7d')
  const [confidence, setConfidence] = useState(3)

  // Reset calls when pair changes
  useEffect(() => { setCalls(loadCalls(base, quote)) }, [base, quote])

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(lsKey(base, quote), JSON.stringify(calls)) }, [calls, base, quote])

  // Auto-resolve matured calls
  useEffect(() => {
    const today   = new Date().toISOString().split('T')[0]
    const pending = calls.filter((c) => !c.result && c.resolveDate <= today)
    if (!pending.length) return

    Promise.all(
      pending.map(async (c) => {
        const endRate = await fetchRateOnDate(c.resolveDate, base, quote).catch(() => null)
        if (!endRate) return null
        const won =
          (c.direction === 'UP'   && endRate > c.entryRate) ||
          (c.direction === 'DOWN' && endRate < c.entryRate)
        return { id: c.id, endRate, result: won ? 'WIN' : 'LOSS' }
      })
    ).then((updates) => {
      setCalls((prev) =>
        prev.map((c) => {
          const u = updates.find((u) => u?.id === c.id)
          return u ? { ...c, endRate: u.endRate, result: u.result } : c
        })
      )
    })
  }, [calls])

  function addCall() {
    if (!liveRate) return
    const resolveDate = new Date()
    resolveDate.setDate(resolveDate.getDate() + TF_DAYS[timeframe])
    setCalls((prev) => [{
      id:          Date.now(),
      direction,
      timeframe,
      confidence,
      entryRate:   liveRate,
      entryDate:   new Date().toISOString().split('T')[0],
      resolveDate: resolveDate.toISOString().split('T')[0],
      endRate:     null,
      result:      null,
    }, ...prev])
  }

  const resolved = useMemo(() => calls.filter((c) => c.result), [calls])
  const wins     = resolved.filter((c) => c.result === 'WIN').length
  const accuracy = resolved.length ? (wins / resolved.length * 100).toFixed(0) : null

  // Win rate by timeframe
  const byTF = useMemo(() =>
    TFS.reduce((acc, tf) => {
      const r = resolved.filter((c) => c.timeframe === tf)
      acc[tf] = r.length
        ? { wins: r.filter((c) => c.result === 'WIN').length, total: r.length }
        : null
      return acc
    }, {}),
  [resolved])

  // Win rate by confidence (1–5)
  const byConf = useMemo(() =>
    [1, 2, 3, 4, 5].reduce((acc, s) => {
      const r = resolved.filter((c) => c.confidence === s)
      acc[s] = r.length
        ? { wins: r.filter((c) => c.result === 'WIN').length, total: r.length }
        : null
      return acc
    }, {}),
  [resolved])

  // Mini equity curve: cumulative wins over time
  const equityCurve = useMemo(() => {
    let cum = 0
    return [...resolved]
      .sort((a, b) => a.resolveDate.localeCompare(b.resolveDate))
      .map((c) => {
        cum += c.result === 'WIN' ? 1 : -1
        return { date: c.resolveDate, cum }
      })
  }, [resolved])

  return (
    <div className="space-y-6">
      {/* Log new call */}
      <div className="bg-card rounded-lg p-4 space-y-4">
        <div className="text-xs text-white/35 uppercase tracking-widest">Log a call</div>
        <div className="flex gap-3 flex-wrap items-center">
          {/* Direction */}
          <div className="flex gap-2">
            {['UP', 'DOWN'].map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`px-4 py-2 text-xs rounded border transition-colors ${
                  direction === d
                    ? d === 'UP'
                      ? 'border-good/60 text-good bg-good/10'
                      : 'border-bad/60 text-bad bg-bad/10'
                    : 'border-white/10 text-white/40'
                }`}
              >
                {d === 'UP' ? '▲ UP' : '▼ DOWN'}
              </button>
            ))}
          </div>
          {/* Timeframe */}
          <div className="flex gap-1">
            {TFS.map((t) => (
              <button key={t} onClick={() => setTimeframe(t)}
                className={`px-3 py-2 text-xs rounded border transition-colors ${
                  timeframe === t ? 'border-good/60 text-good' : 'border-white/10 text-white/40'
                }`}>
                {t}
              </button>
            ))}
          </div>
          {/* Confidence stars */}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setConfidence(s)}
                className={`text-lg transition-opacity px-0.5 ${s <= confidence ? 'opacity-100' : 'opacity-20'}`}
                style={{ color: '#F59E0B' }}>
                ★
              </button>
            ))}
          </div>
          <button onClick={addCall} disabled={!liveRate}
            className="ml-auto px-4 py-2 text-xs bg-good/15 text-good border border-good/40 rounded hover:bg-good/25 transition-colors disabled:opacity-40">
            Log @ {liveRate?.toFixed(decimals) ?? '—'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {resolved.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total',    value: calls.length },
              { label: 'Resolved', value: resolved.length },
              { label: 'Wins',     value: wins },
              { label: 'Accuracy', value: accuracy ? `${accuracy}%` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card rounded-lg p-3 text-center border border-white/5">
                <div className="text-xl font-semibold text-white">{value}</div>
                <div className="text-xs text-white/35 mt-1 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>

          {/* Win rate by timeframe */}
          <div className="bg-card rounded-lg p-4">
            <div className="text-xs text-white/35 mb-3 uppercase tracking-widest">Win rate by timeframe</div>
            <div className="flex gap-4 flex-wrap">
              {TFS.map((tf) => (
                <div key={tf} className="text-center">
                  <div className="text-sm text-white">
                    {byTF[tf] ? `${(byTF[tf].wins / byTF[tf].total * 100).toFixed(0)}%` : '—'}
                  </div>
                  <div className="text-xs text-white/35 mt-0.5">{tf}</div>
                  {byTF[tf] && (
                    <div className="text-xs text-white/20 mt-0.5">{byTF[tf].wins}/{byTF[tf].total}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Win rate by confidence */}
          <div className="bg-card rounded-lg p-4">
            <div className="text-xs text-white/35 mb-3 uppercase tracking-widest">Win rate by confidence</div>
            <div className="flex gap-4 flex-wrap">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="text-center">
                  <div className="text-sm text-white">
                    {byConf[s] ? `${(byConf[s].wins / byConf[s].total * 100).toFixed(0)}%` : '—'}
                  </div>
                  <div className="text-xs text-neutral mt-0.5">{'★'.repeat(s)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Equity curve */}
          {equityCurve.length > 1 && (
            <div className="bg-card rounded-lg p-4">
              <div className="text-xs text-white/35 mb-2 uppercase tracking-widest">Cumulative P&L (wins − losses)</div>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={equityCurve}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#1C1F26', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }}
                    formatter={(v) => [v, 'Cumulative']}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                  <Line dataKey="cum" stroke="#00C896" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Call list */}
      <div className="space-y-2">
        {calls.length === 0 && (
          <div className="text-white/25 text-sm text-center py-8">No calls logged yet.</div>
        )}
        {calls.map((c) => (
          <div key={c.id}
            className={`bg-card rounded-lg p-3 flex items-center gap-3 border text-xs ${
              c.result === 'WIN'  ? 'border-good/30'
              : c.result === 'LOSS' ? 'border-bad/30'
              : 'border-white/5'
            }`}
          >
            <span className={c.direction === 'UP' ? 'text-good' : 'text-bad'}>
              {c.direction === 'UP' ? '▲' : '▼'}
            </span>
            <span className="text-white/50 w-8">{c.timeframe}</span>
            <span className="text-white">{c.entryRate.toFixed(decimals)}</span>
            <span className="text-white/25">→</span>
            <span className={c.endRate ? 'text-white' : 'text-white/25'}>
              {c.endRate?.toFixed(decimals) ?? `resolves ${c.resolveDate}`}
            </span>
            <span className="text-neutral">{'★'.repeat(c.confidence)}</span>
            <span className="ml-auto font-semibold">
              {c.result === 'WIN'  && <span className="text-good">WIN</span>}
              {c.result === 'LOSS' && <span className="text-bad">LOSS</span>}
              {!c.result           && <span className="text-white/20">pending</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
