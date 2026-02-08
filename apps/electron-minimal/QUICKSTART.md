# 🚀 Quick Start - Minimal Dispatch Electron

## Run Dispatch with 3 Commands

### Terminal 1: Backend
```bash
cd packages/backend
bun run dev
```
Wait for: `Backend server started on http://localhost:3001`

### Terminal 2: Frontend (Vite)
```bash
cd apps/electron
bun run dev
```
Wait for: `Local: http://localhost:5173`

### Terminal 3: Electron Window
```bash
cd apps/electron-minimal
bun run start
```

## What You Get

✅ **Clean Electron window** - No bloat, no errors
✅ **Your Dispatch UI** - All your React components
✅ **Backend connected** - Tasks, messages, users
✅ **40 lines of code** - vs 10,000+ in the complex app

## Files

```
apps/electron-minimal/
├── src/main.js          # 40 lines - just opens a window!
├── package.json         # Uses root electron, no dependencies
├── README.md           # Full documentation
└── QUICKSTART.md       # This file
```

## Why This Works

The complex Electron app had:
- ❌ Sentry (crashed on init)
- ❌ Auto-updater (crashed on init)
- ❌ MCP servers (not needed)
- ❌ Deep links (not needed)
- ❌ Bundling issues (esbuild conflicts)

This minimal app:
- ✅ Opens window
- ✅ Loads http://localhost:5173
- ✅ Done!

## Troubleshooting

**Port 3001 already in use?**
```bash
lsof -ti:3001 | xargs kill -9
```

**Electron not found?**
Run `bun install` from the project root first.

**Vite not starting?**
Make sure you're in `apps/electron` when running `bun run dev`
