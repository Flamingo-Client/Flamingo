import { useEffect } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useThemeStore } from '@/stores/theme-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useTabStore } from '@/stores/tab-store'
import { useUIStore } from '@/stores/ui-store'
import { SyncProvider } from '@/lib/sync/SyncProvider'
import TitleBar from '@/components/layout/TitleBar'
import Sidebar from '@/components/sidebar/Sidebar'
import TabBar from '@/components/workspace/TabBar'
import RequestBuilder from '@/components/request/RequestBuilder'
import ResponseViewer from '@/components/response/ResponseViewer'
import CommandPalette from '@/components/workspace/CommandPalette'
import UpdatePopup from '@/components/UpdatePopup'

export default function App() {
  const { theme, resolvedTheme, setTheme, setResolvedTheme } = useThemeStore()
  const settings = useSettingsStore((s) => s.settings)
  const { tabs, activeTabId, createTab } = useTabStore()
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const update = () => setResolvedTheme(mq.matches ? 'dark' : 'light')
      update()
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    } else {
      setResolvedTheme(theme)
    }
  }, [theme, setResolvedTheme])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  useEffect(() => {
    if (tabs.length === 0 && settings.restoreSession) {
      createTab()
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.metaKey || e.ctrlKey
      if (ctrl && e.key === 't') {
        e.preventDefault()
        createTab()
      }
      if (ctrl && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <TooltipProvider delayDuration={300}>
      <SyncProvider>
        <div className="h-screen flex flex-col overflow-hidden bg-background">
          <TitleBar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
              <TabBar />
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0">
                  <RequestBuilder />
                </div>
                {activeTabId && (
                  <div className="w-px bg-border" />
                )}
                <ResponseViewer />
              </div>
            </main>
          </div>
          <CommandPalette />
          <UpdatePopup />
        </div>
      </SyncProvider>
    </TooltipProvider>
  )
}
