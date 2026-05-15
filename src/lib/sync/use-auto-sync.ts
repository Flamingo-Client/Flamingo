import { useCallback, useRef } from 'react'
import { useSyncStore } from './sync-store'
import { isConnected, uploadData } from './sync-client'
import type { SyncDataType } from './types'

const DEBOUNCE_MS = 2000

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

function debouncedUpload(dataType: SyncDataType, serialized: string) {
  const existing = debounceTimers.get(dataType)
  if (existing) clearTimeout(existing)

  const timer = setTimeout(async () => {
    debounceTimers.delete(dataType)
    if (!isConnected()) return
    try {
      await uploadData(dataType, serialized)
      useSyncStore.getState().syncNow()
    } catch { /* silent fail for auto-sync */ }
  }, DEBOUNCE_MS)

  debounceTimers.set(dataType, timer)
}

export function useAutoSync(dataType: SyncDataType) {
  const connected = useSyncStore((s) => s.status === 'connected')
  const serializedRef = useRef<string | null>(null)

  const sync = useCallback(
    (serialized: string) => {
      serializedRef.current = serialized
      if (!connected) return
      debouncedUpload(dataType, serialized)
    },
    [dataType, connected]
  )

  return sync
}
