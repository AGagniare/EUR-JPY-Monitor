import { useState } from 'react'

const MODEL  = 'claude-sonnet-4-6'
const LS_KEY = 'anthropic_api_key'

export default function ClaudeSignal({ liveRate, signal, latestRSI, latestSMA30, events, pair }) {
  const [apiKey,         setApiKey]         = useState(() => localStorage.getItem(LS_KEY) ?? '')
  const [showKeyInput,   setShowKeyInput]   = useState(!localStorage.getItem(LS_KEY))
  const [interpretation, setInterpretation] = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)

  function saveKey(k) {
    setApiKey(k)
    localStorage.setItem(LS_KEY, k)
    if (k) setShowKeyInput(false)
  }

  async function explain() {
    if (!apiKey || !liveRate) return
    setLoading(true); setError(null); setInterpretation(null)

    const today    = new Date()
    const in14days = new Date(today.getTime() + 14 * 86_400_000)
    const upcoming = (events ?? [])
      .filter((e) => { const d = new Date(e.date); return d >= today && d <= in14days })
      .map((e) => `${e.date} — ${e.name} (${e.impact} impact)`)
      .join('; ')

    const pairLabel = pair?.label ?? 'EUR/JPY'
    const dec = pair?.decimals ?? 2
    const prompt = [
      `${pairLabel} is currently at ${liveRate.toFixed(dec)}.`,
      `RSI(14): ${latestRSI?.toFixed(1) ?? 'N/A'}.`,
      `Rate is ${latestSMA30 && liveRate ? (liveRate > latestSMA30 ? 'above' : 'below') : 'near'} SMA(30) of ${latestSMA30?.toFixed(dec) ?? 'N/A'}.`,
      `Signal badge: ${signal}.`,
      upcoming ? `Upcoming macro events (next 14 days): ${upcoming}.` : '',
      `In 2–3 plain sentences, explain what this means for someone watching ${pairLabel}. Be concise and factual.`,
    ].filter(Boolean).join(' ')

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key':                     apiKey,
          'anthropic-version':             '2023-06-01',
          'content-type':                  'application/json',
          'anthropic-dangerous-allow-browser': 'true',
        },
        body: JSON.stringify({
          model:      MODEL,
          max_tokens: 200,
          messages:   [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      setInterpretation(data.content[0].text)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-lg p-4 space-y-3 border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/35 uppercase tracking-widest">AI Signal Interpretation</span>
        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="text-xs text-white/20 hover:text-white/50 transition-colors"
        >
          {showKeyInput ? 'hide' : 'set API key'}
        </button>
      </div>

      {showKeyInput && (
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="sk-ant-…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 bg-bg border border-white/10 rounded px-3 py-2 text-xs text-white/65 outline-none focus:border-white/25"
          />
          <button
            onClick={() => saveKey(apiKey)}
            className="px-3 py-2 text-xs bg-white/5 border border-white/10 rounded hover:bg-white/10 text-white/50"
          >
            Save
          </button>
        </div>
      )}

      {!showKeyInput && (
        <button
          onClick={explain}
          disabled={loading || !apiKey}
          className="w-full py-2 text-xs border border-white/10 rounded text-white/40 hover:text-white/70 hover:border-white/20 transition-colors disabled:opacity-30"
        >
          {loading ? 'Asking Claude…' : 'Explain this signal'}
        </button>
      )}

      {interpretation && (
        <p className="text-sm text-white/70 leading-relaxed">{interpretation}</p>
      )}
      {error && (
        <p className="text-xs text-bad/70">Error: {error}</p>
      )}
    </div>
  )
}
