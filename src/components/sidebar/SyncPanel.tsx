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
    <div className="space-y-4 p-3">
      {/* Status header */}
      <div className="flex items-center gap-2">
        {syncStatus === 'connected' && <Cloud className="h-4 w-4 text-good" />}
        {syncStatus === 'syncing' && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
        {syncStatus === 'error' && <AlertCircle className="h-4 w-4 text-bad" />}
        {(syncStatus === 'disconnected' || syncStatus === 'connecting') && (
          <CloudOff className="h-4 w-4 text-faint" />
        )}
        <span className="text-[13px] font-medium text-body">
          {syncStatus === 'connected' && 'Connected'}
          {syncStatus === 'syncing' && 'Syncing...'}
          {syncStatus === 'connecting' && 'Connecting...'}
          {syncStatus === 'error' && 'Sync Error'}
          {syncStatus === 'disconnected' && 'Not Connected'}
        </span>
      </div>

      {/* Error display */}
      {syncStatus === 'error' && syncError && (
        <div className="rounded-sm border border-bad/25 bg-bad/[0.08] px-3 py-2 text-[12px] text-bad">
          {syncError}
        </div>
      )}

      {/* Last sync */}
      {isReady && (
        <div className="text-[12px] text-muted">
          Last sync: {formatTime(lastSyncAt)}
        </div>
      )}

      <Separator />

      {/* Not connected: show connect */}
      {!isReady && (
        <div className="space-y-2">
          <div className="text-[12px] leading-relaxed text-muted">
            Connect to Flamingo Sync to back up and restore your data across devices.
          </div>
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connectLoading || syncStatus === 'connecting'}
            className="w-full"
          >
            {connectLoading || syncStatus === 'connecting' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
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
              <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">Syncing</div>
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
              className="flex-1"
              onClick={() => syncNow()}
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sync Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="text-bad hover:bg-bad/[0.08] hover:text-bad"
            >
              <Unlink className="h-3.5 w-3.5" />
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
      <span className="text-[12px] text-muted">{label}</span>
      {active ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-good" />
      ) : (
        <span className="text-[11px] text-faint">Off</span>
      )}
    </div>
  )
}
