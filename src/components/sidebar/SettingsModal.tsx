import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Cloud, Loader2, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
    <AnimatePresence>
      {settingsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSettingsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-popover border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Settings</h2>
              <Button variant="ghost" size="icon-sm" onClick={() => setSettingsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-5">
              {/* Sync Section */}
              <Section label="Sync">
                <div className="space-y-3">
                  {/* Disconnected/Error state */}
                  {(syncStatus === 'disconnected' || syncStatus === 'error' || syncStatus === 'connecting') && (
                    <div className="space-y-2">
                      {syncStatus === 'error' && syncError && (
                        <div className="text-xs text-destructive bg-destructive/10 rounded-md px-2 py-1.5">
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
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Cloud className="h-3 w-3 mr-1" />
                        )}
                        {syncStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                      </Button>
                    </div>
                  )}

                  {/* Connected state */}
                  {(syncStatus === 'connected' || syncStatus === 'syncing') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {syncStatus === 'syncing' ? (
                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
                          ) : (
                            <Cloud className="h-4 w-4 text-emerald-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {syncStatus === 'syncing' ? 'Syncing...' : 'Connected'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => syncNow()}
                            disabled={syncStatus === 'syncing'}
                            title="Sync Now"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={disconnect}
                            className="text-destructive hover:text-destructive"
                            title="Disconnect"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Error indicator */}
                      {syncStatus !== 'syncing' && syncError && (
                        <div className="text-xs text-destructive bg-destructive/10 rounded-md px-2 py-1.5">
                          {syncError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Section>

              <Separator />

              {/* Sync Config */}
              {(syncStatus === 'connected' || syncStatus === 'syncing') && syncConfig && (
                <>
                  <Section label="Sync Categories">
                    <div className="space-y-2.5">
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

              {/* Theme */}
              <Section label="Theme">
                <div className="flex gap-1">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      className={`flex-1 py-1.5 px-2 text-xs rounded-md transition-all ${
                        theme === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setTheme(t)}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Font Size */}
              <Section label={`Font Size (${settings.fontSize})`}>
                <input
                  type="range"
                  min="12"
                  max="18"
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                  className="w-full h-1 accent-primary"
                />
              </Section>

              {/* Request Timeout */}
              <Section label="Request Timeout (ms)">
                <Input
                  type="number"
                  value={settings.timeout}
                  onChange={(e) => updateSettings({ timeout: parseInt(e.target.value) || 30000 })}
                  className="h-7 text-xs"
                />
              </Section>

              {/* Behavior */}
              <Section label="Behavior">
                <div className="space-y-3">
                  <Row label="Auto Save">
                    <Switch checked={settings.autoSave} onCheckedChange={(c) => updateSettings({ autoSave: c })} />
                  </Row>
                  <Row label="Restore Session">
                    <Switch checked={settings.restoreSession} onCheckedChange={(c) => updateSettings({ restoreSession: c })} />
                  </Row>
                  <Row label="Follow Redirects">
                    <Switch checked={settings.followRedirects} onCheckedChange={(c) => updateSettings({ followRedirects: c })} />
                  </Row>
                </div>
              </Section>

              {/* Clear History */}
              <Separator />
              <div className="pt-1">
                <button
                  className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                  onClick={() => {
                    if (confirm('Clear all history?')) {
                      clearHistory()
                    }
                  }}
                >
                  Clear History
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-foreground">{label}</div>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
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
      <span className="text-xs text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
