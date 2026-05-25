# Polymarket Calculator

American-odds bet calculator with Sportsbook and Polymarket payout modes.
Type into any field (odds, risk, or win) and the rest derives automatically.

- **Sportsbook mode**: "win" = profit only (stake returned on top)
- **Polymarket mode**: "win" = total return (stake + profit)

Shows decimal odds and implied probability. Light / dark / system theme,
preference persisted to localStorage.

## Run locally

```
npm install
npm run dev
```

## Build

```
npm run build
```

## Deploy

Vercel or Netlify, zero config. Framework preset: Vite. Build command
`npm run build`, output directory `dist`.
