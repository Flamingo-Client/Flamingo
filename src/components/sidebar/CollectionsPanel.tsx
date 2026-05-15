import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Folder, FolderOpen, Plus, MoreHorizontal, ChevronRight, FileText, Check, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCollectionStore } from '@/stores/collection-store'
import { useTabStore } from '@/stores/tab-store'
import type { Collection } from '@/lib/types'

interface Props { searchQuery: string }

export default function CollectionsPanel({ searchQuery }: Props) {
  const { collections, expandedFolders, toggleFolder, setSelectedCollection, selectedCollectionId, createCollection, deleteCollection } = useCollectionStore()
  const createTab = useTabStore((s) => s.createTab)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreateCollection = () => {
    if (newName.trim()) {
      createCollection(newName.trim())
      setNewName('')
      setCreating(false)
    }
  }

  const handleRequestClick = (requestId: string) => {
    createTab(requestId)
  }

  const renderItem = (item: Collection | string, depth = 0) => {
    if (typeof item === 'string') {
      return (
        <motion.button
          key={item}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full flex items-center gap-2 px-2 py-1 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-all group"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => handleRequestClick(item)}
        >
          <FileText className="h-3 w-3 shrink-0" />
          <span className="truncate text-[10px]">{item.slice(0, 12)}...</span>
        </motion.button>
      )
    }

    const isExpanded = expandedFolders.includes(item.id)
    const isSelected = selectedCollectionId === item.id
    const matchesSearch = searchQuery && item.name.toLowerCase().includes(searchQuery.toLowerCase())

    if (searchQuery && !matchesSearch) return null

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer transition-all group ${isSelected ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => { toggleFolder(item.id); setSelectedCollection(item.id) }}
        >
          <ChevronRight className={`h-3 w-3 shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
          {isExpanded ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <span className="truncate flex-1 text-left">{item.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-xs">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); createCollection('New Folder', item.id) }}>
                <Folder className="h-3 w-3 mr-2" /> New Folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteCollection(item.id) }} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isExpanded && item.children.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
            {item.children.map((child) => renderItem(child, depth + 1))}
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div>
      {collections.length === 0 && !creating ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <Folder className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">No collections yet</p>
          <Button variant="secondary" size="sm" className="text-xs" onClick={() => setCreating(true)}>
            <Plus className="h-3 w-3 mr-1" /> New Collection
          </Button>
        </div>
      ) : (
        <>
          {collections.map((item) => renderItem(item))}
          {creating ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name"
                className="h-7 text-xs flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCollection(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
                autoFocus
              />
              <Button variant="ghost" size="icon-sm" onClick={handleCreateCollection}><Check className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon-sm" onClick={() => { setCreating(false); setNewName('') }}><X className="h-3 w-3" /></Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground mt-1" onClick={() => setCreating(true)}>
              <Plus className="h-3 w-3 mr-1" /> New Collection
            </Button>
          )}
        </>
      )}
    </div>
  )
}
