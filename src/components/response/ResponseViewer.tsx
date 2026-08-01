import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Copy, Download, Search, Code2, FileJson, FileText, Eye, TreePine, List,
  Maximize2, Minimize2, GitCompare,
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTabStore } from '@/stores/tab-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useThemeStore } from '@/stores/theme-store'
import { formatBytes, formatTime, detectLanguage } from '@/lib/utils'
import type { TabView } from '@/lib/types'
import ResponseCompare from './ResponseCompare'

export default function ResponseViewer() {
  const { activeTabId, tabs } = useTabStore()
  const settings = useSettingsStore((s) => s.settings)
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const [activeView, setActiveView] = useState<TabView>('pretty')
  const [searchQuery, setSearchQuery] = useState('')
  const [maximized, setMaximized] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  const activeTab = tabs.find((t) => t.id === activeTabId)
  const response = activeTab?.response

  const detectedLang = useMemo(() => {
    if (!response) return 'plaintext'
    return detectLanguage(response.body)
  }, [response])

  const formattedBody = useMemo(() => {
    if (!response) return ''
    if (detectedLang === 'json') {
      try {
        return JSON.stringify(JSON.parse(response.body), null, settings.tabSize)
      } catch {
        return response.body
      }
    }
    return response.body
  }, [response, detectedLang, settings.tabSize])

  const handleCopy = useCallback(() => {
    if (response) {
      navigator.clipboard.writeText(response.body)
    }
  }, [response])

  const handleDownload = useCallback(() => {
    if (response) {
      const blob = new Blob([response.body], { type: response.contentType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `response.${detectedLang === 'json' ? 'json' : detectedLang === 'xml' ? 'xml' : 'txt'}`
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [response, detectedLang])

  if (!activeTab || !response) {
    return null
  }

  const statusColor = response.statusCode === 0 ? 'destructive' :
    response.statusCode < 300 ? 'success' :
      response.statusCode < 500 ? 'warning' : 'destructive'

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: maximized ? '100%' : '45%', opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex shrink-0 min-w-[320px] flex-col border-l border-line bg-surface"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Badge variant={statusColor}>{response.statusCode || 'ERR'}</Badge>
          <span className="truncate text-[12px] text-body">{response.statusText}</span>
          <span className="text-faint">·</span>
          <span className="text-[12px] tabular-nums text-muted">{formatTime(response.time)}</span>
          <span className="text-faint">·</span>
          <span className="text-[12px] tabular-nums text-muted">{formatBytes(response.size)}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => setCompareOpen(true)} className="text-faint hover:text-body">
                <GitCompare className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Compare responses</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={handleCopy} className="text-faint hover:text-body">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy body</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={handleDownload} className="text-faint hover:text-body">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Download</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => setMaximized(!maximized)} className="text-faint hover:text-body">
                {maximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{maximized ? 'Restore' : 'Maximize'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as TabView)} className="flex flex-1 min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-2.5">
          <TabsList className="h-7">
            <TabsTrigger value="pretty" className="gap-1.5 px-2 py-0.5 text-[11px]">
              <Code2 className="h-3 w-3" /> Pretty
            </TabsTrigger>
            <TabsTrigger value="raw" className="gap-1.5 px-2 py-0.5 text-[11px]">
              <FileText className="h-3 w-3" /> Raw
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5 px-2 py-0.5 text-[11px]">
              <Eye className="h-3 w-3" /> Preview
            </TabsTrigger>
            {detectedLang === 'json' && (
              <TabsTrigger value="tree" className="gap-1.5 px-2 py-0.5 text-[11px]">
                <TreePine className="h-3 w-3" /> Tree
              </TabsTrigger>
            )}
            <TabsTrigger value="headers" className="gap-1.5 px-2 py-0.5 text-[11px]">
              <List className="h-3 w-3" /> Headers
            </TabsTrigger>
          </TabsList>
          <div className="relative w-36 shrink-0">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-faint" />
            <Input
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 rounded-xs border-transparent bg-surface-sunken pl-7 text-[11px]"
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-3 pt-2.5">
          <TabsContent value="pretty" className="mt-0 h-full">
            <div className="h-full rounded-sm border border-line overflow-hidden">
              <Editor
                height="100%"
                language={detectedLang}
                value={formattedBody}
                theme={resolvedTheme === 'dark' ? 'flamingo-dark' : 'flamingo-light'}
                loading={
                  <div className="flex h-full items-center justify-center text-xs text-faint">
                    <span className="animate-pulse">Loading editor…</span>
                  </div>
                }
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: settings.fontSize,
                  fontFamily: "GoogleSansCode",
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  tabSize: settings.tabSize,
                  automaticLayout: true,
                  padding: { top: 8 },
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="raw" className="mt-0 h-full">
            <ScrollArea className="scrollbar-thin h-full rounded-sm border border-line p-3">
              <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-body">
                {response.body}
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="mt-0 h-full">
            <ScrollArea className="scrollbar-thin h-full rounded-sm border border-line">
              {response.contentType.includes('image') ? (
                <img src={`data:${response.contentType};base64,${btoa(response.body)}`} alt="Response preview" className="max-w-full" />
              ) : response.contentType.includes('html') ? (
                <iframe
                  srcDoc={response.body}
                  className="h-full w-full bg-white"
                  title="Preview"
                  sandbox="allow-scripts"
                />
              ) : (
                <pre className="whitespace-pre-wrap break-all p-3 font-mono text-xs leading-relaxed text-body">
                  {response.body}
                </pre>
              )}
            </ScrollArea>
          </TabsContent>

          {detectedLang === 'json' && (
            <TabsContent value="tree" className="mt-0 h-full overflow-hidden">
              <div className="h-full">
                <ScrollArea className="scrollbar-thin h-full rounded-sm border border-line p-3">
                  <JSONTree data={response.body} />
                </ScrollArea>
              </div>
            </TabsContent>
          )}
          <TabsContent value="headers" className="mt-0 h-full">
            <ScrollArea className="scrollbar-thin h-full rounded-sm border border-line px-3 py-1.5">
              <div>
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[1fr_2fr] gap-3 border-b border-line py-1.5 text-xs last:border-0">
                    <span className="truncate font-medium text-muted">{key}</span>
                    <span className="break-all font-mono text-body">{value}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>

      {activeTab && response && (
        <ResponseCompare
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          currentTab={activeTab}
          currentResponse={response}
        />
      )}
    </motion.div>
  )
}

function JSONTree({ data }: { data: string }) {
  let parsed: any
  try {
    parsed = JSON.parse(data)
  } catch {
    return <pre className="text-xs text-muted">{data}</pre>
  }

  return (
    <div className="font-mono text-xs">
      <JSONNode value={parsed} depth={0} />
    </div>
  )
}

function JSONNode({ value, depth }: { value: any; depth: number }) {
  const [expanded, setExpanded] = useState(true)
  const indent = depth * 16

  if (value === null) {
    return <div style={{ paddingLeft: indent }}><span className="text-faint">null</span></div>
  }

  if (typeof value !== 'object') {
    const color = typeof value === 'string' ? 'text-method-get' : typeof value === 'number' ? 'text-method-post' : 'text-method-patch'
    return (
      <div style={{ paddingLeft: indent }}>
        <span className={color}>
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
      </div>
    )
  }

  const isArray = Array.isArray(value)
  const entries = isArray ? value : Object.entries(value)
  const label = isArray ? `Array[${entries.length}]` : `Object{${entries.length}}`

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 rounded-[4px] px-1 py-0.5 text-left transition-colors duration-150 hover:bg-surface-sunken"
        style={{ paddingLeft: indent }}
      >
        <span className="text-[10px] text-faint">{expanded ? '▼' : '▶'}</span>
        <span className="text-[10px] text-muted">{label}</span>
      </button>
      {expanded && (
        <div>
          {isArray
            ? (value as any[]).map((item, i) => (
              <div key={i} className="flex">
                <span className="text-[10px] text-faint" style={{ paddingLeft: indent + 16 }}>{i}: </span>
                <JSONNode value={item} depth={depth + 1} />
              </div>
            ))
            : Object.entries(value).map(([key, val]) => (
              <div key={key} className="flex items-start">
                <span className="shrink-0 text-[10px] font-medium text-body" style={{ paddingLeft: indent + 16 }}>{key}: </span>
                <JSONNode value={val} depth={depth + 1} />
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}
