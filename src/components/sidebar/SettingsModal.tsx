import { useState } from 'react'
import { Cloud, Loader2, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Modal } from '@/components/ui/modal'
import { useUIStore } from '@/stores/ui-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useThemeStore } from '@/stores/theme-store'
import { useHistoryStore } from '@/stores/history-store'
import { useSyncStore } from '@/lib/sync/sync-store'

export default function SettingsModal() {
  const { settingsOpen, setSettingsOpen } = useUIStore()
  const { settings, updateSettings } = useSettingsStore()
  const { theme, setTheme } = useThemeStore()
  const clearHistory = useHistoryStore((s) => s.clearHistory)
  const syncStatus = useSyncStore((s) => s.status)
  const syncError = useSyncStore((s) => s.error)
  const syncConfig = useSyncStore((s) => s.syncConfig)
  const connect = useSyncStore((s) => s.connect)
  const disconnect = useSyncStore((s) => s.disconnect)
  const syncNow = useSyncStore((s) => s.syncNow)
  const updateSyncConfig = useSyncStore((s) => s.updateConfig)

  const [connectLoading, setConnectLoading] = useState(false)

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

  return (
    <Modal
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      title="Settings"
      description="Preferences are stored locally and synced when enabled."
      bodyClassName="px-5 py-5"
    >
            <div className="space-y-6">
              <Section label="Sync">
                <div className="space-y-3">
                  {(syncStatus === 'disconnected' || syncStatus === 'error' || syncStatus === 'connecting') && (
                    <div className="space-y-2.5">
                      {syncStatus === 'error' && syncError && (
                        <div className="rounded-sm border border-bad/25 bg-bad/[0.08] px-3 py-2 text-[12px] text-bad">
                          {syncError}
                        </div>
                      )}
                      <Button
                        size="sm"
                        onClick={handleConnect}
                        disabled={connectLoading || syncStatus === 'connecting'}
                        className="w-full"
                      >
                        {connectLoading || syncStatus === 'connecting' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Cloud className="h-3.5 w-3.5" />
                        )}
                        {syncStatus === 'connecting' ? 'Connecting…' : 'Connect'}
                      </Button>
                    </div>
                  )}

                  {(syncStatus === 'connected' || syncStatus === 'syncing') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-sm border border-line bg-surface-sunken px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {syncStatus === 'syncing' ? (
                            <Loader2 className="h-4 w-4 animate-spin text-body" />
                          ) : (
                            <Cloud className="h-4 w-4 text-good" />
                          )}
                          <span className="text-[13px] text-body">
                            {syncStatus === 'syncing' ? 'Syncing…' : 'Connected'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => syncNow()}
                            disabled={syncStatus === 'syncing'}
                            title="Sync now"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={disconnect}
                            className="text-bad hover:bg-bad/[0.08] hover:text-bad"
                            title="Disconnect"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {syncStatus !== 'syncing' && syncError && (
                        <div className="rounded-sm border border-bad/25 bg-bad/[0.08] px-3 py-2 text-[12px] text-bad">
                          {syncError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Section>

              <Separator />

              {(syncStatus === 'connected' || syncStatus === 'syncing') && syncConfig && (
                <>
                  <Section label="Sync categories">
                    <div className="space-y-3">
                      <SyncToggle
                        label="Request History"
                        checked={syncConfig.sync_history}
                        onChange={(v) => updateSyncConfig({ sync_history: v })}
                      />
                      <SyncToggle
                        label="Environments"
                        checked={syncConfig.sync_environments}
                        onChange={(v) => updateSyncConfig({ sync_environments: v })}
                      />
                      <SyncToggle
                        label="Secrets"
                        checked={syncConfig.sync_secrets}
                        onChange={(v) => updateSyncConfig({ sync_secrets: v })}
                      />
                      <SyncToggle
                        label="Collections"
                        checked={syncConfig.sync_collections}
                        onChange={(v) => updateSyncConfig({ sync_collections: v })}
                      />
                      <SyncToggle
                        label="Settings"
                        checked={syncConfig.sync_settings}
                        onChange={(v) => updateSyncConfig({ sync_settings: v })}
                      />
                    </div>
                  </Section>
                  <Separator />
                </>
              )}

              <Section label="Theme">
                <div className="flex gap-1.5">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      className={`flex-1 rounded-sm border px-2 py-2 text-[12px] font-medium transition-all duration-200 ease-out-expo ${
                        theme === t
                          ? 'border-body bg-surface-sunken text-body'
                          : 'border-line text-muted hover:border-line-strong hover:text-body'
                      }`}
                      onClick={() => setTheme(t)}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </Section>

              <Section label="Editor font size" hint={`${settings.fontSize}px`}>
                <input
                  type="range"
                  min="12"
                  max="18"
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                  className="h-1 w-full accent-accent"
                />
              </Section>

              <Section label="Request timeout" hint="milliseconds">
                <Input
                  type="number"
                  value={settings.timeout}
                  onChange={(e) => updateSettings({ timeout: parseInt(e.target.value) || 30000 })}
                  className="h-9 text-xs"
                />
              </Section>

              <Section label="Behavior">
                <div className="space-y-3">
                  <Row label="Auto save">
                    <Switch checked={settings.autoSave} onCheckedChange={(c) => updateSettings({ autoSave: c })} />
                  </Row>
                  <Row label="Restore session">
                    <Switch checked={settings.restoreSession} onCheckedChange={(c) => updateSettings({ restoreSession: c })} />
                  </Row>
                  <Row label="Follow redirects">
                    <Switch checked={settings.followRedirects} onCheckedChange={(c) => updateSettings({ followRedirects: c })} />
                  </Row>
                </div>
              </Section>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-body">Clear history</p>
                  <p className="mt-0.5 text-[12px] text-muted">Removes every stored request from this device.</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm('Clear all history?')) {
                      clearHistory()
                    }
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
    </Modal>
  )
}

function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-medium tracking-wide text-muted">{label}</span>
        {hint && <span className="font-mono text-[11px] text-faint">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-body">{label}</span>
      {children}
    </div>
  )
}

function SyncToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-body">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
