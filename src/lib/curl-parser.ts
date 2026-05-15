import type { FlamingoRequest, HttpMethod, KeyValuePair } from './types'
import { generateId } from './utils'

export function parseCurl(curlCommand: string): Partial<FlamingoRequest> | null {
  const trimmed = curlCommand.trim()
  if (!trimmed.toLowerCase().startsWith('curl')) return null

  let url = ''
  let method: HttpMethod = 'GET'
  const headers: KeyValuePair[] = []
  const body: { type: 'text'; content: string } = { type: 'text', content: '' }

  const tokens = tokenize(trimmed)

  let i = 1
  while (i < tokens.length) {
    const token = tokens[i]

    if (token === '-X' || token === '--request') {
      i++
      const m = tokens[i]?.toUpperCase()
      if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'].includes(m)) {
        method = m as HttpMethod
      }
    } else if (token === '-H' || token === '--header') {
      i++
      const headerStr = tokens[i]
      if (headerStr) {
        const colonIndex = headerStr.indexOf(':')
        if (colonIndex > 0) {
          headers.push({
            id: generateId(),
            key: headerStr.slice(0, colonIndex).trim(),
            value: headerStr.slice(colonIndex + 1).trim(),
            enabled: true,
          })
        }
      }
    } else if (token === '-d' || token === '--data' || token === '--data-raw') {
      i++
      body.content = tokens[i] || ''
      if (method === 'GET') method = 'POST'
    } else if (token.startsWith('-')) {
      i++
    } else if (!url) {
      url = token
    }

    i++
  }

  const request: Partial<FlamingoRequest> = {
    method,
    url,
    headers: headers.filter((h) => h.key.toLowerCase() !== 'content-type'),
    body: body.content ? body : { type: 'none', content: '' },
  }

  return request
}

function tokenize(cmd: string): string[] {
  const tokens: string[] = []
  let current = ''
  let inSingle = false
  let inDouble = false
  let escape = false

  for (const ch of cmd) {
    if (escape) {
      current += ch
      escape = false
      continue
    }

    if (ch === '\\') {
      escape = true
      continue
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle
      continue
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble
      continue
    }

    if (ch === ' ' && !inSingle && !inDouble) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += ch
  }

  if (current) tokens.push(current)
  return tokens
}
