import type {
  ApiResponse,
  SyncConfig,
  SyncInitResponse,
  SyncTokenResponse,
  SyncDataItem,
  SyncDataType,
} from './types'
import {
  generateMasterKey,
  exportKey,
  importKey,
  encrypt,
  decrypt,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToHex,
  hexToArrayBuffer,
} from './crypto'

const DATA_TYPE_TO_CONFIG_KEY: Record<string, keyof SyncConfig> = {
  history: 'sync_history',
  environment: 'sync_environments',
  secret: 'sync_secrets',
  collection: 'sync_collections',
  setting: 'sync_settings',
}

let _cachedServerUrl = ''

const STORAGE_KEYS = {
  SESSION_TOKEN: 'flamingo-sync-token',
  TOKEN_PREFIX: 'flamingo-sync-prefix',
  MASTER_KEY: 'flamingo-sync-master-key',
  SYNC_CONFIG: 'flamingo-sync-config',
} as const

let _masterKey: CryptoKey | null = null

function getStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function setStored(key: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  } catch { /* storage full or unavailable */ }
}

export async function getMasterKey(): Promise<CryptoKey | null> {
  if (_masterKey) return _masterKey
  const hex = getStored(STORAGE_KEYS.MASTER_KEY)
  if (!hex) return null
  try {
    _masterKey = await importKey(hexToArrayBuffer(hex))
    return _masterKey
  } catch {
    setStored(STORAGE_KEYS.MASTER_KEY, null)
    return null
  }
}

async function setMasterKey(key: CryptoKey) {
  _masterKey = key
  const raw = await exportKey(key)
  setStored(STORAGE_KEYS.MASTER_KEY, arrayBufferToHex(raw))
}

function clearMasterKey() {
  _masterKey = null
  setStored(STORAGE_KEYS.MASTER_KEY, null)
}

async function getServerUrl(): Promise<string> {
  if (_cachedServerUrl) return _cachedServerUrl
  try {
    const res = await fetch('/sync.json')
    const config = await res.json()
    _cachedServerUrl = config.serverUrl || 'https://sync.flamingo-client.com'
    return _cachedServerUrl
  } catch {
    _cachedServerUrl = 'https://sync.flamingo-client.com'
    return _cachedServerUrl
  }
}

function getSessionToken(): string | null {
  return getStored(STORAGE_KEYS.SESSION_TOKEN)
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const serverUrl = await getServerUrl()
  const token = getSessionToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${serverUrl}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }

  return data
}

// ====== Public API ======

export async function initSync(): Promise<SyncInitResponse> {
  const data = await apiFetch<SyncInitResponse>('/api/sync/init', {
    method: 'POST',
    body: JSON.stringify({
      device_name: navigator.platform || 'Unknown Device',
      device_type: 'desktop',
    }),
  })
  return data.data!
}

export async function pollForSession(
  tempToken: string,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<SyncTokenResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const data = await apiFetch<SyncTokenResponse>('/api/sync/token', {
        method: 'POST',
        body: JSON.stringify({ temp_token: tempToken }),
      })
      if (data.data) {
        return data.data
      }
    } catch {
      // Token not yet claimed, continue polling
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Sync authorization timed out')
}

export async function saveSession(response: SyncTokenResponse) {
  setStored(STORAGE_KEYS.SESSION_TOKEN, response.session_token)
  setStored(STORAGE_KEYS.TOKEN_PREFIX, response.token_prefix)
  setStored(STORAGE_KEYS.SYNC_CONFIG, JSON.stringify(response.sync_config))
}

export function clearSession() {
  setStored(STORAGE_KEYS.SESSION_TOKEN, null)
  setStored(STORAGE_KEYS.TOKEN_PREFIX, null)
  setStored(STORAGE_KEYS.SYNC_CONFIG, null)
  clearMasterKey()
}

export function isConnected(): boolean {
  return getSessionToken() !== null
}

