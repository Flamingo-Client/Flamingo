import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useTabStore } from '@/stores/tab-store'
import { useCollectionStore } from '@/stores/collection-store'
import { useEnvironmentStore } from '@/stores/environment-store'
import { useThemeStore } from '@/stores/theme-store'
import { useUIStore } from '@/stores/ui-store'
import { Input } from '@/components/ui/input'
import { parseCurl } from '@/lib/curl-parser'
import type { CommandPaletteItem } from '@/lib/types'
import { generateId } from '@/lib/utils'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { createTab, getActiveRequest } = useTabStore()
  const updateRequest = useTabStore((s) => s.updateRequest)
  const createCollection = useCollectionStore((s) => s.createCollection)
  const createEnvironment = useEnvironmentStore((s) => s.createEnvironment)
  const { theme, setTheme } = useThemeStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  const items = useMemo<CommandPaletteItem[]>(() => [
    { id: 'new-tab', title: 'New Tab', description: 'Open a new request tab', shortcut: 'Ctrl+T', icon: 'Plus', category: 'Requests', action: () => createTab() },
    { id: 'new-collection', title: 'New Collection', description: 'Create a request collection', icon: 'FolderTree', category: 'Collections', action: () => { const name = prompt('Collection name:'); if (name) createCollection(name) } },
    { id: 'new-environment', title: 'New Environment', description: 'Create a new environment', icon: 'Beaker', category: 'Environments', action: () => { const name = prompt('Environment name:'); if (name) createEnvironment(name) } },
    {
      id: 'import-curl', title: 'Import cURL', description: 'Import a request from cURL command', icon: 'Code2', category: 'Import',
      action: () => {
        const curl = prompt('Paste cURL command:')
        if (!curl) return
        const parsed = parseCurl(curl)
        if (!parsed) { alert('Could not parse cURL command'); return }
        const id = generateId()
        const request = { id, method: parsed.method || 'GET' as const, url: parsed.url || '', params: [], headers: parsed.headers || [], auth: { type: 'none' as const }, body: parsed.body || { type: 'none' as const, content: '' }, name: parsed.url ? `cURL ${parsed.url.slice(0, 30)}` : 'Imported Request', createdAt: Date.now(), updatedAt: Date.now() }
        useTabStore.getState().createTab(id)
        useTabStore.getState().updateRequest(id, request)
      },
    },
    {
      id: 'send-request', title: 'Send Request', description: 'Execute the current request', shortcut: 'Ctrl+Enter', icon: 'Play', category: 'Requests',
      action: () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }))
      },
    },
    {
      id: 'toggle-sidebar', title: 'Toggle Sidebar', description: 'Show or hide the sidebar', shortcut: 'Ctrl+B', icon: 'PanelLeft', category: 'View',
      action: () => toggleSidebar(),
    },
    {
      id: 'toggle-dark-mode', title: 'Toggle Dark Mode', description: 'Switch between light and dark themes', shortcut: 'Ctrl+Shift+L', icon: 'Moon', category: 'View',
      action: () => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'),
    },
  ], [createTab, createCollection, createEnvironment, theme, setTheme, toggleSidebar])

  const filtered = useMemo(() => {
    if (!query) return items
    const q = query.toLowerCase()
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [query, items])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleSelect = useCallback((item: CommandPaletteItem) => {
    item.action()
    setOpen(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault()
        handleSelect(filtered[selectedIndex])
      }
    },
    [filtered, selectedIndex, handleSelect]
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[500px] max-w-[90vw] z-50 rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search commands..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 border-0 bg-transparent text-sm focus-visible:ring-0 px-0"
              />
              <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">ESC</kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">No results</div>
              ) : (
                filtered.map((item, index) => (
                  <button
                    key={item.id}
                    className={`w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors ${
                      index === selectedIndex ? 'bg-accent text-accent-foreground' : 'text-foreground'
                    }`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs">⌘</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm">{item.title}</div>
                      {item.description && (
                        <div className="text-[11px] text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{item.shortcut}</kbd>
                    )}
                    <span className="text-[10px] text-muted-foreground">{item.category}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
