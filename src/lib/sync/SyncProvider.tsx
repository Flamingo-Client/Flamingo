'use client'

import { useEffect, useRef } from 'react'
import { useSyncStore } from './sync-store'
import {
  isConnected,
  getSyncConfig,
  downloadAllData,
  getMasterKey,
  setupEncryption,
} from './sync-client'
import { useHistoryStore } from '@/stores/history-store'
import { useEnvironmentStore } from '@/stores/environment-store'
import { useCollectionStore } from '@/stores/collection-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useTabStore } from '@/stores/tab-store'

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const initializeSync = async () => {
      const store = useSyncStore.getState()

      if (!isConnected()) {
        store.status = 'disconnected'
        return
      }

      // Validate session by trying to fetch config
      const config = await getSyncConfig()
      if (!config) {
        store.status = 'disconnected'
        store.error = 'Session expired. Please reconnect.'
        return
      }

      store.status = 'connected'
      store.syncConfig = config

      // Ensure master key is available (fetch or create)
      let localKey = await getMasterKey()
      if (!localKey) {
        try {
          const { isNew } = await setupEncryption()
          localKey = await getMasterKey()
          if (!localKey && !isNew) {
            store.error = 'Failed to retrieve encryption key'
            return
          }
        } catch {
          store.error = 'Failed to set up encryption'
          return
        }
      }

      // Download and restore all synced data
      try {
        store.status = 'syncing'
        const allData = await downloadAllData()

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
              case 'collection': {
                if (Array.isArray(parsed)) {
                  useCollectionStore.setState({ collections: parsed })
                } else {
                  useCollectionStore.setState({ collections: parsed.collections })
                  if (parsed.requests) {
                    const current = useTabStore.getState().requests
                    useTabStore.setState({ requests: { ...current, ...parsed.requests } })
                  }
                }
                break
              }
              case 'setting':
                useSettingsStore.setState({ settings: parsed })
                break
            }
          } catch { /* skip invalid data */ }
        }

        store.status = 'connected'
        store.lastSyncAt = Date.now()
      } catch (err: any) {
        store.status = 'error'
        store.error = err.message || 'Failed to restore synced data'
      }
    }

    initializeSync()
  }, [])

  return <>{children}</>
}
