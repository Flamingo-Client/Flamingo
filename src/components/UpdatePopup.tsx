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
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[3px]"
            onClick={() => setDismissed(true)}
          />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          >
            <div
              className="pointer-events-auto w-[340px] overflow-hidden rounded-lg border border-line bg-surface-raised shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <Download className="h-4 w-4 text-body" />
                  <h3 className="text-[14px] font-semibold tracking-[-0.01em]">Update available</h3>
                </div>
                <button
                  className="rounded-xs p-1 text-faint transition-colors duration-200 hover:bg-surface-sunken hover:text-body"
                  onClick={() => setDismissed(true)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2.5 px-4 py-4">
                <div className="flex items-center gap-2 font-mono text-[12px]">
                  <span className="rounded-full border border-line bg-surface-sunken px-2 py-0.5 text-muted">v{__APP_VERSION__}</span>
                  <span className="text-faint">&rarr;</span>
                  <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">v{release.version}</span>
                </div>
                <p className="text-[12px] leading-relaxed text-muted">
                  A newer release of Flamingo is available with the latest features and fixes.
                </p>
              </div>

              <div className="flex items-center gap-2 border-t border-line px-4 py-3">
                <Button size="sm" className="flex-1" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
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
