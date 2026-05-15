export type SyncStatus = 'disconnected' | 'connecting' | 'syncing' | 'connected' | 'error'

export type SyncDataType = 'history' | 'environment' | 'secret' | 'collection' | 'setting'

export interface SyncConfig {
  sync_history: boolean
  sync_environments: boolean
  sync_secrets: boolean
  sync_collections: boolean
  sync_settings: boolean
}

export interface SyncState {
  status: SyncStatus
  sessionToken: string | null
  tokenPrefix: string | null
  syncConfig: SyncConfig | null
  lastSyncAt: number | null
  error: string | null
  deviceName: string | null
  devices: DeviceInfo[]
}

export interface DeviceInfo {
  id: string
  name: string
  device_type: string
  is_approved: boolean
  is_current: boolean
  last_seen_at: string
}

export interface SyncActions {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  syncNow: () => Promise<void>
  updateConfig: (config: Partial<SyncConfig>) => Promise<void>
  refreshDevices: () => Promise<void>
  revokeDevice: (deviceId: string) => Promise<void>
  rotateToken: () => Promise<void>
}

// Backend API response types

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SyncInitResponse {
  temp_token: string
  login_url: string
  expires_in: number
}

export interface SyncTokenResponse {
  session_token: string
  token_prefix: string
  expires_at: string | null
  is_new_device: boolean
  sync_config: SyncConfig
}

export interface SyncDataItem {
  data_type: string
  encrypted_blob: string
  nonce: string
  version: number
  checksum?: string
  updated_at: string
}

export interface SyncDataUpload {
  data_type: string
  encrypted_blob: string
  nonce: string
  checksum?: string
}
