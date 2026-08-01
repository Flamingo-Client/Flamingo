import Editor from '@monaco-editor/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTabStore } from '@/stores/tab-store'
import type { FlamingoRequest, BodyType } from '@/lib/types'
import { useSettingsStore } from '@/stores/settings-store'
import { useThemeStore } from '@/stores/theme-store'
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
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)

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
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-3 text-[13px] text-muted">This request has no body</p>
          <Select value={request.body.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="mx-auto h-8 w-36 text-xs">
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
      <div className="mb-2.5 flex shrink-0 items-center gap-2.5">
        <Select value={request.body.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="h-8 w-32 text-xs">
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
            className="rounded-xs px-2 py-1 text-[12px] font-medium text-accent transition-colors duration-200 hover:bg-accent/[0.08]"
            title="Format JSON (pretty-print)"
          >
            Format
          </button>
        )}
        {request.body.type === 'json' && (
          <span className="ml-auto text-[11px] text-faint">
            Use <span className="font-mono">{"{{variable}}"}</span> for env values
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-line">
        {(request.body.type === 'json' || request.body.type === 'xml' || request.body.type === 'text') && (
          <Editor
            height="100%"
            language={request.body.type === 'json' ? 'json' : request.body.type === 'xml' ? 'xml' : 'plaintext'}
            value={request.body.content}
            onChange={handleContentChange}
            theme={resolvedTheme === 'dark' ? 'flamingo-dark' : 'flamingo-light'}
            loading={
              <div className="flex h-full items-center justify-center text-xs text-faint">
                <span className="animate-pulse">Loading editor…</span>
              </div>
            }
            options={{
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
        )}

        {request.body.type === 'form-data' && (
          <div className="p-3">
            <KeyValueEditor
              items={request.body.formData || []}
              onChange={(formData) => updateRequest(request.id, { body: { ...request.body, formData } })}
              namePlaceholder="Field name"
              valuePlaceholder="Field value"
            />
          </div>
        )}

        {request.body.type === 'x-www-form-urlencoded' && (
          <div className="p-3">
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
