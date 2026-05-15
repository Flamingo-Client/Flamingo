/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface Window {
  electronAPI?: {
    minimize: () => void
    maximize: () => void
    close: () => void
    openExternal: (url: string) => void
    platform: string
  }
}