export async function getSyncConfig(): Promise<SyncConfig | null> {
  try {
    const stored = getStored(STORAGE_KEYS.SYNC_CONFIG)
    if (stored) {
      return JSON.parse(stored)
    }
    const data = await apiFetch<SyncConfig>('/api/sync/config')
    if (data.data) {
      setStored(STORAGE_KEYS.SYNC_CONFIG, JSON.stringify(data.data))
      return data.data
    }
    return null
  } catch {
    return null
  }
}

export async function updateSyncConfig(config: Partial<SyncConfig>): Promise<void> {
  await apiFetch('/api/sync/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  })
  const stored = getStored(STORAGE_KEYS.SYNC_CONFIG)
  if (stored) {
    const current = JSON.parse(stored)
    setStored(STORAGE_KEYS.SYNC_CONFIG, JSON.stringify({ ...current, ...config }))
  }
}

export async function setupEncryption(): Promise<{ isNew: boolean }> {
  const existing = await fetchMasterKeyPackage()
  if (existing?.master_key) {
    const raw = base64ToArrayBuffer(existing.master_key)
    const key = await importKey(raw)
    await setMasterKey(key)
    return { isNew: false }
  }

  const masterKey = await generateMasterKey()
  const raw = await exportKey(masterKey)
  const base64 = arrayBufferToBase64(raw)

  await apiFetch('/api/sync/key', {
    method: 'PUT',
    body: JSON.stringify({ master_key: base64 }),
  })

  await setMasterKey(masterKey)
  return { isNew: true }
}

export async function uploadData(
  dataType: SyncDataType,
  plaintext: string
): Promise<void> {
  const config = await getSyncConfig()
  const configKey = DATA_TYPE_TO_CONFIG_KEY[dataType]
  if (config && configKey && !config[configKey]) return

  const masterKey = await getMasterKey()
  if (!masterKey) throw new Error('Not unlocked')

  const { encrypted, nonce } = await encrypt(plaintext, masterKey)
  await apiFetch(`/api/sync/data/${dataType}`, {
    method: 'PUT',
    body: JSON.stringify({ encrypted_blob: encrypted, nonce }),
  })
}

export async function downloadData(
  dataType: SyncDataType
): Promise<string | null> {
  const masterKey = await getMasterKey()
  if (!masterKey) throw new Error('Not unlocked')

  try {
    const data = await apiFetch<SyncDataItem>(`/api/sync/data/${dataType}`)
    if (!data.data) return null
    return decrypt(data.data.encrypted_blob, masterKey, data.data.nonce)
  } catch (err: any) {
    if (err.message?.includes('404') || err.message?.includes('Not found')) {
      return null
    }
    throw err
  }
}

export async function downloadAllData(): Promise<Record<string, string | null>> {
  const masterKey = await getMasterKey()
  if (!masterKey) throw new Error('Not unlocked')

  const data = await apiFetch<{ items: SyncDataItem[] }>('/api/sync/data')

  const result: Record<string, string | null> = {}
  if (data.data?.items) {
    for (const item of data.data.items) {
      result[item.data_type] = await decrypt(
        item.encrypted_blob,
        masterKey,
        item.nonce
      )
    }
  }
  return result
}

export async function deleteData(dataType: SyncDataType): Promise<void> {
  await apiFetch(`/api/sync/data/${dataType}`, { method: 'DELETE' })
}

export async function rotateToken(): Promise<string> {
  const data = await apiFetch<{ session_token: string }>('/api/sync/rotate', {
    method: 'POST',
  })
  if (data.data) {
    setStored(STORAGE_KEYS.SESSION_TOKEN, data.data.session_token)
  }
  return data.data?.session_token || ''
}

export async function revokeSession(): Promise<void> {
  await apiFetch('/api/sync/revoke', { method: 'POST' })
  clearSession()
}

export async function fetchDevices(): Promise<any[]> {
  const data = await apiFetch<any[]>('/api/devices')
  return data.data || []
}

export async function revokeDevice(deviceId: string): Promise<void> {
  await apiFetch(`/api/devices/${deviceId}`, { method: 'DELETE' })
}

export async function fetchMasterKeyPackage(): Promise<{
  master_key: string
  version: number
} | null> {
  try {
    const data = await apiFetch<any>('/api/sync/key')
    return data.data || null
  } catch {
    return null
  }
}
