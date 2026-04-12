import { useState, useMemo } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

const HORIZONS = [30, 90, 180, 365]
const N_SIMS   = 1000

function randn() {
  // Box-Muller transform
  const u1 = Math.random(), u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1 + 1e-15)) * Math.cos(2 * Math.PI * u2)
}

function randT(df) {
  // t-distribution: standard normal / sqrt(chi-squared(df)/df)
  const z = randn()
  let chi2 = 0
  for (let i = 0; i < df; i++) chi2 += randn() ** 2
  return z / Math.sqrt(chi2 / df)
}

function runSimulations(prices, horizon) {
  const lookback   = prices.slice(-90)
  const logReturns = lookback.slice(1).map((v, i) => Math.log(v / lookback[i]))
  const mu         = logReturns.reduce((a, b) => a + b, 0) / logReturns.length
  const sigma      = Math.sqrt(
    logReturns.reduce((a, v) => a + (v - mu) ** 2, 0) / logReturns.length
  )
  const start = prices[prices.length - 1]

  const paths = Array.from({ length: N_SIMS }, () => {
    let price = start
    const path = [price]
    for (let d = 0; d < horizon; d++) {
      price *= Math.exp(mu + sigma * randT(5))
      path.push(price)
    }
    return path
  })

  return Array.from({ length: horizon + 1 }, (_, day) => {
    const vals = paths.map((p) => p[day]).sort((a, b) => a - b)
    const pct  = (p) => vals[Math.max(0, Math.floor(p * N_SIMS) - 1)]
    return {
      day,
      p2_5:  pct(0.025),
      p10:   pct(0.10),
      p25:   pct(0.25),
      median:pct(0.50),
      p75:   pct(0.75),
      p90:   pct(0.90),
      p97_5: pct(0.975),
    }
  })
}

export default function MonteCarlo({ prices }) {
  const [horizon, setHorizon] = useState(90)

  const simData = useMemo(
    () => prices.length >= 30 ? runSimulations(prices, horizon) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prices.length, horizon]
  )

  if (!simData) {
    return <div className="text-white/35 text-sm">Need at least 30 days of price data.</div>
  }

  const start    = prices[prices.length - 1]
  const tableRows = [
    Math.min(30, horizon),
    Math.round(horizon / 2),
    horizon,
  ].filter((d, i, arr) => d > 0 && arr.indexOf(d) === i)

  return (
    <div className="space-y-6">
      {/* Horizon selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-white/35 uppercase tracking-widest">Horizon</span>
        {HORIZONS.map((h) => (
          <button
            key={h}
            onClick={() => setHorizon(h)}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              horizon === h
                ? 'border-good/60 text-good'
                : 'border-white/10 text-white/35 hover:text-white/65'
            }`}
          >
            {h}d
          </button>
        ))}
      </div>

      {/* Fan chart */}
      <div className="bg-card rounded-lg p-4">
        <div className="text-xs text-white/35 mb-2 uppercase tracking-widest">
          {N_SIMS.toLocaleString()} simulated paths · t-distribution (df=5)
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={simData}>
            <XAxis dataKey="day"
              tick={{ fontSize: 10, fill: '#ffffff35' }} axisLine={false} tickLine={false}
              label={{ value: 'Days ahead', position: 'insideBottomRight', fill: '#ffffff25', fontSize: 9, dy: -4 }}
            />
            <YAxis domain={['auto', 'auto']} width={56}
              tick={{ fontSize: 10, fill: '#ffffff35' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1C1F26', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }}
              formatter={(v, name) => [v?.toFixed(2), name]}
            />
            {/* 95% band */}
            <Area dataKey="p97_5" stroke="none" fill="#6c56ff" fillOpacity={0.10} dot={false} name="95% upper" />
            <Area dataKey="p2_5"  stroke="none" fill="#0F1117" fillOpacity={1}    dot={false} name="95% lower" />
            {/* 80% band */}
            <Area dataKey="p90"   stroke="none" fill="#6c56ff" fillOpacity={0.14} dot={false} name="80% upper" />
            <Area dataKey="p10"   stroke="none" fill="#0F1117" fillOpacity={1}    dot={false} name="80% lower" />
            {/* 50% band */}
            <Area dataKey="p75"   stroke="none" fill="#6c56ff" fillOpacity={0.22} dot={false} name="50% upper" />
            <Area dataKey="p25"   stroke="none" fill="#0F1117" fillOpacity={1}    dot={false} name="50% lower" />
            {/* Median */}
            <Line dataKey="median" stroke="#00C896" strokeWidth={2} dot={false} name="Median" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Percentile table */}
      <div className="bg-card rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10 text-white/30 uppercase tracking-widest">
              <th className="px-4 py-3 text-left">Day</th>
              <th className="px-4 py-3 text-right">2.5%</th>
              <th className="px-4 py-3 text-right">25%</th>
              <th className="px-4 py-3 text-right">Median</th>
              <th className="px-4 py-3 text-right">75%</th>
              <th className="px-4 py-3 text-right">97.5%</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <td className="px-4 py-3 text-white/50">Now</td>
              <td className="px-4 py-3 text-right text-white" colSpan={5}>{start.toFixed(2)}</td>
            </tr>
            {tableRows.map((d) => {
              const row = simData[d]
              return (
                <tr key={d} className="border-b border-white/5">
                  <td className="px-4 py-3 text-white/50">+{d}d</td>
                  <td className="px-4 py-3 text-right text-bad">{row.p2_5.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-white/60">{row.p25.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-good font-semibold">{row.median.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-white/60">{row.p75.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-bad">{row.p97_5.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-white/20 text-center">
        Statistical projection only — not financial advice. Past volatility does not predict future movements.
      </p>
    </div>
  )
}
