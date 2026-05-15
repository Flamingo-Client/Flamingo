import { useCallback, useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Pin, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTabStore } from '@/stores/tab-store'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

export default function TabBar() {
  const { tabs, activeTabId, createTab, setActiveTab, closeTab, duplicateTab, togglePinTab } = useTabStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [menuState, setMenuState] = useState<{ tabId: string; x: number; y: number } | null>(null)
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

  const handleCloseTab = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    closeTab(tabId)
  }, [closeTab])

  const handleMiddleClick = useCallback((e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) { e.preventDefault(); closeTab(tabId) }
  }, [closeTab])

  if (tabs.length === 0) return null

  return (
    <div className="flex items-center h-9 bg-muted/30 border-b border-border shrink-0">
      <ScrollArea className="flex-1 h-full">
        <div ref={scrollRef} className="flex items-center h-full">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`group relative flex items-center gap-1.5 px-3 h-full text-xs border-r border-border cursor-pointer transition-colors shrink-0 min-w-0 ${
                activeTabId === tab.id
                  ? 'bg-background text-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => setActiveTab(tab.id)}
              onMouseDown={(e) => handleMiddleClick(e, tab.id)}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenuState({ tabId: tab.id, x: e.clientX, y: e.clientY })
              }}
            >
              {tab.isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />}
              <span className="truncate text-[11px] min-w-[40px] max-w-[120px]">{tab.name}</span>
              {tab.pinned && <Pin className="h-2.5 w-2.5 text-primary shrink-0" />}
              {!tab.pinned && (
                <span
                  className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => handleCloseTab(e, tab.id)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </span>
              )}
              {activeTabId === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </motion.button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="px-1 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={handleCreateTab} className="text-muted-foreground">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Tab (Ctrl+T)</TooltipContent>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-50 min-w-[140px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
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
              <div className="h-px bg-border my-0.5" />
              <TabContextMenuItem
                icon={<X className="h-3.5 w-3.5" />}
                label="Close"
                onClick={() => { closeTab(menuState.tabId); setMenuState(null) }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function TabContextMenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
      onClick={onClick}
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  )
}
