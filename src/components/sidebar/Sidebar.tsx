import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Beaker,
  History,
  Star,
  Settings,
  Search,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Code2,
  RefreshCcw,
  Github,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useUIStore } from '@/stores/ui-store'
import { useTabStore } from '@/stores/tab-store'
import { parseCurl } from '@/lib/curl-parser'
import { generateId } from '@/lib/utils'
import type { HttpMethod, AuthType, RequestBody, KeyValuePair } from '@/lib/types'
import SettingsModal from './SettingsModal'
import HistoryPanel from './HistoryPanel'
import EnvironmentsPanel from './EnvironmentsPanel'
import FavoritesPanel from './FavoritesPanel'
import SyncPanel from './SyncPanel'

type PanelType = 'history' | 'environments' | 'favorites' | 'sync'

const panels: { id: PanelType; label: string; icon: typeof Beaker }[] = [
  { id: 'history', label: 'History', icon: History },
  { id: 'environments', label: 'Environments', icon: Beaker },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'sync', label: 'Sync', icon: RefreshCcw },
]

export default function Sidebar() {
  const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed, setSettingsOpen } = useUIStore()
  const [activePanel, setActivePanel] = useState<PanelType>('history')
  const [searchQuery, setSearchQuery] = useState('')
  const [curlModalOpen, setCurlModalOpen] = useState(false)
  const [curlInput, setCurlInput] = useState('')
  const createTab = useTabStore((s) => s.createTab)

  const handleNew = () => {
    createTab()
  }

  const handleImportCurl = useCallback(() => {
    const parsed = parseCurl(curlInput)
    if (!parsed) return
    const id = generateId()
    const request: Partial<import('@/lib/types').FlamingoRequest> = {
      id, method: (parsed.method || 'GET') as HttpMethod, url: parsed.url || '', params: [], headers: parsed.headers || [],
      auth: { type: 'none' as AuthType }, body: parsed.body || { type: 'none' as const, content: '' },
      name: parsed.url ? `cURL ${parsed.url.slice(0, 30)}` : 'Imported Request',
      createdAt: Date.now(), updatedAt: Date.now(),
    }
    createTab(id)
    useTabStore.getState().updateRequest(id, request)
    setCurlModalOpen(false)
    setCurlInput('')
  }, [curlInput])

  return (
    <>
      <AnimatePresence>
        {!collapsed && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="border-r border-sidebar-border bg-sidebar flex flex-col shrink-0 overflow-hidden"
          >
            <div className="flex items-center gap-1 p-2 pb-0">
              <div className="flex-1 flex items-center gap-0.5 overflow-x-auto">
                {panels.map((panel) => {
                  const Icon = panel.icon
                  return (
                    <Tooltip key={panel.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className={`shrink-0 ${activePanel === panel.id ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}
                          onClick={() => setActivePanel(panel.id)}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">{panel.label}</TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed(true)} className="text-muted-foreground shrink-0">
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Close sidebar</TooltipContent>
              </Tooltip>
            </div>

            <div className="px-2 py-1.5">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-7 text-xs bg-muted/50 border-0"
                />
              </div>
            </div>

            <Separator />

            <ScrollArea className="flex-1">
              <div className="p-1">
                {activePanel === 'history' && <HistoryPanel searchQuery={searchQuery} />}
                {activePanel === 'environments' && <EnvironmentsPanel />}
                {activePanel === 'favorites' && <FavoritesPanel />}
                {activePanel === 'sync' && <SyncPanel />}
              </div>
            </ScrollArea>

            <Separator />

            <div className="p-1.5 flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground flex-1 justify-start" onClick={handleNew}>
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={() => setCurlModalOpen(true)}>
                <Code2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={() => {
                const url = 'https://github.com/Flamingo-Client/Flamingo'
                if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url)
                else window.open(url, '_blank')
              }}>
                <Github className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {collapsed && (
        <div className="flex flex-col items-center gap-1 w-10 border-r border-sidebar-border bg-sidebar py-1 shrink-0">
          {panels.map((panel) => {
            const Icon = panel.icon
            return (
              <Tooltip key={panel.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={`${activePanel === panel.id ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}
                    onClick={() => {
                      setActivePanel(panel.id)
                      setCollapsed(false)
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{panel.label}</TooltipContent>
              </Tooltip>
            )
          })}
          <div className="flex-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => {
                const url = 'https://github.com/Flamingo-Client/Flamingo'
                if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url)
                else window.open(url, '_blank')
              }} className="text-muted-foreground">
                <Github className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">GitHub</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => setSettingsOpen(true)} className="text-muted-foreground">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed(false)} className="text-muted-foreground">
                <PanelLeft className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Open sidebar</TooltipContent>
          </Tooltip>
        </div>
      )}

      <SettingsModal />

      <AnimatePresence>
        {curlModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => { setCurlModalOpen(false); setCurlInput('') }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-popover border border-border rounded-xl shadow-2xl w-full max-w-lg p-4 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold">Import cURL</h3>
              <textarea
                value={curlInput}
                onChange={(e) => setCurlInput(e.target.value)}
                placeholder="Paste cURL command here..."
                className="w-full h-28 text-xs font-mono bg-muted/30 border border-border rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
              {curlInput.trim() && !parseCurl(curlInput.trim()) && (
                <p className="text-[10px] text-destructive">Could not parse cURL command</p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setCurlModalOpen(false); setCurlInput('') }}>
                  Cancel
                </Button>
                <Button size="sm" className="text-xs" onClick={handleImportCurl} disabled={!curlInput.trim() || !parseCurl(curlInput.trim())}>
                  Import
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
