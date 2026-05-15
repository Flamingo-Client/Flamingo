import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Tab, FlamingoRequest, FlamingoResponse } from '@/lib/types'
import { generateId } from '@/lib/utils'

function createDefaultRequest(id: string): FlamingoRequest {
  return {
    id,
    name: 'New Request',
    method: 'GET',
    url: '',
    params: [],
    headers: [],
    auth: { type: 'none' },
    body: { type: 'none', content: '' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

interface TabState {
  tabs: Tab[]
  activeTabId: string | null
  requests: Record<string, FlamingoRequest>

  createTab: (requestId?: string) => string
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  duplicateTab: (tabId: string) => void
  togglePinTab: (tabId: string) => void
  updateRequest: (requestId: string, updates: Partial<FlamingoRequest>) => void
  setTabResponse: (tabId: string, response: FlamingoResponse) => void
  setTabLoading: (tabId: string, loading: boolean) => void
  setScriptLogs: (tabId: string, logs: import('@/lib/types').ScriptLogEntry[]) => void
  getActiveTab: () => Tab | null
  getActiveRequest: () => FlamingoRequest | null
}

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      requests: {},

      createTab: (requestId?: string) => {
        const id = requestId || generateId()
        const request = get().requests[id] || createDefaultRequest(id)
        const tab: Tab = {
          id: generateId(),
          requestId: id,
          name: request.name,
          pinned: false,
          isLoading: false,
        }

        set((state) => ({
          tabs: [...state.tabs, tab],
          activeTabId: tab.id,
          requests: { ...state.requests, [id]: request },
        }))

        return tab.id
      },

      closeTab: (tabId: string) => {
        set((state) => {
          const index = state.tabs.findIndex((t) => t.id === tabId)
          const newTabs = state.tabs.filter((t) => t.id !== tabId)

          let newActiveId = state.activeTabId
          if (state.activeTabId === tabId) {
            if (newTabs.length > 0) {
              newActiveId = newTabs[Math.min(index, newTabs.length - 1)].id
            } else {
              newActiveId = null
            }
          }

          return { tabs: newTabs, activeTabId: newActiveId }
        })
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      reorderTabs: (fromIndex, toIndex) => {
        set((state) => {
          const newTabs = [...state.tabs]
          const [moved] = newTabs.splice(fromIndex, 1)
          newTabs.splice(toIndex, 0, moved)
          return { tabs: newTabs }
        })
      },

      duplicateTab: (tabId) => {
        const state = get()
        const tab = state.tabs.find((t) => t.id === tabId)
        if (!tab) return

        const request = state.requests[tab.requestId]
        if (!request) return

        const newRequestId = generateId()
        const newRequest = { ...request, id: newRequestId, name: `${request.name} (copy)`, createdAt: Date.now(), updatedAt: Date.now() }
        const newTab: Tab = {
          id: generateId(),
          requestId: newRequestId,
          name: newRequest.name,
          pinned: false,
          isLoading: false,
        }

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
          requests: { ...state.requests, [newRequestId]: newRequest },
        }))
      },

      togglePinTab: (tabId) => {
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, pinned: !t.pinned } : t)),
        }))
      },

      updateRequest: (requestId, updates) => {
        set((state) => {
          const request = state.requests[requestId]
          if (!request) return state

          const updated = { ...request, ...updates, updatedAt: Date.now() }

          const newTabs = state.tabs.map((t) =>
            t.requestId === requestId ? { ...t, name: updated.name || t.name } : t
          )

          return {
            requests: { ...state.requests, [requestId]: updated },
            tabs: newTabs,
          }
        })
      },

      setTabResponse: (tabId, response) => {
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, response, isLoading: false } : t)),
        }))
      },

      setTabLoading: (tabId, loading) => {
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, isLoading: loading } : t)),
        }))
      },

      setScriptLogs: (tabId, logs) => {
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, scriptLogs: logs } : t)),
        }))
      },

      getActiveTab: () => {
        const state = get()
        return state.tabs.find((t) => t.id === state.activeTabId) || null
      },

      getActiveRequest: () => {
        const state = get()
        const tab = state.tabs.find((t) => t.id === state.activeTabId)
        if (!tab) return null
        return state.requests[tab.requestId] || null
      },
    }),
    {
      name: 'flamingo-tabs',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        requests: state.requests,
      }),
    }
  )
)
