import { useMemo } from 'react'
import { EVENTS } from '../data/events'

const TYPE_COLOR = {
  ECB:    '#6c56ff',
  BoJ:    '#00C896',
  'JP CPI': '#F59E0B',
  'EU CPI': '#F59E0B',
}

export default function EventRadar() {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const in7Days = new Date(today)
  in7Days.setDate(in7Days.getDate() + 7)

  const upcoming = useMemo(() =>
    EVENTS
      .map((e) => ({ ...e, dateObj: new Date(e.date) }))
      .filter((e) => e.dateObj >= today)
      .sort((a, b) => a.dateObj - b.dateObj),
  [today])

  const imminentCount = upcoming.filter((e) => e.dateObj <= in7Days).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-white/35 uppercase tracking-widest">Upcoming macro events</span>
        {imminentCount > 0 && (
          <span className="text-xs text-neutral bg-neutral/10 border border-neutral/30 px-2 py-0.5 rounded">
            {imminentCount} in next 7 days
          </span>
        )}
      </div>

      <div className="space-y-2">
        {upcoming.length === 0 && (
          <div className="text-white/30 text-sm text-center py-8">
            No upcoming events. Update <code className="text-white/50">src/data/events.js</code>
          </div>
        )}
        {upcoming.map((event, i) => {
          const daysAway = Math.ceil((event.dateObj - today) / 86_400_000)
          const imminent = event.dateObj <= in7Days
          return (
            <div
              key={i}
              className={`bg-card rounded-lg p-4 flex items-center gap-4 border transition-colors ${
                imminent ? 'border-neutral/40' : 'border-white/5'
              }`}
            >
              {/* Date + days away */}
              <div className="w-20 shrink-0">
                <div className="text-xs text-white/60">
                  {event.dateObj.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </div>
                <div className={`text-xs mt-0.5 ${imminent ? 'text-neutral' : 'text-white/25'}`}>
                  {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `${daysAway}d away`}
                </div>
              </div>

              {/* Type badge */}
              <span
                className="shrink-0 text-xs px-2 py-0.5 rounded"
                style={{
                  color: TYPE_COLOR[event.type] ?? '#ccc',
                  background: `${TYPE_COLOR[event.type] ?? '#ccc'}18`,
                }}
              >
                {event.type}
              </span>

              {/* Name */}
              <span className="flex-1 text-sm text-white/75">{event.name}</span>

              {/* Impact + avg move */}
              <div className="text-right shrink-0">
                <div className={`text-xs uppercase tracking-wider ${
                  event.impact === 'high' ? 'text-bad' : 'text-neutral'
                }`}>
                  {event.impact}
                </div>
                <div className="text-xs text-white/25 mt-0.5">~{event.avgMove} pips</div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-white/20 text-center">
        Update event dates quarterly in <code className="text-white/40">src/data/events.js</code>
      </p>
    </div>
  )
}
