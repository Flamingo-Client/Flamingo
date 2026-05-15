import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Collection } from '@/lib/types'
import { generateId } from '@/lib/utils'
import { useSyncStore } from '@/lib/sync/sync-store'
import { isConnected } from '@/lib/sync/sync-client'

interface CollectionState {
  collections: Collection[]
  expandedFolders: string[]
  selectedCollectionId: string | null
  createCollection: (name: string, parentId?: string) => string
  renameCollection: (id: string, name: string) => void
  deleteCollection: (id: string) => void
  addRequestToCollection: (collectionId: string, requestId: string) => void
  removeRequestFromCollection: (collectionId: string, requestId: string) => void
  moveItem: (fromId: string, toId: string, itemId: string) => void
  toggleFolder: (id: string) => void
  setSelectedCollection: (id: string | null) => void
}

function findAndModify(items: any[], id: string, fn: (item: any) => any): any[] {
  return items.map((item) => {
    if (typeof item === 'string') return item
    if (item.id === id) return fn(item)
    return { ...item, children: findAndModify(item.children || [], id, fn) }
  })
}

function triggerSync(collections: Collection[]) {
  if (!isConnected()) return
  const config = useSyncStore.getState().syncConfig
  if (!config?.sync_collections) return

  import('@/lib/sync/sync-client').then(({ uploadData }) => {
    uploadData('collection', JSON.stringify(collections)).catch(() => {})
  })
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      collections: [],
      expandedFolders: [],
      selectedCollectionId: null,

      createCollection: (name, parentId) => {
        const id = generateId()
        const newCollection: Collection = {
          id, name, children: [],
          createdAt: Date.now(), updatedAt: Date.now(),
        }

        if (parentId) {
          set((state) => ({
            collections: findAndModify(state.collections, parentId, (item: any) => ({
              ...item, children: [...item.children, newCollection], updatedAt: Date.now(),
            })),
            expandedFolders: state.expandedFolders.includes(parentId)
              ? state.expandedFolders
              : [...state.expandedFolders, parentId],
          }))
        } else {
          set((state) => {
            const newColls = [...state.collections, newCollection]
            triggerSync(newColls)
            return { collections: newColls }
          })
        }
        return id
      },

      renameCollection: (id, name) => {
        set((state) => ({
          collections: findAndModify(state.collections, id, (item: any) => ({ ...item, name, updatedAt: Date.now() })),
        }))
      },

      deleteCollection: (id) => {
        set((state) => {
          const removeItem = (items: any[]): any[] =>
            items.filter((item: any) => {
              if (typeof item === 'string') return true
              return item.id !== id
            }).map((item: any) => {
              if (typeof item === 'string') return item
              return { ...item, children: removeItem(item.children || []) }
            })
          return {
            collections: removeItem(state.collections),
            selectedCollectionId: state.selectedCollectionId === id ? null : state.selectedCollectionId,
          }
        })
      },

      addRequestToCollection: (collectionId, requestId) => {
        set((state) => ({
          collections: findAndModify(state.collections, collectionId, (item: any) => ({
            ...item, children: [...item.children, requestId], updatedAt: Date.now(),
          })),
        }))
      },

      removeRequestFromCollection: (collectionId, requestId) => {
        set((state) => ({
          collections: findAndModify(state.collections, collectionId, (item: any) => ({
            ...item,
            children: item.children.filter((c: any) => !(typeof c === 'string' && c === requestId)),
            updatedAt: Date.now(),
          })),
        }))
      },

      moveItem: (_fromId, toId, itemId) => {
        const state = get()
        let movedItem: any = null

        const removeFromAll = (items: any[]): any[] =>
          items.filter((item: any) => {
            if (typeof item === 'string') {
              if (item === itemId) { movedItem = item; return false }
              return true
            }
            if (item.id === itemId) { movedItem = item; return false }
            return true
          }).map((item: any) => {
            if (typeof item === 'string') return item
            return { ...item, children: removeFromAll(item.children || []) }
          })

        const cleaned = removeFromAll(state.collections)

        if (movedItem) {
          set({
            collections: findAndModify(cleaned, toId, (item: any) => ({
              ...item, children: [...item.children, movedItem], updatedAt: Date.now(),
            })),
          })
        }
      },

      toggleFolder: (id) => {
        set((state) => ({
          expandedFolders: state.expandedFolders.includes(id)
            ? state.expandedFolders.filter((f) => f !== id)
            : [...state.expandedFolders, id],
        }))
      },

      setSelectedCollection: (id) => set({ selectedCollectionId: id }),
    }),
    { name: 'flamingo-collections' }
  )
)
