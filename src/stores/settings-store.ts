import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '@/lib/types'
import { useSyncStore } from '@/lib/sync/sync-store'
import { isConnected } from '@/lib/sync/sync-client'

interface SettingsState {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
}

function triggerSync(settings: Settings) {
  if (!isConnected()) return
  const config = useSyncStore.getState().syncConfig
  if (!config?.sync_settings) return

  import('@/lib/sync/sync-client').then(({ uploadData }) => {
    uploadData('setting', JSON.stringify(settings)).catch(() => {})
  })
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        theme: 'dark',
        fontSize: 14,
        tabSize: 2,
        autoSave: true,
        restoreSession: true,
        timeout: 30000,
        followRedirects: true,
        maxRedirects: 10,
        sidebarWidth: 280,
        responseFontSize: 'medium',
      },
      updateSettings: (updates) =>
        set((state) => {
          const newSettings = { ...state.settings, ...updates }
          triggerSync(newSettings)
          return { settings: newSettings }
        }),
    }),
    { name: 'flamingo-settings' }
  )
)
