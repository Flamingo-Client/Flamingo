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
import { useThemeStore } from '@/stores/theme-store'
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
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
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
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-[3px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-[86vh] w-[92vw] flex-col overflow-hidden rounded-lg border border-line bg-surface-raised shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <GitCompare className="h-4 w-4 text-faint" />
                <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Compare responses</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-xs p-1 text-faint transition-colors duration-200 hover:bg-surface-sunken hover:text-body"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2.5 border-b border-line px-4 py-2.5">
              <span className="text-[12px] text-muted">Compare with</span>
              {otherTabs.length === 0 ? (
                <span className="text-[12px] text-faint">No other tabs with responses</span>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7">
                      {otherTab?.name || 'Select a tab'}
                      <ChevronDown className="h-3 w-3 text-faint" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="scrollbar-thin max-h-48 overflow-y-auto">
                    {otherTabs.map((t) => (
                      <DropdownMenuItem key={t.id} onClick={() => setSelectedTabId(t.id)}>
                        {t.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-line">
              <ResponsePanel
                label={currentTab.name}
                response={currentResponse}
                lang={currentLang}
                body={formatBody(currentResponse.body)}
                fontSize={settings.fontSize}
                resolvedTheme={resolvedTheme}
              />
              {otherResponse ? (
                <ResponsePanel
                  label={otherTab!.name}
                  response={otherResponse}
                  lang={otherLang}
                  body={formatBody(otherResponse.body)}
                  fontSize={settings.fontSize}
                  resolvedTheme={resolvedTheme}
                />
              ) : (
                <div className="flex items-center justify-center text-[13px] text-faint">
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
  label, response, lang, body, fontSize, resolvedTheme,
}: {
  label: string
  response: FlamingoResponse
  lang: string
  body: string
  fontSize: number
  resolvedTheme: 'light' | 'dark'
}) {
  const statusColor = response.statusCode === 0 ? 'destructive' :
    response.statusCode < 300 ? 'success' :
    response.statusCode < 500 ? 'warning' : 'destructive'

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
        <span className="flex-1 truncate text-[12px] font-medium">{label}</span>
        <Badge variant={statusColor}>{response.statusCode}</Badge>
        <span className="whitespace-nowrap text-[11px] tabular-nums text-muted">{formatTime(response.time)}</span>
        <span className="whitespace-nowrap text-[11px] tabular-nums text-muted">{formatBytes(response.size)}</span>
      </div>
      <div className="min-h-0 flex-1 p-3">
        <div className="h-full rounded-sm border border-line overflow-hidden">
          <Editor
            height="100%"
            language={lang}
            value={body}
            theme={resolvedTheme === 'dark' ? 'flamingo-dark' : 'flamingo-light'}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize,
              fontFamily: "GoogleSansCode",
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
