import { useState } from 'react'
import {
  Cloud,
  CloudOff,
  Loader2,
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSyncStore } from '@/lib/sync/sync-store'

export default function SyncPanel() {
  const syncStatus = useSyncStore((s) => s.status)
  const syncError = useSyncStore((s) => s.error)
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt)
  const syncConfig = useSyncStore((s) => s.syncConfig)
  const connect = useSyncStore((s) => s.connect)
  const disconnect = useSyncStore((s) => s.disconnect)
  const syncNow = useSyncStore((s) => s.syncNow)

  const [connectLoading, setConnectLoading] = useState(false)

  const isReady = syncStatus === 'connected' || syncStatus === 'syncing'

  const handleConnect = async () => {
    setConnectLoading(true)
    try {
      await connect()
    } catch {
      // handled by store
    } finally {
      setConnectLoading(false)
    }
  }

  const formatTime = (ts: number | null) => {
    if (!ts) return 'Never'
    const diff = Date.now() - ts
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return new Date(ts).toLocaleDateString()
  }

  return (
    <div className="p-3 space-y-4">
      {/* Status header */}
      <div className="flex items-center gap-2">
        {syncStatus === 'connected' && <Cloud className="h-4 w-4 text-emerald-500" />}
        {syncStatus === 'syncing' && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
        {syncStatus === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
        {(syncStatus === 'disconnected' || syncStatus === 'connecting') && (
          <CloudOff className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-xs font-medium">
          {syncStatus === 'connected' && 'Connected'}
          {syncStatus === 'syncing' && 'Syncing...'}
          {syncStatus === 'connecting' && 'Connecting...'}
          {syncStatus === 'error' && 'Sync Error'}
          {syncStatus === 'disconnected' && 'Not Connected'}
        </span>
      </div>

      {/* Error display */}
      {syncStatus === 'error' && syncError && (
        <div className="text-xs text-destructive bg-destructive/10 rounded-md px-2.5 py-2">
          {syncError}
        </div>
      )}

      {/* Last sync */}
      {isReady && (
        <div className="text-xs text-muted-foreground">
          Last sync: {formatTime(lastSyncAt)}
        </div>
      )}

      <Separator />

      {/* Not connected: show connect */}
      {!isReady && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Connect to Flamingo Sync to back up and restore your data across devices.
          </div>
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connectLoading || syncStatus === 'connecting'}
            className="w-full"
          >
            {connectLoading || syncStatus === 'connecting' ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Link2 className="h-3 w-3 mr-1" />
            )}
            Connect
          </Button>
        </div>
      )}

      {/* Connected: show actions */}
      {isReady && (
        <div className="space-y-3">
          {/* Synced data summary */}
          {syncConfig && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-foreground">Syncing</div>
              <div className="space-y-1">
                <SyncRow label="History" active={syncConfig.sync_history} />
                <SyncRow label="Environments" active={syncConfig.sync_environments} />
                <SyncRow label="Collections" active={syncConfig.sync_collections} />
                <SyncRow label="Settings" active={syncConfig.sync_settings} />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => syncNow()}
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Sync Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="text-xs text-destructive hover:text-destructive"
            >
              <Unlink className="h-3 w-3 mr-1" />
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SyncRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {active ? (
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      ) : (
        <span className="text-xs text-muted-foreground">off</span>
      )}
    </div>
  )
}
