import { useState } from 'react'
import { useCurrencyPair } from './hooks/useCurrencyPair'
import { PAIRS } from './config/pairs'
import Dashboard from './components/Dashboard'
import MonteCarlo from './components/MonteCarlo'
import EventRadar from './components/EventRadar'
import MyCalls from './components/MyCalls'
import Calculator from './components/Calculator'

const TABS = ['Dashboard', 'Monte Carlo', 'Event Radar', 'My Calls', 'Calculator']

export default function App() {
  const [tab, setTab] = useState('Dashboard')
  const [pair, setPair] = useState(PAIRS[0])

  const { liveRate, history, loading, lastUpdated, histError } = useCurrencyPair(pair.base, pair.quote, 365)
  const prices = history.map((h) => h.rate)

  return (
    <div className="min-h-screen bg-bg font-mono">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <select
            value={pair.label}
            onChange={(e) => setPair(PAIRS.find((p) => p.label === e.target.value))}
            className="bg-transparent text-white/50 text-xs uppercase tracking-widest border border-white/10 rounded px-2 py-1 outline-none hover:border-white/25 cursor-pointer"
          >
            {PAIRS.map((p) => (
              <option key={p.label} value={p.label} className="bg-[#1C1F26] text-white">
                {p.label}
              </option>
            ))}
          </select>
          {liveRate && (
            <span className="text-2xl font-semibold text-white tracking-tight">
              {liveRate.toFixed(pair.decimals)}
            </span>
          )}
        </div>
        {lastUpdated && (
          <span className="text-xs text-white/25">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </header>

      {/* Tabs */}
      <nav className="border-b border-white/10 px-4 flex overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-xs tracking-widest uppercase whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-good text-white'
                : 'border-transparent text-white/35 hover:text-white/65'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="px-4 py-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-white/30 text-sm">Loading market data…</div>
        ) : (
          <>
            {tab === 'Dashboard'   && <Dashboard  liveRate={liveRate} history={history} prices={prices} pair={pair} histError={histError} />}
            {tab === 'Monte Carlo' && <MonteCarlo prices={prices} pair={pair} />}
            {tab === 'Event Radar' && <EventRadar />}
            {tab === 'My Calls'   && <MyCalls    liveRate={liveRate} pair={pair} />}
            {tab === 'Calculator' && <Calculator  liveRate={liveRate} history={history} pair={pair} />}
          </>
        )}
      </main>
    </div>
  )
}
