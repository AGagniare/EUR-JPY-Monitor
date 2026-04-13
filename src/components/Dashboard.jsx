import { useState } from 'react'
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine,
} from 'recharts'
import { useIndicators } from '../hooks/useIndicators'
import ClaudeSignal from './ClaudeSignal'
import { EVENTS } from '../data/events'

const PERIODS = ['7d', '30d', '90d', '1y']

function SignalBadge({ signal }) {
  const styles = {
    GOOD:    'bg-good/15 text-good border-good/40',
    NEUTRAL: 'bg-neutral/15 text-neutral border-neutral/40',
    WAIT:    'bg-bad/15 text-bad border-bad/40',
  }
  return (
    <span className={`px-3 py-1 rounded border text-xs font-semibold tracking-widest uppercase ${styles[signal]}`}>
      {signal}
    </span>
  )
}

export default function Dashboard({ liveRate, history, prices, pair, histError }) {
  const [period, setPeriod] = useState('30d')
  const [showBB, setShowBB] = useState(false)

  if (!history.length) {
    return (
      <div className="py-8 text-center space-y-2">
        <div className="text-white/50 text-sm">Unable to load historical data.</div>
        {histError && (
          <div className="text-red-400/70 text-xs font-mono">{histError}</div>
        )}
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 text-xs border border-white/20 text-white/50 rounded hover:text-white/80 hover:border-white/40 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period]
  const slicedHistory = history.slice(-days)
  const slicedPrices  = slicedHistory.map((h) => h.rate)

  const { sma7, sma30, rsi14, bb, signal, latestRSI, latestSMA30 } = useIndicators(slicedPrices)

  const chartData = slicedHistory.map((h, i) => ({
    date:      h.date,
    rate:      h.rate,
    sma7:      sma7[i]         ?? null,
    sma30:     sma30[i]        ?? null,
    bbUpper:   bb[i]?.upper    ?? null,
    bbLower:   bb[i]?.lower    ?? null,
  }))

  // Append today's live rate if it's not already the last data point
  const todayStr = new Date().toISOString().split('T')[0]
  if (liveRate && chartData.length && chartData[chartData.length - 1].date !== todayStr) {
    chartData.push({ date: todayStr, rate: liveRate, sma7: null, sma30: null, bbUpper: null, bbLower: null })
  }

  const rsiData = slicedHistory.map((h, i) => ({
    date: h.date,
    rsi:  rsi14[i] ?? null,
  }))

  // 52-week position
  const year   = history.slice(-365).map((h) => h.rate)
  const high52 = year.length ? Math.max(...year) : 0
  const low52  = year.length ? Math.min(...year) : 0
  const pos52  = high52 > low52 && liveRate
    ? ((liveRate - low52) / (high52 - low52)) * 100
    : 50

  const tickFmt = (d) => {
    const date = new Date(d)
    return period === '7d'
      ? date.toLocaleDateString('en', { weekday: 'short' })
      : date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Rate + signal */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <div className="text-4xl font-semibold text-white tracking-tight">
            {liveRate?.toFixed(pair?.decimals ?? 2) ?? '—'}
          </div>
          <div className="text-xs text-white/35 mt-1">{pair?.label ?? 'EUR/JPY'} · Live</div>
        </div>
        <SignalBadge signal={signal} />
        {latestRSI !== null && (
          <span className="text-xs text-white/35">RSI(14): {latestRSI.toFixed(1)}</span>
        )}
        {latestSMA30 !== null && (
          <span className="text-xs text-white/35">
            {liveRate > latestSMA30 ? '▲ above' : '▼ below'} SMA30
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              period === p
                ? 'border-good/60 text-good'
                : 'border-white/10 text-white/35 hover:text-white/65'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => setShowBB(!showBB)}
          className={`px-3 py-1 text-xs rounded border transition-colors ml-auto ${
            showBB ? 'border-neutral/60 text-neutral' : 'border-white/10 text-white/35'
          }`}
        >
          Bollinger Bands
        </button>
      </div>

      {/* Main price chart */}
      <div className="bg-card rounded-lg p-4">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData}>
            <XAxis dataKey="date" tickFormatter={tickFmt}
              tick={{ fontSize: 10, fill: '#ffffff35' }} axisLine={false} tickLine={false} />
            <YAxis domain={['auto', 'auto']} width={52}
              tick={{ fontSize: 10, fill: '#ffffff35' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1C1F26', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }}
              formatter={(v, name) => [v?.toFixed(2), name]}
            />
            {showBB && <>
              <Area dataKey="bbUpper" stroke="#F59E0B" strokeWidth={1} strokeDasharray="3 3"
                fill="#F59E0B" fillOpacity={0.06} dot={false} connectNulls name="BB Upper" />
              <Area dataKey="bbLower" stroke="#F59E0B" strokeWidth={1} strokeDasharray="3 3"
                fill="#0F1117" fillOpacity={1} dot={false} connectNulls name="BB Lower" />
            </>}
            <Line dataKey="sma30" stroke="#6c56ff" strokeWidth={1.5} dot={false} connectNulls name="SMA 30" />
            <Line dataKey="sma7"  stroke="#00C896" strokeWidth={1.5} dot={false} connectNulls name="SMA 7" />
            <Line dataKey="rate"  stroke="#ffffff"  strokeWidth={2}   dot={false} name="EUR/JPY" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI chart */}
      <div className="bg-card rounded-lg p-4">
        <div className="text-xs text-white/35 mb-2 uppercase tracking-widest">RSI (14)</div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={rsiData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis hide height={0} />
            <YAxis domain={[0, 100]} hide width={0} />
            <Tooltip
              contentStyle={{ background: '#1C1F26', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }}
              formatter={(v) => [v?.toFixed(1), 'RSI']}
            />
            <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1} />
            <ReferenceLine y={30} stroke="#00C896" strokeDasharray="3 3" strokeWidth={1} />
            <Bar dataKey="rsi" radius={[2, 2, 0, 0]}>
              {rsiData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.rsi === null ? 'transparent'
                    : entry.rsi > 70   ? '#EF4444'
                    : entry.rsi < 30   ? '#00C896'
                    : '#6c56ff'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 52-week range bar */}
      <div className="bg-card rounded-lg p-4">
        <div className="text-xs text-white/35 mb-3 uppercase tracking-widest">52-Week Range</div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/50 w-14 text-right">{low52.toFixed(1)}</span>
          <div className="flex-1 relative h-2 bg-white/10 rounded-full">
            <div className="h-full bg-good/30 rounded-full" style={{ width: `${pos52}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
              style={{ left: `calc(${pos52}% - 6px)` }}
            />
          </div>
          <span className="text-xs text-white/50 w-14">{high52.toFixed(1)}</span>
        </div>
        <div className="text-center text-xs text-white/25 mt-2">
          {pos52.toFixed(0)}th percentile of 52-week range
        </div>
      </div>

      {/* Claude signal interpretation */}
      <ClaudeSignal
        liveRate={liveRate}
        signal={signal}
        latestRSI={latestRSI}
        latestSMA30={latestSMA30}
        events={pair?.quote === 'JPY' ? EVENTS : []}
        pair={pair}
      />
    </div>
  )
}
