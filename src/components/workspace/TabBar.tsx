import { useCallback, useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Pin, Copy, Loader2, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Modal } from '@/components/ui/modal'
import { useTabStore } from '@/stores/tab-store'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import CollectionPicker from '@/components/CollectionPicker'

export default function TabBar() {
  const { tabs, activeTabId, createTab, setActiveTab, closeTab, duplicateTab, togglePinTab } = useTabStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [menuState, setMenuState] = useState<{ tabId: string; x: number; y: number } | null>(null)
  const [pickState, setPickState] = useState<{ tabId: string; requestId: string } | null>(null)
  const [pickNewName, setPickNewName] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setMenuState(null)
    window.addEventListener('scroll', handler, true)
    return () => window.removeEventListener('scroll', handler, true)
  }, [])

  useEffect(() => {
    if (!menuState) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuState(null)
      }
    }
    setTimeout(() => window.addEventListener('mousedown', handler), 0)
    return () => window.removeEventListener('mousedown', handler)
  }, [menuState])

  const handleCreateTab = useCallback(() => createTab(), [createTab])

  const handleSaveToCollection = useCallback((tabId: string) => {
    const { tabs, requests } = useTabStore.getState()
    const tab = tabs.find((t) => t.id === tabId)
    if (!tab) return
    const request = requests[tab.requestId]
    if (!request) return
    setPickState({ tabId, requestId: request.id })
    setPickNewName('')
  }, [])

  const handleCloseTab = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    closeTab(tabId)
  }, [closeTab])

  const handleMiddleClick = useCallback((e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) { e.preventDefault(); closeTab(tabId) }
  }, [closeTab])

  if (tabs.length === 0) return null

  return (
    <div className="flex h-9 shrink-0 items-center gap-1 border-b border-line bg-surface-sunken/60 px-1.5">
      <ScrollArea className="h-full flex-1">
        <div ref={scrollRef} className="flex h-full items-center gap-0.5 py-1.5">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`group relative flex h-6 min-w-0 shrink-0 cursor-pointer items-center gap-1.5 rounded-xs px-2.5 text-xs transition-all duration-200 ease-out-expo ${
                activeTabId === tab.id
                  ? 'bg-surface text-body shadow-[0_1px_2px_rgb(0_0_0/0.06)]'
                  : 'text-muted hover:bg-surface/60 hover:text-body'
              }`}
              onClick={() => setActiveTab(tab.id)}
              onMouseDown={(e) => handleMiddleClick(e, tab.id)}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenuState({ tabId: tab.id, x: e.clientX, y: e.clientY })
              }}
            >
              {tab.isLoading && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-faint" />}
              {tab.pinned && <Pin className="h-2.5 w-2.5 shrink-0 text-accent" />}
              <span className="min-w-[40px] max-w-[140px] truncate text-[11px] font-medium">{tab.name}</span>
              {!tab.pinned && (
                <span
                  className="-mr-1 ml-0.5 shrink-0 rounded-[4px] p-0.5 text-faint opacity-0 transition-all duration-150 hover:bg-line hover:text-body group-hover:opacity-100"
                  onClick={(e) => handleCloseTab(e, tab.id)}
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </motion.button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={handleCreateTab} className="text-faint hover:text-body">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">New tab · Ctrl+T</TooltipContent>
        </Tooltip>
      </div>

      <AnimatePresence>
        {menuState && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              onClick={() => setMenuState(null)}
            />
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="fixed z-50 min-w-[160px] rounded-sm border border-line bg-surface-raised p-1.5 text-body shadow-xl"
              style={{ left: menuState.x, top: menuState.y }}
            >
              <TabContextMenuItem
                icon={<Copy className="h-3.5 w-3.5" />}
                label="Duplicate"
                onClick={() => { duplicateTab(menuState.tabId); setMenuState(null) }}
              />
              <TabContextMenuItem
                icon={<Pin className="h-3.5 w-3.5" />}
                label={tabs.find(t => t.id === menuState.tabId)?.pinned ? 'Unpin' : 'Pin'}
                onClick={() => { togglePinTab(menuState.tabId); setMenuState(null) }}
              />
              <TabContextMenuItem
                icon={<Bookmark className="h-3.5 w-3.5" />}
                label="Save to Collection"
                onClick={() => { handleSaveToCollection(menuState.tabId); setMenuState(null) }}
              />
              <div className="-mx-1.5 my-1 h-px bg-line" />
              <TabContextMenuItem
                icon={<X className="h-3.5 w-3.5" />}
                label="Close"
                onClick={() => { closeTab(menuState.tabId); setMenuState(null) }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Modal
        open={!!pickState}
        onClose={() => setPickState(null)}
        title="Save to collection"
        className="max-w-sm"
      >
        {pickState && (
          <CollectionPicker
            requestId={pickState.requestId}
            onDone={() => setPickState(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function TabContextMenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="flex w-full items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-xs text-body transition-colors duration-150 hover:bg-surface-sunken"
      onClick={onClick}
    >
      <span className="text-faint">{icon}</span>
      {label}
    </button>
  )
}
