export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'

export type BodyType = 'none' | 'json' | 'xml' | 'text' | 'form-data' | 'x-www-form-urlencoded' | 'binary'

export type AuthType = 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth2'

export type ThemeMode = 'light' | 'dark' | 'system'

export type TabView = 'pretty' | 'raw' | 'preview' | 'tree'

export interface KeyValuePair {
  id: string
  key: string
  value: string
  enabled: boolean
  description?: string
}

export interface AuthConfig {
  type: AuthType
  basic?: { username: string; password: string }
  bearer?: { token: string }
  apiKey?: { key: string; value: string; in: 'header' | 'query' }
  oauth2?: {
    accessToken: string
    tokenType: string
    grantType: 'authorization_code' | 'client_credentials' | 'password'
  }
}

export interface RequestBody {
  type: BodyType
  content: string
  formData?: KeyValuePair[]
  urlEncoded?: KeyValuePair[]
  binaryFile?: string
}

export interface FlamingoRequest {
  id: string
  name: string
  method: HttpMethod
  url: string
  params: KeyValuePair[]
  headers: KeyValuePair[]
  auth: AuthConfig
  body: RequestBody
  scripts?: {
    pre?: string
    post?: string
  }
  tests?: string
  createdAt: number
  updatedAt: number
}

export interface FlamingoResponse {
  id: string
  requestId: string
  statusCode: number
  statusText: string
  headers: Record<string, string>
  body: string
  contentType: string
  time: number
  size: number
  createdAt: number
}

export interface ScriptLogEntry {
  type: 'log' | 'warn' | 'error' | 'info'
  message: string
  timestamp: number
}

export interface Tab {
  id: string
  requestId: string
  name: string
  pinned: boolean
  response?: FlamingoResponse
  isLoading: boolean
  scriptLogs?: ScriptLogEntry[]
}

export interface Collection {
  id: string
  name: string
  description?: string
  children: (Collection | string)[]
  color?: string
  icon?: string
  createdAt: number
  updatedAt: number
}

export interface HistoryEntry {
  id: string
  requestId: string
  method: HttpMethod
  url: string
  statusCode?: number
  time?: number
  createdAt: number
  requestData?: FlamingoRequest
}

export interface Environment {
  id: string
  name: string
  variables: Record<string, string>
  isActive: boolean
  color?: string
}

export interface Settings {
  theme: ThemeMode
  fontSize: number
  tabSize: number
  autoSave: boolean
  restoreSession: boolean
  timeout: number
  followRedirects: boolean
  maxRedirects: number
  proxy?: string
  sidebarWidth: number
  responseFontSize: 'small' | 'medium' | 'large'
}

export interface CommandPaletteItem {
  id: string
  title: string
  description?: string
  shortcut?: string
  icon?: string
  category: string
  action: () => void
}
