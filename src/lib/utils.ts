import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'text-method-get',
    POST: 'text-method-post',
    PUT: 'text-method-put',
    PATCH: 'text-method-patch',
    DELETE: 'text-method-delete',
    OPTIONS: 'text-method-options',
    HEAD: 'text-method-head',
  }
  return colors[method.toUpperCase()] || 'text-muted-foreground'
}

export function detectLanguage(body: string): 'json' | 'xml' | 'plaintext' {
  const trimmed = body.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'
  if (trimmed.startsWith('<')) return 'xml'
  return 'plaintext'
}

export function getMethodBgColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'bg-method-get/10',
    POST: 'bg-method-post/10',
    PUT: 'bg-method-put/10',
    PATCH: 'bg-method-patch/10',
    DELETE: 'bg-method-delete/10',
    OPTIONS: 'bg-method-options/10',
    HEAD: 'bg-method-head/10',
  }
  return colors[method.toUpperCase()] || 'bg-muted'
}
