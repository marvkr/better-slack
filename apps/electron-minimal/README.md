# Dispatch - Minimal Electron App

A bare-bones Electron wrapper for the Dispatch UI. No complexity, no Craft Agent bloat.

## What it does

- Opens a window
- Loads `http://localhost:5173` (your Vite dev server)
- That's it!

## How to run

### 1. Start the backend (Terminal 1)
```bash
cd packages/backend
bun run dev
```

### 2. Start the Vite dev server (Terminal 2)
```bash
cd apps/electron
bun run vite
```

### 3. Start this minimal Electron app (Terminal 3)
```bash
cd apps/electron-minimal
bun install
bun run start
```

## Architecture

```
┌─────────────────────────────────────┐
│  Minimal Electron Window            │
│  (apps/electron-minimal/src/main.js)│
│  - 40 lines of code                 │
│  - No bundling                      │
│  - No Craft Agent                   │
└──────────────┬──────────────────────┘
               │ loads
               ▼
┌─────────────────────────────────────┐
│  Vite Dev Server                    │
│  http://localhost:5173              │
│  (apps/electron/src/renderer)       │
└──────────────┬──────────────────────┘
               │ fetches from
               ▼
┌─────────────────────────────────────┐
│  Backend API                        │
│  http://localhost:3001              │
│  (packages/backend)                 │
└─────────────────────────────────────┘
```

## No more errors!

This minimal app:
- ✅ No Sentry
- ✅ No auto-updater
- ✅ No MCP servers
- ✅ No deep links
- ✅ No thumbnail protocols
- ✅ No bundling issues

Just pure Electron → Vite → Backend.
