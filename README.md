# EUR/JPY Monitor

A Bloomberg-style EUR/JPY monitoring dashboard. Live rates, technical indicators, Monte Carlo simulation, macro event radar, personal trade log, and conversion calculator.

## Features

| Module | Description |
|--------|-------------|
| Dashboard | Live rate, SMA(7/30), RSI(14), Bollinger Bands, 52-week range, signal badge |
| Monte Carlo | 1,000 paths, t-distribution (df=5), fan chart with 50%/80%/95% confidence bands |
| Event Radar | ECB, BoJ, CPI calendar with estimated move sizes |
| My Calls | Personal trade log — direction, timeframe, confidence, auto-resolution, win-rate stats |
| Calculator | EUR → JPY with historical context and Wise deep link |
| AI (optional) | Claude explains the current signal in plain English |

## Quick Start

```bash
git clone https://github.com/AGagniare/eurjpy-monitor.git
cd eurjpy-monitor
npm install
npm run dev
```

Open http://localhost:5173

## APIs Used

| API | Purpose | Key required |
|-----|---------|--------------|
| open.er-api.com | Live EUR/JPY rate (refreshed every 60s) | No |
| api.frankfurter.app | Historical daily rates | No |
| api.anthropic.com | AI signal interpretation (optional) | Yes — your own key |

## Claude AI Integration (optional)

1. Get an API key at [console.anthropic.com](https://console.anthropic.com)
2. In the app → Dashboard → "AI Signal Interpretation" → "set API key"
3. Your key is stored in **your browser's localStorage only** — never sent anywhere else

## Signal Logic

| Signal | Condition |
|--------|-----------|
| **GOOD** | RSI(14) < 40 **and** rate below SMA(30) — oversold, potential entry |
| **WAIT** | RSI(14) > 70 — overbought |
| **NEUTRAL** | Otherwise |

## Updating the Event Calendar

Edit `src/data/events.js`. Add objects following this shape:

```js
{ date: 'YYYY-MM-DD', type: 'ECB', name: 'ECB Rate Decision', impact: 'high', avgMove: 80 }
```

`impact`: `'high'` or `'medium'`. `avgMove`: typical absolute EUR/JPY pips on the day.  
Update quarterly (ECB and BoJ meet ~every 6 weeks; CPI is monthly).

## Deploy

```bash
npm run build
# Deploy dist/ to Vercel, Netlify, or GitHub Pages
```

## Stack

Vite · React 18 · Tailwind CSS · Recharts · open.er-api.com · Frankfurter API · Anthropic API (optional)
