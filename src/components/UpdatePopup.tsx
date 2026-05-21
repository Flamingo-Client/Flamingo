import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReleaseInfo {
  version: string
  downloadUrl: string
}

function parseVersion(tag: string): string {
  return tag.replace(/^v/, '')
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

function getPlatform(): string {
  if (window.electronAPI?.platform) return window.electronAPI.platform
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'win32'
  if (ua.includes('Linux')) return 'linux'
  if (ua.includes('Mac')) return 'darwin'
  return 'unknown'
}

export default function UpdatePopup() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const res = await fetch('https://www.flamingo-client.com/api/releases')
        const data = await res.json()
        const releases = Array.isArray(data) ? data : data.data || []
        const latest = releases[0]
        if (!latest?.tag_name) return

        const latestVer = parseVersion(latest.tag_name)
        const currentVer = parseVersion(__APP_VERSION__)

        if (compareVersions(latestVer, currentVer) <= 0) return

        const platform = getPlatform()
        let downloadUrl = latest.html_url || ''

        if (platform === 'linux' && latest.assets?.length) {
          const linuxAsset = latest.assets.find((a: any) =>
            /\.(AppImage|deb|rpm|tar\.gz|tar\.xz)$/i.test(a.name)
          )
          if (linuxAsset) downloadUrl = linuxAsset.browser_download_url
        }

        if (!cancelled) setRelease({ version: latestVer, downloadUrl })
      } catch {
        // Silently fail
      }
    }

    check()
    return () => { cancelled = true }
  }, [])

  const handleDownload = () => {
    if (!release?.downloadUrl) return
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(release.downloadUrl)
    } else {
      window.open(release.downloadUrl, '_blank')
    }
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {release && !dismissed && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setDismissed(true)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="bg-popover border border-border rounded-xl shadow-2xl w-80 p-4 space-y-3 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">New version available</h3>
                </div>
                <button
                  className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                  onClick={() => setDismissed(true)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <span className="text-foreground">v{__APP_VERSION__}</span>
                  <span className="mx-1.5">&rarr;</span>
                  <span className="text-primary font-semibold">v{release.version}</span>
                </p>
                <p>A new version of Flamingo is available. Download the latest release to get new features and fixes.</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 text-xs gap-1"
                  onClick={handleDownload}
                >
                  <Download className="h-3 w-3" />
                  Download
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setDismissed(true)}
                >
                  Later
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
