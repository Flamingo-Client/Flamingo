import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HistoryEntry } from '@/lib/types'
import { generateId } from '@/lib/utils'
import { useSyncStore } from '@/lib/sync/sync-store'
import { isConnected } from '@/lib/sync/sync-client'

interface HistoryState {
  entries: HistoryEntry[]
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => void
  clearHistory: () => void
  removeEntry: (id: string) => void
}

function triggerSync(entries: HistoryEntry[]) {
  if (!isConnected()) return
  const config = useSyncStore.getState().syncConfig
  if (!config?.sync_history) return

  import('@/lib/sync/sync-client').then(({ uploadData }) => {
    uploadData('history', JSON.stringify(entries)).catch(() => {})
  })
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        let newEntries: HistoryEntry[] = []
        set((state) => {
          newEntries = [
            {
              ...entry,
              id: generateId(),
              createdAt: Date.now(),
            },
            ...state.entries,
          ].slice(0, 200)
          return { entries: newEntries }
        })
        triggerSync(newEntries)
      },

      clearHistory: () => {
        set({ entries: [] })
        if (isConnected()) {
          import('@/lib/sync/sync-client').then(({ deleteData }) => {
            deleteData('history').catch(() => {})
          })
        }
      },

      removeEntry: (id) => {
        let newEntries: HistoryEntry[] = []
        set((state) => {
          newEntries = state.entries.filter((e) => e.id !== id)
          return { entries: newEntries }
        })
        triggerSync(newEntries)
      },
    }),
    { name: 'flamingo-history' }
  )
)
