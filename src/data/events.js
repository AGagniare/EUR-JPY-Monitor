/**
 * Macro event calendar for EUR/JPY.
 * Update manually each quarter.
 *
 * impact: 'high' | 'medium'
 * avgMove: typical absolute EUR/JPY move on event day, in pips (0.01 JPY = 1 pip)
 */
export const EVENTS = [
  // ECB rate decisions (~every 6 weeks)
  { date: '2026-04-17', type: 'ECB',    name: 'ECB Rate Decision',       impact: 'high',   avgMove: 80 },
  { date: '2026-06-05', type: 'ECB',    name: 'ECB Rate Decision',       impact: 'high',   avgMove: 80 },
  { date: '2026-07-23', type: 'ECB',    name: 'ECB Rate Decision',       impact: 'high',   avgMove: 80 },
  { date: '2026-09-10', type: 'ECB',    name: 'ECB Rate Decision',       impact: 'high',   avgMove: 80 },
  // BoJ policy decisions
  { date: '2026-04-30', type: 'BoJ',    name: 'BoJ Policy Decision',     impact: 'high',   avgMove: 120 },
  { date: '2026-06-17', type: 'BoJ',    name: 'BoJ Policy Decision',     impact: 'high',   avgMove: 120 },
  { date: '2026-07-29', type: 'BoJ',    name: 'BoJ Policy Decision',     impact: 'high',   avgMove: 120 },
  { date: '2026-09-18', type: 'BoJ',    name: 'BoJ Policy Decision',     impact: 'high',   avgMove: 120 },
  // Japan National CPI (released ~4th Friday of month)
  { date: '2026-04-24', type: 'JP CPI', name: 'Japan CPI (National)',    impact: 'medium', avgMove: 40 },
  { date: '2026-05-22', type: 'JP CPI', name: 'Japan CPI (National)',    impact: 'medium', avgMove: 40 },
  { date: '2026-06-19', type: 'JP CPI', name: 'Japan CPI (National)',    impact: 'medium', avgMove: 40 },
  { date: '2026-07-24', type: 'JP CPI', name: 'Japan CPI (National)',    impact: 'medium', avgMove: 40 },
  // Eurozone HICP Flash estimate (last business day of month)
  { date: '2026-04-30', type: 'EU CPI', name: 'Eurozone HICP Flash',     impact: 'medium', avgMove: 35 },
  { date: '2026-05-29', type: 'EU CPI', name: 'Eurozone HICP Flash',     impact: 'medium', avgMove: 35 },
  { date: '2026-06-30', type: 'EU CPI', name: 'Eurozone HICP Flash',     impact: 'medium', avgMove: 35 },
  { date: '2026-07-31', type: 'EU CPI', name: 'Eurozone HICP Flash',     impact: 'medium', avgMove: 35 },
]
