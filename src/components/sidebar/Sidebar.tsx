import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Beaker,
  History,
  Star,
  Folder,
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
import { Modal } from '@/components/ui/modal'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useUIStore } from '@/stores/ui-store'
import { useTabStore } from '@/stores/tab-store'
import { parseCurl } from '@/lib/curl-parser'
import { generateId } from '@/lib/utils'
import type { HttpMethod, AuthType, RequestBody, KeyValuePair } from '@/lib/types'
import SettingsModal from './SettingsModal'
import HistoryPanel from './HistoryPanel'
import CollectionsPanel from './CollectionsPanel'
import EnvironmentsPanel from './EnvironmentsPanel'
import FavoritesPanel from './FavoritesPanel'
import SyncPanel from './SyncPanel'

type PanelType = 'history' | 'collections' | 'environments' | 'favorites' | 'sync'

const panels: { id: PanelType; label: string; icon: typeof Beaker }[] = [
  { id: 'history', label: 'History', icon: History },
  { id: 'collections', label: 'Collections', icon: Folder },
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
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="flex w-64 shrink-0 flex-col overflow-hidden bg-canvas"
          >
            <div className="flex items-center gap-1 px-2.5 pb-2">
              <div className="flex flex-1 items-center gap-0.5 overflow-x-auto">
                {panels.map((panel) => {
                  const Icon = panel.icon
                  const active = activePanel === panel.id
                  return (
                    <Tooltip key={panel.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`shrink-0 ${active ? 'bg-surface text-body shadow-[0_1px_2px_rgb(0_0_0/0.05)]' : 'text-faint hover:text-body'}`}
                          onClick={() => setActivePanel(panel.id)}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{panel.label}</TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="shrink-0 text-faint hover:text-body">
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Close sidebar</TooltipContent>
              </Tooltip>
            </div>

            <div className="px-2.5 pb-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
                <Input
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 rounded-sm border-transparent bg-surface pl-8 text-[12px] shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
                />
              </div>
            </div>

            <ScrollArea className="scrollbar-thin flex-1">
              <div className="px-1.5 pb-2">
                {activePanel === 'history' && <HistoryPanel searchQuery={searchQuery} />}
                {activePanel === 'collections' && <CollectionsPanel />}
                {activePanel === 'environments' && <EnvironmentsPanel />}
                {activePanel === 'favorites' && <FavoritesPanel />}
                {activePanel === 'sync' && <SyncPanel />}
              </div>
            </ScrollArea>

            <div className="flex items-center gap-1 border-t border-line px-2.5 py-2">
              <Button variant="ghost" size="sm" className="flex-1 justify-start px-2 text-[12px]" onClick={handleNew}>
                <Plus className="h-3.5 w-3.5" />
                New request
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-faint hover:text-body" onClick={() => setCurlModalOpen(true)}>
                    <Code2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Import cURL</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-faint hover:text-body" onClick={() => setSettingsOpen(true)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-faint hover:text-body" onClick={() => {
                    const url = 'https://github.com/Flamingo-Client/Flamingo'
                    if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url)
                    else window.open(url, '_blank')
                  }}>
                    <Github className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">GitHub</TooltipContent>
              </Tooltip>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {collapsed && (
        <div className="flex w-12 shrink-0 flex-col items-center gap-1 bg-canvas pb-2">
          {panels.map((panel) => {
            const Icon = panel.icon
            const active = activePanel === panel.id
            return (
              <Tooltip key={panel.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={active ? 'bg-surface text-body shadow-[0_1px_2px_rgb(0_0_0/0.05)]' : 'text-faint hover:text-body'}
                    onClick={() => {
                      setActivePanel(panel.id)
                      setCollapsed(false)
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{panel.label}</TooltipContent>
              </Tooltip>
            )
          })}
          <div className="flex-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => {
                const url = 'https://github.com/Flamingo-Client/Flamingo'
                if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url)
                else window.open(url, '_blank')
              }} className="text-faint hover:text-body">
                <Github className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">GitHub</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} className="text-faint hover:text-body">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} className="text-faint hover:text-body">
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Open sidebar</TooltipContent>
          </Tooltip>
        </div>
      )}

      <SettingsModal />

      <Modal
        open={curlModalOpen}
        onClose={() => { setCurlModalOpen(false); setCurlInput('') }}
        title="Import cURL"
        description="Paste a command and Flamingo will build the request for you."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setCurlModalOpen(false); setCurlInput('') }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleImportCurl} disabled={!curlInput.trim() || !parseCurl(curlInput.trim())}>
              Import
            </Button>
          </>
        }
      >
        <textarea
          value={curlInput}
          onChange={(e) => setCurlInput(e.target.value)}
          placeholder="curl https://api.example.com/v1/users -H 'Accept: application/json'"
          className="h-32 w-full resize-none rounded-sm border border-line-strong bg-surface p-3 font-mono text-xs leading-relaxed text-body outline-none transition-all duration-200 ease-out-expo placeholder:text-faint focus:border-body focus:ring-[3px] focus:ring-accent/[0.08]"
          autoFocus
        />
        {curlInput.trim() && !parseCurl(curlInput.trim()) && (
          <p className="mt-2 text-[12px] text-bad">Could not parse this cURL command.</p>
        )}
      </Modal>
    </>
  )
}
