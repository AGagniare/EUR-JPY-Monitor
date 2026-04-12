import { useEURJPY } from './hooks/useEURJPY'

export default function App() {
  const { liveRate, history, loading } = useEURJPY(30)
  if (loading) return <div className="p-8 font-mono text-gray-400">Loading…</div>
  return (
    <div className="p-8 font-mono">
      <div className="text-2xl text-white">EUR/JPY: {liveRate?.toFixed(2)}</div>
      <div className="text-gray-400 mt-2">{history.length} days of history loaded</div>
    </div>
  )
}
