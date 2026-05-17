import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useCollectionStore } from '@/stores/collection-store'
import { useTabStore } from '@/stores/tab-store'
import { getMethodColor } from '@/lib/utils'
import type { Collection } from '@/lib/types'

export default function CollectionsPanel() {
  const collections = useCollectionStore((s) => s.collections)
  const expandedFolders = useCollectionStore((s) => s.expandedFolders)
  const toggleFolder = useCollectionStore((s) => s.toggleFolder)
  const createCollection = useCollectionStore((s) => s.createCollection)
  const deleteCollection = useCollectionStore((s) => s.deleteCollection)
  const selectedCollectionId = useCollectionStore((s) => s.selectedCollectionId)
  const setSelectedCollection = useCollectionStore((s) => s.setSelectedCollection)
  const createTab = useTabStore((s) => s.createTab)
  const setActiveTab = useTabStore((s) => s.setActiveTab)
  const requestsMap = useTabStore((s) => s.requests)

  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    createCollection(name)
    setNewName('')
    setAdding(false)
  }

  if (collections.length === 0 && !adding) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <Folder className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground text-center px-4">
          Save requests to collections to organize them
        </p>
        <button
          className="text-xs text-primary hover:underline mt-1"
          onClick={() => setAdding(true)}
        >
          Create Collection
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {adding && (
        <div className="flex items-center gap-1 px-2 py-1">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') { setAdding(false); setNewName('') }
            }}
            onBlur={() => { if (!newName.trim()) setAdding(false) }}
            placeholder="Collection name..."
            className="flex-1 h-6 text-xs bg-muted/30 border border-border rounded px-1.5 outline-none focus:border-ring"
          />
        </div>
      )}
      {collections.map((collection) => (
        <CollectionItem
          key={collection.id}
          collection={collection}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
          createTab={createTab}
          setActiveTab={setActiveTab}
          requestsMap={requestsMap}
          selectedCollectionId={selectedCollectionId}
          setSelectedCollection={setSelectedCollection}
        />
      ))}
      {!adding && (
        <button
          className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 transition-all"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3" />
          New Collection
        </button>
      )}
    </div>
  )
}

function CollectionItem({
  collection,
  expandedFolders,
  toggleFolder,
  createTab,
  setActiveTab,
  requestsMap,
  selectedCollectionId,
  setSelectedCollection,
}: {
  collection: Collection
  expandedFolders: string[]
  toggleFolder: (id: string) => void
  createTab: (requestId?: string) => string
  setActiveTab: (tabId: string) => void
  requestsMap: Record<string, any>
  selectedCollectionId: string | null
  setSelectedCollection: (id: string | null) => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(collection.name)
  const renameCollection = useCollectionStore((s) => s.renameCollection)
  const deleteCollection = useCollectionStore((s) => s.deleteCollection)

  const hasChildren = collection.children.length > 0
  const isExpanded = expandedFolders.includes(collection.id)

  const handleRename = () => {
    const name = renameValue.trim()
    if (name) {
      renameCollection(collection.id, name)
    }
    setRenaming(false)
  }

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 px-2 py-1 text-xs rounded-md cursor-pointer transition-all
          ${selectedCollectionId === collection.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}
        onClick={() => {
          setSelectedCollection(collection.id)
          if (hasChildren) toggleFolder(collection.id)
        }}
      >
        {hasChildren ? (
          isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {hasChildren ? (
          isExpanded ? <FolderOpen className="h-3.5 w-3.5 shrink-0" /> : <Folder className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <FileText className="h-3.5 w-3.5 shrink-0" />
        )}
        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') { setRenaming(false); setRenameValue(collection.name) }
            }}
            onBlur={handleRename}
            className="flex-1 h-5 text-xs bg-muted/30 border border-border rounded px-1 outline-none focus:border-ring"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate flex-1">{collection.name}</span>
        )}
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); setRenaming(true); setRenameValue(collection.name) }}
            title="Rename"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </button>
          <button
            className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); deleteCollection(collection.id) }}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-3 border-l border-border/50 pl-1">
          {collection.children.map((child, i) => {
            if (typeof child === 'string') {
              return (
                <RequestItem
                  key={child}
                  requestId={child}
                  requestsMap={requestsMap}
                  createTab={createTab}
                  setActiveTab={setActiveTab}
                />
              )
            }
            return (
              <CollectionItem
                key={child.id}
                collection={child}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                createTab={createTab}
                setActiveTab={setActiveTab}
                requestsMap={requestsMap}
                selectedCollectionId={selectedCollectionId}
                setSelectedCollection={setSelectedCollection}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function RequestItem({
  requestId,
  requestsMap,
  createTab,
  setActiveTab,
}: {
  requestId: string
  requestsMap: Record<string, any>
  createTab: (requestId?: string) => string
  setActiveTab: (tabId: string) => void
}) {
  const request = requestsMap[requestId]
  const name = request?.name || 'Untitled Request'
  const method = request?.method || 'GET'

  return (
    <button
      className="w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all"
      onClick={() => {
        const tabId = createTab(requestId)
        setActiveTab(tabId)
      }}
    >
      <FileText className="h-3 w-3 shrink-0" />
      <span className={`text-[10px] font-mono font-semibold uppercase shrink-0 ${getMethodColor(method)}`}>
        {method}
      </span>
      <span className="truncate">{name}</span>
    </button>
  )
}
