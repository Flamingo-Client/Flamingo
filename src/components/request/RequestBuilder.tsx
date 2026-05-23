import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Save, Play, Code2, ChevronDown, Download, Bookmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useTabStore } from '@/stores/tab-store'
import { useHistoryStore } from '@/stores/history-store'
import { useEnvironmentStore } from '@/stores/environment-store'
import { getMethodColor, getMethodBgColor, generateId } from '@/lib/utils'
import { parseCurl } from '@/lib/curl-parser'
import { runPreRequestScript, runPostResponseScript } from '@/lib/script-runner'
import type { HttpMethod, KeyValuePair, BodyType, AuthType, FlamingoRequest } from '@/lib/types'
import KeyValueEditor from './KeyValueEditor'
import BodyEditor from './BodyEditor'
import CollectionPicker from '@/components/CollectionPicker'

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']

export default function RequestBuilder() {
  const { activeTabId, tabs, requests, updateRequest, setTabLoading, setTabResponse, setScriptLogs } = useTabStore()
  const addHistoryEntry = useHistoryStore((s) => s.addEntry)
  const resolveVariables = useEnvironmentStore((s) => s.resolveVariables)

  const [activeSection, setActiveSection] = useState<string>('params')
  const urlInputRef = useRef<HTMLInputElement>(null)

  const activeTab = tabs.find((t) => t.id === activeTabId)
  const request = activeTab ? requests[activeTab.requestId] : null

  useEffect(() => {
    if (activeTab?.response) {
      setActiveSection('body')
    }
  }, [activeTab?.response?.id])

  const sendRef = useRef<() => void>(() => {})

  const handleMethodChange = useCallback((method: string) => {
    if (request) updateRequest(request.id, { method: method as HttpMethod })
  }, [request, updateRequest])

  const handleUrlChange = useCallback((url: string) => {
    if (request) updateRequest(request.id, { url })
    const parsed = parseCurl(url)
    if (parsed && request) {
      updateRequest(request.id, {
        method: parsed.method || request.method,
        url: parsed.url || request.url,
        headers: parsed.headers || request.headers,
        body: parsed.body || request.body,
        name: parsed.url ? `Request ${parsed.url.slice(0, 30)}` : request.name,
      })
    }
  }, [request, updateRequest])

  const [savePick, setSavePick] = useState<{ requestId: string } | null>(null)

  const handleSave = useCallback(() => {
    if (!request || !activeTabId) return
    setSavePick({ requestId: request.id })
  }, [request, activeTabId])

  const handleExport = useCallback(() => {
    if (!request) return
    const data = JSON.stringify(
      { format: 'flamingo-request', version: 1, request },
      null,
      2
    )
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${request.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.flamreq`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [request])

  const handleSend = useCallback(async () => {
    if (!request || !activeTabId) return

    setTabLoading(activeTabId, true)

    const allLogs: import('@/lib/types').ScriptLogEntry[] = []

    if (request.scripts?.pre?.trim()) {
      const ctx = {
        method: request.method,
        url: request.url,
        headers: request.headers,
        params: request.params,
        body: request.body,
      }
      const result = runPreRequestScript(request.scripts.pre, { request: ctx })
      allLogs.push(...result.logs.map((l) => ({ ...l, timestamp: Date.now() })))
      allLogs.push({ type: 'info' as const, message: `[pre-request] ${result.error ? 'Failed' : 'Completed'}`, timestamp: Date.now() })
    }

    const url = resolveVariables(request.url)
    const headers: Record<string, string> = {}

    request.headers
      .filter((h) => h.enabled && h.key)
      .forEach((h) => { headers[h.key] = resolveVariables(h.value) })

    const params = request.params
      .filter((p) => p.enabled && p.key)
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(resolveVariables(p.value))}`)
      .join('&')

    const fullUrl = params ? `${url}${url.includes('?') ? '&' : '?'}${params}` : url

    const startTime = performance.now()

    try {
      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
      }

      if (request.method !== 'GET' && request.method !== 'HEAD' && request.body.type !== 'none') {
        if (request.body.type === 'json') {
          headers['Content-Type'] = 'application/json'
          fetchOptions.body = request.body.content
        } else if (request.body.type === 'xml') {
          headers['Content-Type'] = 'application/xml'
          fetchOptions.body = request.body.content
        } else if (request.body.type === 'text') {
          headers['Content-Type'] = 'text/plain'
          fetchOptions.body = request.body.content
        } else if (request.body.type === 'x-www-form-urlencoded') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded'
          const formBody = request.body.urlEncoded
            ?.filter((f) => f.enabled && f.key)
            .map((f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(resolveVariables(f.value))}`)
            .join('&')
          fetchOptions.body = formBody
        } else if (request.body.type === 'form-data') {
          const formData = new FormData()
          request.body.formData
            ?.filter((f) => f.enabled && f.key)
            .forEach((f) => formData.append(f.key, resolveVariables(f.value)))
          fetchOptions.body = formData
        }
      }

      if (request.auth.type === 'basic' && request.auth.basic) {
        headers['Authorization'] = 'Basic ' + btoa(`${request.auth.basic.username}:${request.auth.basic.password}`)
      } else if (request.auth.type === 'bearer' && request.auth.bearer) {
        headers['Authorization'] = `Bearer ${request.auth.bearer.token}`
      } else if (request.auth.type === 'api-key' && request.auth.apiKey) {
        if (request.auth.apiKey.in === 'header') {
          headers[request.auth.apiKey.key] = request.auth.apiKey.value
        }
      }

      const response = await fetch(fullUrl, fetchOptions)
      const endTime = performance.now()
      const time = endTime - startTime

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const responseBody = await response.text()

      const responseData = {
        id: crypto.randomUUID(),
        requestId: request.id,
        statusCode: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        contentType: responseHeaders['content-type'] || 'text/plain',
        time,
        size: new Blob([responseBody]).size,
        createdAt: Date.now(),
      }

      setTabResponse(activeTabId, responseData)

      if (request.scripts?.post?.trim()) {
        const postResult = runPostResponseScript(request.scripts.post, {
          request: { method: request.method, url: request.url, headers: request.headers, params: request.params, body: request.body },
          response: {
            statusCode: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseBody,
            contentType: responseHeaders['content-type'] || 'text/plain',
          },
        })
        allLogs.push(...postResult.logs.map((l) => ({ ...l, timestamp: Date.now() })))
        allLogs.push({ type: 'info' as const, message: `[post-response] ${postResult.error ? 'Failed' : 'Completed'}`, timestamp: Date.now() })
      }

      setScriptLogs(activeTabId, allLogs)

      const snapshotId = generateId()
      const snapshot = { ...request, id: snapshotId }
      addHistoryEntry({
        requestId: snapshotId,
        method: request.method,
        url: request.url,
        statusCode: response.status,
        time,
        requestData: snapshot,
      })
    } catch (error: any) {
      const endTime = performance.now()
      setTabResponse(activeTabId, {
        id: crypto.randomUUID(),
        requestId: request.id,
        statusCode: 0,
        statusText: 'Error',
        headers: {},
        body: JSON.stringify({ error: error.message || 'Network error' }, null, 2),
        contentType: 'application/json',
        time: endTime - startTime,
        size: 0,
        createdAt: Date.now(),
      })
    }

    setTabLoading(activeTabId, false)
  }, [request, activeTabId, setTabLoading, setTabResponse, setScriptLogs, addHistoryEntry, resolveVariables])

  sendRef.current = handleSend

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.metaKey || e.ctrlKey
      if (ctrl && e.key === 'Enter') {
        e.preventDefault()
        sendRef.current()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!request) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Open a tab to start</p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => useTabStore.getState().createTab()}>
            New Tab
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 pb-0 space-y-1">
        <Input
          value={request.name === 'New Request' && !request.url ? '' : request.name}
          onChange={(e) => updateRequest(request.id, { name: e.target.value || 'New Request' })}
          placeholder="Request name"
          className="h-6 text-xs font-medium border-0 bg-transparent px-0 placeholder:text-muted-foreground/50 focus-visible:ring-0"
        />
        <div className="flex items-center gap-2">
          <Select value={request.method} onValueChange={handleMethodChange}>
            <SelectTrigger className={`w-24 h-8 text-xs font-bold border-0 ${getMethodBgColor(request.method)} ${getMethodColor(request.method)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {methods.map((m) => (
                <SelectItem key={m} value={m}>
                  <span className={`font-bold text-xs ${getMethodColor(m)}`}>{m}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1 relative">
            <Input
              ref={urlInputRef}
              value={request.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Enter URL or paste cURL command..."
              className="h-8 text-xs font-mono pr-8"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            {request.url.toLowerCase().startsWith('curl ') && (
              <Code2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
            )}
          </div>

          <Button
            size="sm"
            className="h-8 gap-1 text-xs font-medium shadow-sm"
            onClick={handleSend}
            disabled={activeTab?.isLoading || !request.url}
          >
            {activeTab?.isLoading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            Send
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Save className="h-3.5 w-3.5" />
                Save
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem onClick={handleSave} className="gap-2 text-xs">
                <Bookmark className="h-3.5 w-3.5" />
                Save to Collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExport} className="gap-2 text-xs">
                <Download className="h-3.5 w-3.5" />
                Export as .flamreq
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="flex-1 flex flex-col">
        <div className="px-3 pt-2">
          <TabsList className="h-7">
            <TabsTrigger value="params" className="text-xs px-2 py-1">Params</TabsTrigger>
            <TabsTrigger value="headers" className="text-xs px-2 py-1">Headers</TabsTrigger>
            <TabsTrigger value="auth" className="text-xs px-2 py-1">Auth</TabsTrigger>
            <TabsTrigger value="body" className="text-xs px-2 py-1">Body</TabsTrigger>
            <TabsTrigger value="scripts" className="text-xs px-2 py-1">Scripts</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-3 pt-2">
          <TabsContent value="params" className="mt-0">
            <KeyValueEditor
              items={request.params}
              onChange={(params) => updateRequest(request.id, { params })}
              namePlaceholder="Parameter name"
              valuePlaceholder="Parameter value"
            />
          </TabsContent>

          <TabsContent value="headers" className="mt-0">
            <KeyValueEditor
              items={request.headers}
              onChange={(headers) => updateRequest(request.id, { headers })}
              namePlaceholder="Header name"
              valuePlaceholder="Header value"
            />
          </TabsContent>

          <TabsContent value="auth" className="mt-0">
            <AuthEditor request={request} />
          </TabsContent>

          <TabsContent value="body" className="mt-0 h-full">
            <BodyEditor request={request} />
          </TabsContent>

          <TabsContent value="scripts" className="mt-0 h-full">
            <ScriptsEditor request={request} />
          </TabsContent>
        </div>
      </Tabs>

      <AnimatePresence>
        {savePick && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setSavePick(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-popover border border-border rounded-xl shadow-2xl w-72 p-3 space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold">Save to Collection</h3>
              <CollectionPicker
                requestId={savePick.requestId}
                onDone={() => setSavePick(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AuthEditor({ request }: { request: any }) {
  return (
    <div className="space-y-2">
      <Select
        value={request.auth.type}
        onValueChange={(type) => useTabStore.getState().updateRequest(request.id, { auth: { ...request.auth, type: type as AuthType } })}
      >
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Auth</SelectItem>
          <SelectItem value="basic">Basic Auth</SelectItem>
          <SelectItem value="bearer">Bearer Token</SelectItem>
          <SelectItem value="api-key">API Key</SelectItem>
        </SelectContent>
      </Select>

      {request.auth.type === 'basic' && (
        <div className="space-y-2">
          <Input
            placeholder="Username"
            value={request.auth.basic?.username || ''}
            onChange={(e) => useTabStore.getState().updateRequest(request.id, { auth: { ...request.auth, basic: { ...request.auth.basic, username: e.target.value, password: request.auth.basic?.password || '' } } })}
            className="h-8 text-xs"
          />
          <Input
            type="password"
            placeholder="Password"
            value={request.auth.basic?.password || ''}
            onChange={(e) => useTabStore.getState().updateRequest(request.id, { auth: { ...request.auth, basic: { ...request.auth.basic, username: request.auth.basic?.username || '', password: e.target.value } } })}
            className="h-8 text-xs"
          />
        </div>
      )}

      {request.auth.type === 'bearer' && (
        <Input
          placeholder="Token"
          value={request.auth.bearer?.token || ''}
          onChange={(e) => useTabStore.getState().updateRequest(request.id, { auth: { ...request.auth, bearer: { token: e.target.value } } })}
          className="h-8 text-xs"
        />
      )}

      {request.auth.type === 'api-key' && (
        <div className="space-y-2">
          <Input
            placeholder="Key"
            value={request.auth.apiKey?.key || ''}
            onChange={(e) => useTabStore.getState().updateRequest(request.id, { auth: { ...request.auth, apiKey: { ...request.auth.apiKey, key: e.target.value, value: request.auth.apiKey?.value || '', in: 'header' } } })}
            className="h-8 text-xs"
          />
          <Input
            placeholder="Value"
            value={request.auth.apiKey?.value || ''}
            onChange={(e) => useTabStore.getState().updateRequest(request.id, { auth: { ...request.auth, apiKey: { ...request.auth.apiKey, key: request.auth.apiKey?.key || '', value: e.target.value, in: 'header' } } })}
            className="h-8 text-xs"
          />
        </div>
      )}
    </div>
  )
}

function ScriptsEditor({ request }: { request: any }) {
  const updateRequest = useTabStore((s) => s.updateRequest)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const tabs = useTabStore((s) => s.tabs)
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const logs = activeTab?.scriptLogs || []

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pre-request Script</label>
        <textarea
          value={request.scripts?.pre || ''}
          onChange={(e) => updateRequest(request.id, { scripts: { ...request.scripts, pre: e.target.value } })}
          placeholder={`// Runs before request is sent\n// Use console.log() to debug\n// Access: request.method, request.url, etc.`}
          className="w-full h-24 text-xs font-mono bg-muted/30 border border-border rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Post-response Script</label>
        <textarea
          value={request.scripts?.post || ''}
          onChange={(e) => updateRequest(request.id, { scripts: { ...request.scripts, post: e.target.value } })}
          placeholder={`// Runs after response is received\n// Use console.log() to debug\n// Access: request, response (statusCode, body, headers)`}
          className="w-full h-24 text-xs font-mono bg-muted/30 border border-border rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      {logs.length > 0 && (
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Output</label>
          <div className="w-full max-h-32 overflow-y-auto bg-muted/30 border border-border rounded-md p-2 font-mono text-[10px] space-y-0.5">
            {logs.map((log, i) => (
              <div key={i} className={`${log.type === 'error' ? 'text-red-500' : log.type === 'warn' ? 'text-amber-500' : 'text-foreground'}`}>
                <span className="text-muted-foreground/50">[{log.type.toUpperCase()}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
