import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SyncState, SyncActions, SyncConfig, DeviceInfo } from './types'
import * as client from './sync-client'

type SyncStore = SyncState & SyncActions

const defaultConfig: SyncConfig = {
  sync_history: true,
  sync_environments: true,
  sync_secrets: true,
  sync_collections: true,
  sync_settings: true,
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      // State
      status: 'disconnected',
      sessionToken: null,
      tokenPrefix: null,
      syncConfig: null,
      lastSyncAt: null,
      error: null,
      deviceName: null,
      devices: [],

      // Actions
      connect: async () => {
        set({ status: 'connecting', error: null })
        try {
          const response = await client.initSync()
          const loginUrl = response.login_url

          if (window.electronAPI?.openExternal) {
            window.electronAPI.openExternal(loginUrl)
          } else {
            window.open(loginUrl, '_blank')
          }

          const session = await client.pollForSession(response.temp_token)
          await client.saveSession(session)

          await client.setupEncryption()

          set({
            status: 'connected',
            sessionToken: session.session_token,
            tokenPrefix: session.token_prefix,
            syncConfig: session.sync_config,
            lastSyncAt: Date.now(),
            error: null,
          })

          // Download remote data for this new session
          try {
            const { useHistoryStore } = await import('@/stores/history-store')
            const { useEnvironmentStore } = await import('@/stores/environment-store')
            const { useCollectionStore } = await import('@/stores/collection-store')
            const { useSettingsStore } = await import('@/stores/settings-store')

            const allData = await client.downloadAllData()
            for (const [dataType, plaintext] of Object.entries(allData)) {
              if (!plaintext) continue
              try {
                const parsed = JSON.parse(plaintext)
                switch (dataType) {
                  case 'history':
                    useHistoryStore.setState({ entries: parsed })
                    break
                  case 'environment':
                    useEnvironmentStore.setState({ environments: parsed })
                    break
                  case 'collection':
                    useCollectionStore.setState({ collections: parsed })
                    break
                  case 'setting':
                    useSettingsStore.setState({ settings: parsed })
                    break
                }
              } catch { /* skip invalid data */ }
            }
          } catch { /* download on connect is best-effort */ }
        } catch (err: any) {
          set({
            status: 'error',
            error: err.message || 'Failed to connect',
          })
          throw err
        }
      },

      disconnect: async () => {
        try {
          await client.revokeSession()
        } catch { /* ignore */ }
        client.clearSession()
        set({
          status: 'disconnected',
          sessionToken: null,
          tokenPrefix: null,
          syncConfig: null,
          lastSyncAt: null,
          error: null,
          devices: [],
        })
      },

      syncNow: async () => {
        const state = get()
        if (state.status !== 'connected') return

        set({ status: 'syncing', error: null })

        try {
          const { useHistoryStore } = await import('@/stores/history-store')
          const { useEnvironmentStore } = await import('@/stores/environment-store')
          const { useCollectionStore } = await import('@/stores/collection-store')
          const { useSettingsStore } = await import('@/stores/settings-store')

          const config = get().syncConfig || defaultConfig

          // Upload local changes
          if (config.sync_history) {
            const entries = useHistoryStore.getState().entries
            await client.uploadData('history', JSON.stringify(entries))
          }
          if (config.sync_environments) {
            const envs = useEnvironmentStore.getState().environments
            await client.uploadData('environment', JSON.stringify(envs))
          }
          if (config.sync_collections) {
            const collections = useCollectionStore.getState().collections
            await client.uploadData('collection', JSON.stringify(collections))
          }
          if (config.sync_settings) {
            const settings = useSettingsStore.getState().settings
            await client.uploadData('setting', JSON.stringify(settings))
          }

          // Download remote changes
          const allData = await client.downloadAllData()

          for (const [dataType, plaintext] of Object.entries(allData)) {
            if (!plaintext) continue
            try {
              const parsed = JSON.parse(plaintext)
              switch (dataType) {
                case 'history':
                  useHistoryStore.setState({ entries: parsed })
                  break
                case 'environment':
                  useEnvironmentStore.setState({ environments: parsed })
                  break
                case 'collection':
                  useCollectionStore.setState({ collections: parsed })
                  break
                case 'setting':
                  useSettingsStore.setState({ settings: parsed })
                  break
              }
            } catch { /* skip invalid data */ }
          }

          set({ status: 'connected', lastSyncAt: Date.now(), error: null })
        } catch (err: any) {
          set({
            status: 'error',
            error: err.message || 'Sync failed',
          })
          throw err
        }
      },

      updateConfig: async (config: Partial<SyncConfig>) => {
        const current = get().syncConfig || defaultConfig
        const merged = { ...current, ...config }
        set({ syncConfig: merged })

        try {
          await client.updateSyncConfig(config)
        } catch (err: any) {
          set({ error: err.message || 'Failed to update config' })
        }
      },

      refreshDevices: async () => {
        try {
          const devices = await client.fetchDevices()
          set({ devices: devices as DeviceInfo[] })
        } catch { /* ignore */ }
      },

      revokeDevice: async (deviceId: string) => {
        await client.revokeDevice(deviceId)
        const devices = get().devices.filter((d) => d.id !== deviceId)
        set({ devices })
      },

      rotateToken: async () => {
        try {
          await client.rotateToken()
          set({ error: null })
        } catch (err: any) {
          set({ error: err.message || 'Token rotation failed' })
        }
      },
    }),
    {
      name: 'flamingo-sync',
      partialize: (state) => ({
        sessionToken: state.sessionToken,
        tokenPrefix: state.tokenPrefix,
        syncConfig: state.syncConfig,
        status: state.sessionToken ? 'connected' : 'disconnected',
      }),
    }
  )
)
