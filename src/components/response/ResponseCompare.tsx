import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, GitCompare, ChevronDown } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTabStore } from '@/stores/tab-store'
import { useSettingsStore } from '@/stores/settings-store'
import { formatBytes, formatTime, detectLanguage } from '@/lib/utils'
import type { Tab, FlamingoResponse } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  currentTab: Tab
  currentResponse: FlamingoResponse
}

export default function ResponseCompare({ open, onClose, currentTab, currentResponse }: Props) {
  const tabs = useTabStore((s) => s.tabs)
  const settings = useSettingsStore((s) => s.settings)
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null)

  const otherTabs = useMemo(
    () => tabs.filter((t) => t.id !== currentTab.id && t.response),
    [tabs, currentTab.id]
  )

  const otherTab = useMemo(
    () => tabs.find((t) => t.id === selectedTabId),
    [tabs, selectedTabId]
  )
  const otherResponse = otherTab?.response

  const currentLang = detectLanguage(currentResponse.body)
  const otherLang = otherResponse ? detectLanguage(otherResponse.body) : 'plaintext'

  const formatBody = (body: string) => {
    const lang = detectLanguage(body)
    if (lang === 'json') {
      try { return JSON.stringify(JSON.parse(body), null, settings.tabSize) } catch { return body }
    }
    return body
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-popover border border-border rounded-xl shadow-2xl w-[90vw] h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Compare Responses</h2>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="px-4 py-2 border-b border-border shrink-0 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Compare with:</span>
              {otherTabs.length === 0 ? (
                <span className="text-xs text-muted-foreground/50 italic">
                  No other tabs with responses
                </span>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      {otherTab?.name || 'Select a tab'}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-48 overflow-y-auto">
                    {otherTabs.map((t) => (
                      <DropdownMenuItem key={t.id} onClick={() => setSelectedTabId(t.id)} className="text-xs">
                        {t.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex-1 grid grid-cols-2 divide-x divide-border min-h-0">
              <ResponsePanel
                label={currentTab.name}
                response={currentResponse}
                lang={currentLang}
                body={formatBody(currentResponse.body)}
                fontSize={settings.fontSize}
              />
              {otherResponse ? (
                <ResponsePanel
                  label={otherTab!.name}
                  response={otherResponse}
                  lang={otherLang}
                  body={formatBody(otherResponse.body)}
                  fontSize={settings.fontSize}
                />
              ) : (
                <div className="flex items-center justify-center text-xs text-muted-foreground/50">
                  Select a tab to compare
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ResponsePanel({
  label, response, lang, body, fontSize,
}: {
  label: string
  response: FlamingoResponse
  lang: string
  body: string
  fontSize: number
}) {
  const statusColor = response.statusCode === 0 ? 'destructive' :
    response.statusCode < 300 ? 'success' :
    response.statusCode < 500 ? 'warning' : 'destructive'

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border shrink-0">
        <span className="text-xs font-medium truncate flex-1">{label}</span>
        <Badge variant={statusColor} className="text-[10px] px-1.5 py-0">{response.statusCode}</Badge>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(response.time)}</span>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatBytes(response.size)}</span>
      </div>
      <div className="flex-1 p-2 min-h-0">
        <div className="h-full rounded-md border border-border overflow-hidden">
          <Editor
            height="100%"
            language={lang}
            value={body}
            theme={document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 8 },
            }}
          />
        </div>
      </div>
    </div>
  )
}
