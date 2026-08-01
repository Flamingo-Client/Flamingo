import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Save, Play, Code2, ChevronDown, Download, Bookmark, Loader2,
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
import { Modal } from '@/components/ui/modal'

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']

export default function RequestBuilder() {
  const { activeTabId, tabs, requests, updateRequest, setTabLoading, setTabResponse, setScriptLogs } = useTabStore()
  const addHistoryEntry = useHistoryStore((s) => s.addEntry)
  const resolveVariables = useEnvironmentStore((s) => s.resolveVariables)

  const [activeSection, setActiveSection] = useState<string>('params')
  const urlInputRef = useRef<HTMLInputElement>(null)
  const updatingFromParams = useRef(false)

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
    if (!request) return
    if (updatingFromParams.current) {
      updatingFromParams.current = false
      updateRequest(request.id, { url })
      return
    }
    const qIndex = url.indexOf('?')
    const parsed = parseCurl(url)
    if (parsed && parsed.url) {
      updateRequest(request.id, {
        method: parsed.method || request.method,
        url: parsed.url || request.url,
        headers: parsed.headers || request.headers,
        body: parsed.body || request.body,
        name: `Request ${parsed.url.slice(0, 30)}`,
      })
      return
    }
    updateRequest(request.id, { url })
    if (qIndex !== -1) {
      const qs = url.slice(qIndex + 1)
      const params = qs.split('&').filter(Boolean).map((pair) => {
        const eqIndex = pair.indexOf('=')
        return eqIndex === -1
          ? { id: generateId(), key: decodeURIComponent(pair), value: '', enabled: true }
          : { id: generateId(), key: decodeURIComponent(pair.slice(0, eqIndex)), value: decodeURIComponent(pair.slice(eqIndex + 1)), enabled: true }
      })
      updateRequest(request.id, { url, params })
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
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-body">No request open</h2>
          <p className="mx-auto mt-1.5 max-w-[240px] text-[13px] leading-relaxed text-muted">
            Open a tab to start composing a request.
          </p>
          <Button size="sm" className="mt-4" onClick={() => useTabStore.getState().createTab()}>
            New tab
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2.5 px-4 pb-1 pt-3.5">
        <Input
          value={request.name === 'New Request' && !request.url ? '' : request.name}
          onChange={(e) => updateRequest(request.id, { name: e.target.value || 'New Request' })}
          placeholder="Untitled request"
          className="h-6 border-0 bg-transparent px-0 text-[15px] font-semibold tracking-[-0.01em] placeholder:font-normal placeholder:text-faint focus:ring-0"
        />
        <div className="flex items-center gap-2">
          <Select value={request.method} onValueChange={handleMethodChange}>
            <SelectTrigger className={`h-9 w-[104px] border-0 text-xs font-bold ${getMethodBgColor(request.method)} ${getMethodColor(request.method)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {methods.map((m) => (
                <SelectItem key={m} value={m}>
                  <span className={`text-xs font-bold ${getMethodColor(m)}`}>{m}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Input
              ref={urlInputRef}
              value={request.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://api.example.com/v1/users"
              className="h-9 pr-8 font-mono text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            {request.url.toLowerCase().startsWith('curl ') && (
              <Code2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-body" />
            )}
          </div>

          <Button
            size="sm"
            className="h-9 px-4"
            onClick={handleSend}
            disabled={activeTab?.isLoading || !request.url}
          >
            {activeTab?.isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            Send
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Save className="h-3.5 w-3.5" />
                Save
                <ChevronDown className="h-3 w-3 text-faint" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              <DropdownMenuItem onClick={handleSave} className="gap-2.5">
                <Bookmark className="h-3.5 w-3.5 text-faint" />
                Save to collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExport} className="gap-2.5">
                <Download className="h-3.5 w-3.5 text-faint" />
                Export as .flamreq
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="flex-1 flex flex-col">
        <div className="px-4 pt-3">
          <TabsList className="h-8">
            <TabsTrigger value="params" className="px-2.5 py-1 text-[12px]">Params</TabsTrigger>
            <TabsTrigger value="headers" className="px-2.5 py-1 text-[12px]">Headers</TabsTrigger>
            <TabsTrigger value="auth" className="px-2.5 py-1 text-[12px]">Auth</TabsTrigger>
            <TabsTrigger value="body" className="px-2.5 py-1 text-[12px]">Body</TabsTrigger>
            <TabsTrigger value="scripts" className="px-2.5 py-1 text-[12px]">Scripts</TabsTrigger>
          </TabsList>
        </div>

        <div className="scrollbar-thin flex-1 overflow-auto p-4 pt-3">
          <TabsContent value="params" className="mt-0">
            <KeyValueEditor
              items={request.params}
              onChange={(params) => {
                const base = request.url.includes('?') ? request.url.slice(0, request.url.indexOf('?')) : request.url
                const enabled = params.filter((p: KeyValuePair) => p.key && p.enabled !== false)
                const qs = enabled.length > 0
                  ? '?' + enabled.map((p: KeyValuePair) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
                  : ''
                updatingFromParams.current = true
                updateRequest(request.id, { params, url: base + qs })
              }}
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

      <Modal
        open={!!savePick}
        onClose={() => setSavePick(null)}
        title="Save to collection"
        className="max-w-sm"
      >
        {savePick && (
          <CollectionPicker
            requestId={savePick.requestId}
            onDone={() => setSavePick(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function AuthEditor({ request }: { request: any }) {
  return (
    <div className="max-w-md space-y-2.5">
      <Select
        value={request.auth.type}
        onValueChange={(type) => useTabStore.getState().updateRequest(request.id, { auth: { ...request.auth, type: type as AuthType } })}
      >
        <SelectTrigger className="h-8 w-44 text-xs">
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
    <div className="flex h-full flex-col gap-4">
      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-faint">Pre-request script</label>
        <textarea
          value={request.scripts?.pre || ''}
          onChange={(e) => updateRequest(request.id, { scripts: { ...request.scripts, pre: e.target.value } })}
          placeholder={`// Runs before request is sent\n// Use console.log() to debug\n// Access: request.method, request.url, etc.`}
          className="h-24 w-full resize-none rounded-sm border border-line-strong bg-surface p-3 font-mono text-xs leading-relaxed outline-none transition-all duration-200 ease-out-expo placeholder:text-faint focus:border-body focus:ring-[3px] focus:ring-accent/[0.08]"
        />
      </div>
      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-faint">Post-response script</label>
        <textarea
          value={request.scripts?.post || ''}
          onChange={(e) => updateRequest(request.id, { scripts: { ...request.scripts, post: e.target.value } })}
          placeholder={`// Runs after response is received\n// Use console.log() to debug\n// Access: request, response (statusCode, body, headers)`}
          className="h-24 w-full resize-none rounded-sm border border-line-strong bg-surface p-3 font-mono text-xs leading-relaxed outline-none transition-all duration-200 ease-out-expo placeholder:text-faint focus:border-body focus:ring-[3px] focus:ring-accent/[0.08]"
        />
      </div>
      {logs.length > 0 && (
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-faint">Output</label>
          <div className="scrollbar-thin max-h-32 w-full space-y-1 overflow-y-auto rounded-sm border border-line bg-surface-sunken p-3 font-mono text-[11px] leading-relaxed">
            {logs.map((log, i) => (
              <div key={i} className={log.type === 'error' ? 'text-bad' : log.type === 'warn' ? 'text-warn' : 'text-body'}>
                <span className="text-faint">[{log.type.toUpperCase()}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
