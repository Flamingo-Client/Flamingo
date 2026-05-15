# Flamingo

**A modern, high-performance desktop API client** built with Electron, React, and TypeScript. Flamingo provides a powerful interface for crafting HTTP requests, managing environments and collections, and syncing your data across devices — all with end-to-end encryption.

<img src="../assets/readme/image.png" alt="Flamingo screenshot">
---

## Features

- **HTTP Request Builder** — Full-featured editor for GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS requests with support for headers, query parameters, body (JSON, form-data, text), and authentication (Basic Auth, Bearer Token, API Key)
- **Monaco Editor Integration** — Code-grade editing for request/response bodies with syntax highlighting, autocompletion, and theming
- **Environment Variables** — Define reusable variables across environments (development, staging, production) with dynamic resolution in requests
- **Collections** — Organize requests into folders for project-level grouping and reuse
- **Request History** — Automatic saving of recent requests with search and filtering
- **Multi-Tab Interface** — Work on multiple requests simultaneously with resizable panels
- **Sync Across Devices** — Cloud sync with end-to-end encryption (AES-256-GCM) via the Flamingo Sync Server
- **Theme Support** — Light, dark, and system-following themes
- **Keyboard Shortcuts** — Power-user shortcuts for every action
- **Auto-Save** — Never lose your work with automatic state persistence
- **Responsive Layout** — Resizable panes, collapsible sidebar, and tab management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 32 |
| UI Framework | React 18 |
| Build Tool | Vite 5 |
| Language | TypeScript 5 |
| Styling | TailwindCSS 3 |
| Components | Radix UI (20+ primitives) |
| State Management | Zustand 5 |
| Editor | Monaco Editor (VS Code engine) |
| Animations | Framer Motion 11 |
| Icons | Lucide React |
| HTTP Client | Fetch API |
| Encryption | Web Crypto API (AES-256-GCM) |

---

## Architecture

```
client/
├── electron/              # Electron main process
│   ├── main.js            # App window, IPC handlers
│   └── preload.js         # Context bridge (secure IPC)
├── src/
│   ├── components/        # React components
│   │   ├── layout/        # App shell (TitleBar, Sidebar, Panels)
│   │   ├── request/       # Request builder (URL, headers, body, auth)
│   │   ├── response/      # Response viewer (body, headers, status)
│   │   ├── sidebar/       # Sidebar panels (SyncPanel, SettingsModal)
│   │   └── ui/            # Primitives (Button, Input, Dialog, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── lib/
│   │   ├── sync/          # Sync client (crypto, store, provider)
│   │   └── supabase/      # Supabase client configs
│   ├── main/              # App entry point
│   ├── modules/           # Feature modules
│   ├── stores/            # Zustand stores
│   │   ├── history-store.ts
│   │   ├── environment-store.ts
│   │   ├── collection-store.ts
│   │   ├── settings-store.ts
│   │   ├── tab-store.ts
│   │   ├── theme-store.ts
│   │   └── ui-store.ts
│   └── styles/            # Global CSS, Tailwind layers
└── # Build & config files
```

### State Management

Flamingo uses **Zustand** with the `persist` middleware for all application state. Each domain has its own store:

| Store | Purpose | Persisted |
|-------|---------|-----------|
| `history-store` | Request history entries | Yes |
| `environment-store` | Environment variables | Yes |
| `collection-store` | Request collections | Yes |
| `settings-store` | App preferences (font size, timeout, etc.) | Yes |
| `tab-store` | Open tabs and active tab | Yes |
| `theme-store` | Theme preference | Yes |
| `ui-store` | UI state (modal open, panel width) | No |

### Sync System

Flamingo integrates with the Flamingo Sync Server for cross-device data synchronization:

1. **End-to-End Encryption** — All data is encrypted with AES-256-GCM before leaving the client
2. **Master Key** — A random 256-bit key is generated per user, stored raw (base64) on the server
3. **Automatic Setup** — On first connection, the master key is generated, uploaded, and cached locally
4. **Multi-Device** — Subsequent devices fetch the shared master key from the server
5. **Selective Sync** — Users choose which data types to sync (history, environments, collections, settings)
6. **Token Auth** — Device-authorization flow with temporary tokens and browser-based claim

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9

### Installation

```bash
cd client
npm install
```

### Development

Run the Vite dev server and Electron concurrently:

```bash
npm run dev              # Vite dev server only (http://localhost:5173)
npm run electron:dev     # Vite + Electron (hot reload)
```

### Build

```bash
npm run build            # TypeScript check + Vite production build
npm run electron:build   # Build + package for current platform
npm run electron:mac     # Build + package for macOS (DMG + ZIP)
npm run electron:win     # Build + package for Windows (NSIS)
npm run electron:linux   # Build + package for Linux (AppImage, deb, rpm)
```

> **macOS note:** Building for macOS requires Xcode, an Apple Developer account, and proper code signing certificates. For notarization, see the [macOS Build & Notarization guide](../docs-site/src/content/docs/building/macos.md) in the documentation site.

### Lint

```bash
npm run lint             # TypeScript type-check (no emit)
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | TypeScript check + Vite production build |
| `npm run electron:dev` | Run Vite + Electron concurrently with hot reload |
| `npm run electron:build` | Build and package for current platform |
| `npm run electron:mac` | Build and package for macOS (DMG + ZIP) |
| `npm run electron:win` | Build and package for Windows (NSIS) |
| `npm run electron:linux` | Build and package for Linux (AppImage, deb, rpm) |
| `npm run electron:all` | Build and package for Windows + Linux |
| `npm run preview` | Preview Vite production build |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`) |

---

## Project Configuration

### Vite (`vite.config.ts`)

- React plugin with Fast Refresh
- Path alias `@/` → `./src/`
- Monaco Editor worker bundling
- Dev server on port 5173

### TypeScript (`tsconfig.json`)

- Target: ES2020
- Module: ESNext with bundler resolution
- JSX: react-jsx
- Strict mode enabled
- Path alias `@/*` → `./src/*`

### Electron (`electron/main.js`)

- Main process creates BrowserWindow
- IPC handlers for native dialogs and `openExternal`
- Preload script exposes secure API via contextBridge

---

## Dependencies

### Production

| Package | Purpose |
|---------|---------|
| `@monaco-editor/react` | Code editor component |
| `@radix-ui/*` | Accessible UI primitives (20 packages) |
| `@tanstack/react-query` | Async state management |
| `framer-motion` | Declarative animations |
| `lucide-react` | Icon library |
| `monaco-editor` | VS Code editor engine |
| `react-resizable-panels` | Split-pane layout |
| `zustand` | Lightweight state management |
| `tailwind-merge` | Conditional class merging |

### Development

| Package | Purpose |
|---------|---------|
| `electron` | Desktop shell |
| `electron-builder` | App packaging & distribution |
| `vite` | Build tool & dev server |
| `typescript` | Type checking |
| `tailwindcss` | Utility-first CSS |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Send request |
| `Ctrl+N` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+Shift+T` | Reopen closed tab |
| `Ctrl+,` | Open settings |

---

## License

MIT License — see [LICENSE](./LICENSE)

Copyright (c) 2024 Javier Fernández (Jallox/Jayox)
