import { Minus, Square, X, Cloud, CloudOff, Loader2, Moon, Laptop, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useThemeStore } from '@/stores/theme-store'
import { useEnvironmentStore } from '@/stores/environment-store'
import { useSyncStore } from '@/lib/sync/sync-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function TitleBar() {
  const { theme, setTheme } = useThemeStore()
  const environments = useEnvironmentStore((s) => s.environments)
  const setActiveEnvironment = useEnvironmentStore((s) => s.setActiveEnvironment)
  const activeEnv = environments.find((e) => e.isActive)
  const syncStatus = useSyncStore((s) => s.status)
  const syncError = useSyncStore((s) => s.error)

  const syncLabel =
    syncStatus === 'connected' ? 'Sync connected' :
    syncStatus === 'syncing' ? 'Syncing…' :
    syncStatus === 'connecting' ? 'Connecting…' :
    syncStatus === 'error' ? `Sync error: ${syncError || 'Unknown'}` :
    'Sync disconnected'

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 px-2.5 app-region-drag">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-4 w-[10.5px] shrink-0 bg-accent"
            style={{
              maskImage: 'url(./logo-mark.png)',
              WebkitMaskImage: 'url(./logo-mark.png)',
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
            }}
          />
          <span className="text-[13px] font-semibold tracking-[-0.01em] text-body">Flamingo</span>
          <span className="font-mono text-[10px] text-faint">v{__APP_VERSION__}</span>
        </div>

        <span className="h-4 w-px bg-line" />

        <Select
          value={activeEnv?.id || 'global'}
          onValueChange={(v) => setActiveEnvironment(v)}
        >
          <SelectTrigger className="app-region-no-drag h-7 w-auto min-w-[120px] rounded-full border-line bg-surface px-3 text-[12px] text-muted hover:text-body">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="app-region-no-drag">
            {environments.map((env) => (
              <SelectItem key={env.id} value={env.id}>
                <span className="flex items-center gap-2 text-[12px]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: env.color }} />
                  {env.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="app-region-no-drag flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex h-7 w-7 items-center justify-center">
              {syncStatus === 'connected' && <Cloud className="h-3.5 w-3.5 text-good" />}
              {syncStatus === 'syncing' && <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />}
              {syncStatus === 'error' && <CloudOff className="h-3.5 w-3.5 text-bad" />}
              {syncStatus === 'disconnected' && <CloudOff className="h-3.5 w-3.5 text-faint" />}
              {syncStatus === 'connecting' && <Loader2 className="h-3.5 w-3.5 animate-spin text-faint" />}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">{syncLabel}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            >
              {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : theme === 'light' ? <Sun className="h-3.5 w-3.5" /> : <Laptop className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Theme: {theme}</TooltipContent>
        </Tooltip>
      </div>

      <div className="app-region-no-drag ml-1 flex items-center gap-0.5">
        <Button variant="ghost" size="icon" onClick={() => window.electronAPI?.minimize()}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => window.electronAPI?.maximize()}>
          <Square className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.electronAPI?.close()}
          className="hover:bg-bad hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  )
}
