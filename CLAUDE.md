# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development (hot reload)
bun run electron:dev

# Build and run
bun run electron:start

# Type checking (run before commits)
bun run typecheck:all

# Linting
bun run lint

# Run all tests
bun test

# Run tests in a specific package
cd packages/shared && bun test

# Run a single test file
bun test packages/shared/src/agent/__tests__/tool-matching.test.ts
```

## Architecture

This is a Bun-based Electron monorepo using the Claude Agent SDK. The primary interface is a desktop app for multi-session agent interactions.

### Monorepo Structure

```
apps/
  electron/           # Desktop app (primary)
    src/main/         # Electron main process
    src/preload/      # Context bridge
    src/renderer/     # React UI (Vite + shadcn/ui + Tailwind v4)
  viewer/             # Web-based session viewer

packages/
  core/               # @craft-agent/core - Shared TypeScript types
  shared/             # @craft-agent/shared - Business logic (agent, auth, MCP, sessions)
  ui/                 # @craft-agent/ui - Shared React components
  mermaid/            # ASCII mermaid diagram renderer
```

### Key Packages

**@craft-agent/core**: Type definitions only. All types for workspaces, sessions, and messages.

**@craft-agent/shared**: Core business logic. Use subpath imports:
```typescript
import { CraftAgent } from '@craft-agent/shared/agent';
import { loadStoredConfig } from '@craft-agent/shared/config';
import { getCredentialManager } from '@craft-agent/shared/credentials';
```

### Data Flow

1. **CraftAgent** (`packages/shared/src/agent/craft-agent.ts`) wraps the Claude Agent SDK
2. Sessions map 1:1 with SDK sessions via `sdkSessionId`
3. Tools are granted/blocked via PreToolUse hooks based on permission mode
4. Large responses (>60KB) are auto-summarized via PostToolUse hooks

### Permission Modes

Per-session modes controlled via SHIFT+TAB:
- `safe` (Explore): Read-only, blocks writes
- `ask` (Ask to Edit): Prompts for approval (default)
- `allow-all` (Auto): Auto-approves all

Customizable via `permissions.json` at workspace or source level.

### Storage Layout

```
~/.craft-agent/
├── config.json           # Main config (workspaces, auth type)
├── credentials.enc       # AES-256-GCM encrypted credentials
├── preferences.json      # User preferences
├── theme.json            # App-level theme
└── workspaces/{id}/
    ├── config.json       # Workspace settings
    ├── permissions.json  # Permission rules
    ├── sessions/         # Session data (JSONL)
    ├── sources/          # Connected MCP/API sources
    ├── skills/           # Custom skills
    └── statuses/         # Status workflow config
```

### Sources

Sources are external data connections stored at `~/.craft-agent/workspaces/{id}/sources/{slug}/`:
- **MCP servers**: SSE or stdio transport
- **REST APIs**: Google, Slack, Microsoft with OAuth
- **Local**: Filesystem access

### Session-Scoped Tools

Tools registered in `packages/shared/src/agent/session-scoped-tools.ts`:
- `source_test`, `source_oauth_trigger`, `source_credential_prompt`
- `SubmitPlan`, `config_validate`

Callbacks: `onPlanSubmitted`, `onOAuthSuccess`, `onCredentialRequest`, `onSourcesChanged`

## Critical Patterns

### MCP Auth Separation
Craft OAuth (`craft_oauth::global`) is ONLY for the Craft API. Each MCP server uses its own auth via `workspace_oauth::{workspaceId}`.

### Session Isolation
Sessions are the primary boundary, not workspaces. Each session has its own permission mode state.

### Environment Filtering
When spawning local MCP servers, sensitive env vars (API keys, tokens) are filtered to prevent credential leakage.

## Build System

- **Main process**: esbuild via `scripts/electron-build-main.ts`
- **Preload**: esbuild via `scripts/electron-build-preload.ts`
- **Renderer**: Vite with React plugin

OAuth secrets are injected at build time via esbuild `--define`.

## Customization Guide

### Colors (6-color semantic system)

| Variable | Light Default | Dark Default | What it controls |
|----------|--------------|--------------|------------------|
| `--background` | `oklch(0.975 0.00528 106)` | `oklch(0.2 0.005 270)` | App surface, panels |
| `--foreground` | `oklch(0.185 0.01 270)` | `oklch(0.92 0.005 270)` | Text, icons |
| `--accent` | `oklch(0.65 0.18 55)` | `oklch(0.72 0.18 55)` | Brand highlight, active states, buttons |
| `--info` | `oklch(0.75 0.16 70)` | `oklch(0.70 0.16 70)` | Warnings, amber indicators |
| `--success` | `oklch(0.55 0.17 145)` | `oklch(0.60 0.17 145)` | Green states, checkmarks, "Done" badge |
| `--destructive` | `oklch(0.58 0.24 28)` | `oklch(0.70 0.19 22)` | Errors, red states |

**Where to change**: `apps/electron/src/renderer/index.css` — `:root` block (light) and `.dark` block (dark)

Each color has a `-rgb` companion (e.g., `--accent-rgb`) used in box-shadows via `rgba()`.

**Runtime override**: `~/.craft-agent/theme.json` — overrides CSS variables at runtime via ThemeContext

### Fonts

| Variable | Default | What it controls |
|----------|---------|------------------|
| `--font-sans` | `system-ui, -apple-system, ...` | Body text, UI labels |
| `--font-mono` | `"JetBrains Mono", ui-monospace, ...` | Code blocks, monospace |
| `--font-default` | `var(--font-sans)` | Global default font |
| `--font-size-base` | `15px` | Base font size for the app |

**Where to change**: `index.css` `:root` block (lines ~160-167)

**Inter font**: Add `data-font="inter"` attribute to `<html>` to switch to Inter (loaded via Google Fonts in `index.html`)

### Iconography

- **Sidebar icons**: Lucide React icons imported from `lucide-react` in `AppShell.tsx`
  - Change an icon: swap the import (e.g., `ListTodo` → `ClipboardList`)
  - Full icon set: https://lucide.dev/icons
- **Sidebar status icon colors**: `iconColor` prop on each sidebar link item in `AppShell.tsx` (hardcoded hex values — search for `iconColor:`)
- **User avatar colors**: `USER_COLORS` in `apps/electron/src/renderer/config/dispatch-users.ts`

### Sidebar Item Styling

- `variant: "default"` → active state uses `bg-foreground/[0.07]`
- `variant: "ghost"` → subtle hover via `bg-sidebar-hover` (2% foreground opacity)
- Separator: `{ id: "separator:name", type: "separator" }` renders a `h-px bg-foreground/5` line
