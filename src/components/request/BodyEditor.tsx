import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTabStore } from '@/stores/tab-store'
import type { FlamingoRequest, BodyType } from '@/lib/types'
import { useSettingsStore } from '@/stores/settings-store'
import KeyValueEditor from './KeyValueEditor'

interface Props {
  request: FlamingoRequest
}

const bodyTypes: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'text', label: 'Text' },
  { value: 'form-data', label: 'Form Data' },
  { value: 'x-www-form-urlencoded', label: 'URL Encoded' },
]

export default function BodyEditor({ request }: Props) {
  const updateRequest = useTabStore((s) => s.updateRequest)
  const settings = useSettingsStore((s) => s.settings)
  const [editorMounted, setEditorMounted] = useState(false)

  const handleTypeChange = (type: string) => {
    updateRequest(request.id, { body: { ...request.body, type: type as BodyType } })
  }

  const handleContentChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateRequest(request.id, { body: { ...request.body, content: value } })
    }
  }

  const handleFormat = () => {
    if (request.body.type === 'json' && request.body.content) {
      try {
        const formatted = JSON.stringify(JSON.parse(request.body.content), null, settings.tabSize)
        handleContentChange(formatted)
      } catch { }
    }
  }

  if (request.body.type === 'none') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">This request does not have a body</p>
          <Select value={request.body.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-32 h-7 text-xs mx-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bodyTypes.filter((b) => b.value !== 'none').map((b) => (
                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <Select value={request.body.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-28 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {bodyTypes.map((b) => (
              <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {request.body.type === 'json' && (
          <button
            onClick={handleFormat}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
            title="Format JSON (pretty-print)"
          >
            Format
          </button>
        )}
        {request.body.type === 'json' && (
          <span className="text-[9px] text-muted-foreground/30 ml-auto">Use {"{{variable}}"} for env values</span>
        )}
      </div>

      <div className="flex-1 min-h-0 rounded-md border border-border overflow-hidden">
        {(request.body.type === 'json' || request.body.type === 'xml' || request.body.type === 'text') && (
          <Editor
            height="100%"
            language={request.body.type === 'json' ? 'json' : request.body.type === 'xml' ? 'xml' : 'plaintext'}
            value={request.body.content}
            onChange={handleContentChange}
            theme={document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'}
            loading={
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                <span className="animate-pulse">Loading editor...</span>
              </div>
            }
            options={{
              minimap: { enabled: false },
              fontSize: settings.fontSize,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: settings.tabSize,
              automaticLayout: true,
              padding: { top: 8 },
            }}
          />
        )}

        {request.body.type === 'form-data' && (
          <div className="p-2">
            <KeyValueEditor
              items={request.body.formData || []}
              onChange={(formData) => updateRequest(request.id, { body: { ...request.body, formData } })}
              namePlaceholder="Field name"
              valuePlaceholder="Field value"
            />
          </div>
        )}

        {request.body.type === 'x-www-form-urlencoded' && (
          <div className="p-2">
            <KeyValueEditor
              items={request.body.urlEncoded || []}
              onChange={(urlEncoded) => updateRequest(request.id, { body: { ...request.body, urlEncoded } })}
              namePlaceholder="Key"
              valuePlaceholder="Value"
            />
          </div>
        )}
      </div>
    </div>
  )
}
