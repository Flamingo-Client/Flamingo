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
import { formatBytes, formatTime, detectLanguage } from '@/lib/utils'
import type { TabView } from '@/lib/types'
import ResponseCompare from './ResponseCompare'

export default function ResponseViewer() {
  const { activeTabId, tabs } = useTabStore()
  const settings = useSettingsStore((s) => s.settings)
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
      className="border-l border-border bg-background flex flex-col shrink-0 min-w-[300px]"
    >
      <div className="flex items-center gap-2 p-2 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Badge variant={statusColor} className="text-[10px] px-1.5 py-0">
            {response.statusCode || 'ERR'}
          </Badge>
          <span className="text-[11px] text-muted-foreground">{response.statusText}</span>
          <span className="text-[11px] text-muted-foreground/50">·</span>
          <span className="text-[11px] text-muted-foreground">{formatTime(response.time)}</span>
          <span className="text-[11px] text-muted-foreground/50">·</span>
          <span className="text-[11px] text-muted-foreground">{formatBytes(response.size)}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={() => setCompareOpen(true)} className="text-muted-foreground">
                <GitCompare className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Compare with another response</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon-sm" onClick={handleCopy} className="text-muted-foreground">
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleDownload} className="text-muted-foreground">
            <Download className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setMaximized(!maximized)} className="text-muted-foreground">
            {maximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as TabView)} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-2 pt-1 shrink-0">
          <TabsList className="h-6">
            <TabsTrigger value="pretty" className="text-[10px] px-2 py-0.5">
              <Code2 className="h-3 w-3 mr-1" /> Pretty
            </TabsTrigger>
            <TabsTrigger value="raw" className="text-[10px] px-2 py-0.5">
              <FileText className="h-3 w-3 mr-1" /> Raw
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-[10px] px-2 py-0.5">
              <Eye className="h-3 w-3 mr-1" /> Preview
            </TabsTrigger>
            {detectedLang === 'json' && (
              <TabsTrigger value="tree" className="text-[10px] px-2 py-0.5">
                <TreePine className="h-3 w-3 mr-1" /> Tree
              </TabsTrigger>
            )}
            <TabsTrigger value="headers" className="text-[10px] px-2 py-0.5">
              <List className="h-3 w-3 mr-1" /> Headers
            </TabsTrigger>
          </TabsList>
          <div className="relative w-32">
            <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-6 text-[10px] pl-6 border-0 bg-muted/50"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 p-2 pt-1">
          <TabsContent value="pretty" className="mt-0 h-full">
            <div className="h-full rounded-md border border-border overflow-hidden">
              <Editor
                height="100%"
                language={detectedLang}
                value={formattedBody}
                theme={document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'}
                loading={
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    <span className="animate-pulse">Loading editor...</span>
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
            <ScrollArea className="h-full rounded-md border border-border p-3">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground">
                {response.body}
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="mt-0 h-full">
            <ScrollArea className="h-full rounded-md border border-border">
              {response.contentType.includes('image') ? (
                <img src={`data:${response.contentType};base64,${btoa(response.body)}`} alt="Response preview" className="max-w-full" />
              ) : response.contentType.includes('html') ? (
                <iframe
                  srcDoc={response.body}
                  className="w-full h-full bg-white"
                  title="Preview"
                  sandbox="allow-scripts"
                />
              ) : (
                <pre className="text-xs p-3 font-mono whitespace-pre-wrap break-all text-foreground">
                  {response.body}
                </pre>
              )}
            </ScrollArea>
          </TabsContent>

          {detectedLang === 'json' && (
            <TabsContent value="tree" className="mt-0 h-full">
              <ScrollArea className="h-full rounded-md border border-border p-2">
                <JSONTree data={response.body} />
              </ScrollArea>
            </TabsContent>
          )}
          <TabsContent value="headers" className="mt-0 h-full">
            <ScrollArea className="h-full rounded-md border border-border p-2">
              <div className="space-y-0.5">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[1fr_2fr] gap-2 text-xs py-0.5 border-b border-border/50 last:border-0">
                    <span className="font-medium text-muted-foreground truncate">{key}</span>
                    <span className="font-mono text-foreground break-all">{value}</span>
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
    return <pre className="text-xs text-muted-foreground">{data}</pre>
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
    return <div style={{ paddingLeft: indent }}><span className="text-muted-foreground">null</span></div>
  }

  if (typeof value !== 'object') {
    const color = typeof value === 'string' ? 'text-emerald-500' : typeof value === 'number' ? 'text-blue-500' : 'text-purple-500'
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
        className="flex items-center gap-1 hover:bg-accent rounded px-1 py-0.5 w-full text-left"
        style={{ paddingLeft: indent }}
      >
        <span className="text-muted-foreground text-[10px]">{expanded ? '▼' : '▶'}</span>
        <span className="text-muted-foreground text-[10px]">{label}</span>
      </button>
      {expanded && (
        <div>
          {isArray
            ? (value as any[]).map((item, i) => (
                <div key={i} className="flex">
                  <span className="text-muted-foreground/50 text-[10px]" style={{ paddingLeft: indent + 16 }}>{i}: </span>
                  <JSONNode value={item} depth={depth + 1} />
                </div>
              ))
            : Object.entries(value).map(([key, val]) => (
                <div key={key} className="flex items-start">
                  <span className="text-cyan-500 text-[10px] shrink-0" style={{ paddingLeft: indent + 16 }}>{key}: </span>
                  <JSONNode value={val} depth={depth + 1} />
                </div>
              ))
          }
        </div>
      )}
    </div>
  )
}
