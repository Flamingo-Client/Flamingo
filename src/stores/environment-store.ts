import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Environment } from '@/lib/types'
import { generateId } from '@/lib/utils'
import { useSyncStore } from '@/lib/sync/sync-store'
import { isConnected } from '@/lib/sync/sync-client'

interface EnvironmentState {
  environments: Environment[]
  createEnvironment: (name: string) => string
  deleteEnvironment: (id: string) => void
  setActiveEnvironment: (id: string) => void
  updateVariable: (envId: string, key: string, value: string) => void
  deleteVariable: (envId: string, key: string) => void
  getActiveEnvironment: () => Environment | null
  resolveVariables: (text: string) => string
}

function triggerSync(environments: Environment[]) {
  if (!isConnected()) return
  const config = useSyncStore.getState().syncConfig
  if (!config?.sync_environments) return

  import('@/lib/sync/sync-client').then(({ uploadData }) => {
    uploadData('environment', JSON.stringify(environments)).catch(() => {})
  })
}

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set, get) => ({
      environments: [
        {
          id: 'global',
          name: 'Globals',
          variables: {},
          isActive: true,
          color: '#6b7280',
        },
      ],

      createEnvironment: (name) => {
        const id = generateId()
        let newEnvs: Environment[] = []
        set((state) => {
          newEnvs = [
            ...state.environments.map((e) => ({ ...e, isActive: false })),
            { id, name, variables: {}, isActive: true, color: '#3b82f6' },
          ]
          return { environments: newEnvs }
        })
        triggerSync(newEnvs)
        return id
      },

      deleteEnvironment: (id) => {
        if (id === 'global') return
        let newEnvs: Environment[] = []
        set((state) => {
          newEnvs = state.environments.filter((e) => e.id !== id)
          return { environments: newEnvs }
        })
        triggerSync(newEnvs)
      },

      setActiveEnvironment: (id) => {
        set((state) => ({
          environments: state.environments.map((e) => ({
            ...e,
            isActive: e.id === id,
          })),
        }))
      },

      updateVariable: (envId, key, value) => {
        let newEnvs: Environment[] = []
        set((state) => {
          newEnvs = state.environments.map((e) =>
            e.id === envId
              ? { ...e, variables: { ...e.variables, [key]: value } }
              : e
          )
          return { environments: newEnvs }
        })
        triggerSync(newEnvs)
      },

      deleteVariable: (envId, key) => {
        let newEnvs: Environment[] = []
        set((state) => {
          const env = state.environments.find((e) => e.id === envId)
          if (!env) return state
          const { [key]: _, ...rest } = env.variables
          newEnvs = state.environments.map((e) =>
            e.id === envId ? { ...e, variables: rest } : e
          )
          return { environments: newEnvs }
        })
        triggerSync(newEnvs)
      },

      getActiveEnvironment: () => {
        return get().environments.find((e) => e.isActive) || null
      },

      resolveVariables: (text) => {
        const active = get().environments.find((e) => e.isActive)
        if (!active || !text) return text
        let resolved = text
        for (const [key, value] of Object.entries(active.variables)) {
          resolved = resolved.replace(new RegExp(`{{${key}}}`, 'g'), value)
        }
        return resolved
      },
    }),
    { name: 'flamingo-environments' }
  )
)
