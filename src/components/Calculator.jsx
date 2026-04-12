import { useState, useMemo } from 'react'

function fmt(n, dec = 0) {
  if (n == null) return '—'
  return n.toLocaleString('en', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

export default function Calculator({ liveRate, history, pair }) {
  const { base = 'EUR', quote = 'JPY', baseSymbol = '€', quoteSymbol = '¥', decimals = 2, label = 'EUR/JPY' } = pair ?? {}
  const [eur, setEur] = useState('1000')
  const amount = parseFloat(eur) || 0

  const stats = useMemo(() => {
    if (!history?.length || !liveRate) return null
    const r7   = history.slice(-7).map((h) => h.rate)
    const r30  = history.slice(-30).map((h) => h.rate)
    const r365 = history.slice(-365).map((h) => h.rate)
    return {
      high7:     Math.max(...r7),
      high30:    Math.max(...r30),
      high1y:    Math.max(...r365),
      low1y:     Math.min(...r365),
      rate7dAgo: r7[0],
      rate30dAgo:r30[0],
    }
  }, [history, liveRate])

  const rows = stats ? [
    { label: 'At current rate', rate: liveRate,        diff: 0,                            highlight: true },
    { label: '7-day high',      rate: stats.high7,     diff: amount * (stats.high7    - liveRate) },
    { label: '30-day high',     rate: stats.high30,    diff: amount * (stats.high30   - liveRate) },
    { label: '1-year high',     rate: stats.high1y,    diff: amount * (stats.high1y   - liveRate) },
    { label: '1-year low',      rate: stats.low1y,     diff: amount * (stats.low1y    - liveRate) },
    { label: '7 days ago',      rate: stats.rate7dAgo, diff: amount * (stats.rate7dAgo  - liveRate) },
    { label: '30 days ago',     rate: stats.rate30dAgo,diff: amount * (stats.rate30dAgo - liveRate) },
  ] : []

  const result  = amount * (liveRate ?? 0)
  const wiseUrl = `https://wise.com/send#payAgain?amount=${amount}&sourceCurrency=${base}&targetCurrency=${quote}`

  return (
    <div className="space-y-6 max-w-lg">
      {/* Input */}
      <div className="bg-card rounded-lg p-4">
        <label className="text-xs text-white/35 uppercase tracking-widest block mb-3">{base} amount</label>
        <div className="flex items-center gap-3">
          <span className="text-white/40">{baseSymbol}</span>
          <input
            type="number"
            value={eur}
            onChange={(e) => setEur(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none border-b border-white/20 focus:border-good pb-1 transition-colors"
          />
        </div>
        <div className="mt-3 text-xl text-white/65">
          = {quoteSymbol}{fmt(result, decimals > 2 ? 2 : 0)}
        </div>
      </div>

      {/* Comparison table */}
      {rows.length > 0 && (
        <div className="bg-card rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/30 uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Scenario</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">{quoteSymbol} received</th>
                <th className="px-4 py-3 text-right">Difference</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const received = amount * row.rate
                const isPos    = row.diff > 0
                return (
                  <tr key={i} className={`border-b border-white/5 ${row.highlight ? 'bg-white/[0.03]' : ''}`}>
                    <td className="px-4 py-3 text-white/65">{row.label}</td>
                    <td className="px-4 py-3 text-right text-white/50">{row.rate?.toFixed(decimals)}</td>
                    <td className="px-4 py-3 text-right text-white">{fmt(received)}</td>
                    <td className={`px-4 py-3 text-right ${
                      row.diff === 0 ? 'text-white/20'
                      : isPos        ? 'text-good'
                      : 'text-bad'
                    }`}>
                      {row.diff === 0 ? '—' : `${isPos ? '+' : ''}${fmt(row.diff)}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Wise deep link */}
      <a
        href={wiseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center py-3 rounded-lg border border-white/10 text-white/45 text-xs hover:border-good/40 hover:text-good transition-colors uppercase tracking-widest"
      >
        Convert on Wise ↗
      </a>
    </div>
  )
}
