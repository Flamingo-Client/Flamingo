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
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[3px]"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[14%] z-50 w-[540px] max-w-[90vw] -translate-x-1/2 overflow-hidden rounded-lg border border-line bg-surface-raised shadow-2xl"
          >
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-1">
              <Search className="h-4 w-4 shrink-0 text-faint" />
              <Input
                ref={inputRef}
                placeholder="Search commands…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-11 border-0 bg-transparent px-0 text-sm focus:ring-0"
              />
              <kbd className="shrink-0 rounded-[5px] border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-faint">ESC</kbd>
            </div>
            <div className="scrollbar-thin max-h-80 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-muted">No commands match your search</div>
              ) : (
                filtered.map((item, index) => (
                  <button
                    key={item.id}
                    className={`flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-sm transition-colors duration-150 ${
                      index === selectedIndex ? 'bg-surface-sunken text-body' : 'text-body'
                    }`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border border-line bg-surface text-[11px] text-faint">
                      ⌘
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="truncate text-[13px] font-medium">{item.title}</div>
                      {item.description && (
                        <div className="truncate text-[11px] text-muted">{item.description}</div>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="shrink-0 rounded-[5px] border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted">{item.shortcut}</kbd>
                    )}
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-faint">{item.category}</span>
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
