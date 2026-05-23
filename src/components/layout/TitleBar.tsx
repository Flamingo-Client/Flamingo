import { FlaskConical, Minus, Square, X, Cloud, CloudOff, Loader2, Moon, Laptop, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/stores/theme-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useTabStore } from '@/stores/tab-store'
import { useEnvironmentStore } from '@/stores/environment-store'
import { useSyncStore } from '@/lib/sync/sync-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function TitleBar() {
  const { theme, setTheme } = useThemeStore()
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const environments = useEnvironmentStore((s) => s.environments)
  const setActiveEnvironment = useEnvironmentStore((s) => s.setActiveEnvironment)
  const activeEnv = environments.find((e) => e.isActive)
  const syncStatus = useSyncStore((s) => s.status)
  const syncError = useSyncStore((s) => s.error)

  return (
    <header className="h-10 flex items-center bg-titlebar-bg border-b border-titlebar-border shrink-0 px-2 app-region-drag">
      <div className="flex items-center gap-2 flex-1 min-w-0 app-region-drag">
        <FlaskConical className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">Flamingo</span>
        <span className="text-[10px] text-muted-foreground/50 font-medium">v{__APP_VERSION__}</span>

        <Select
          value={activeEnv?.id || 'global'}
          onValueChange={(v) => setActiveEnvironment(v)}
        >
          <SelectTrigger className="h-6 text-xs w-auto min-w-[100px] border-0 bg-muted/50 hover:bg-muted px-2 app-region-no-drag">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="app-region-no-drag">
            {environments.map((env) => (
              <SelectItem key={env.id} value={env.id}>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: env.color }} />
                  {env.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1 app-region-no-drag">
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs mr-1" title={
          syncStatus === 'connected' ? 'Sync connected' :
          syncStatus === 'syncing' ? 'Syncing...' :
          syncStatus === 'error' ? `Sync error: ${syncError || 'Unknown'}` :
          'Sync disconnected'
        }>
          {syncStatus === 'connected' && <Cloud className="h-4 w-4 text-emerald-500" />}
          {syncStatus === 'syncing' && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
          {syncStatus === 'error' && <CloudOff className="h-4 w-4 text-destructive" />}
          {syncStatus === 'disconnected' && <CloudOff className="h-4 w-4 text-muted-foreground" />}
          {syncStatus === 'connecting' && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
          className="text-muted-foreground"
        >
          {theme === 'dark' ? <Moon className='h-4 w-4'/> : theme === 'light' ? <Sun className='h-4 w-4'/> : <Laptop className='h-4 w-4'/>}
        </Button>
      </div>

      <div className="flex items-center ml-2 app-region-no-drag">
        <Button variant="ghost" size="icon-sm" onClick={() => window.electronAPI?.minimize()} className="text-muted-foreground hover:text-foreground">
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => window.electronAPI?.maximize()} className="text-muted-foreground hover:text-foreground">
          <Square className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => window.electronAPI?.close()} className="text-muted-foreground hover:text-destructive">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  )
}
