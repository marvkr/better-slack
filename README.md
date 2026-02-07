# Better Slack

Desktop agent app built with Electron, React, and the Claude Agent SDK.

## Development

```bash
bun install
bun run electron:dev    # Hot reload
bun run electron:start  # Build and run
bun run typecheck:all   # Type checking
```

## Architecture

Bun-based Electron monorepo:

```
apps/electron/       # Desktop app (Electron + React + shadcn/ui + Tailwind v4)
packages/core/       # Shared TypeScript types
packages/shared/     # Business logic (agent, auth, MCP, sessions)
packages/ui/         # Shared React components
```

## Tech Stack

- **Runtime**: Bun
- **AI**: Claude Agent SDK
- **Desktop**: Electron + React
- **UI**: shadcn/ui + Tailwind CSS v4
- **Build**: esbuild (main) + Vite (renderer)
