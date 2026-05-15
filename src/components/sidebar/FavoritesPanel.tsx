import { motion } from 'framer-motion'
import { Star, Pin, FileText } from 'lucide-react'
import { useTabStore } from '@/stores/tab-store'
import { getMethodColor } from '@/lib/utils'

export default function FavoritesPanel() {
  const { tabs, setActiveTab } = useTabStore()
  const pinnedTabs = tabs.filter((t) => t.pinned)

  if (pinnedTabs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <Star className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground text-center px-4">
          Right-click a tab and select "Pin" to see it here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {pinnedTabs.map((tab) => (
        <motion.button
          key={tab.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
          onClick={() => setActiveTab(tab.id)}
        >
          <Pin className="h-3 w-3 shrink-0 text-primary" />
          <FileText className="h-3 w-3 shrink-0" />
          <span className="truncate flex-1 text-left">{tab.name}</span>
        </motion.button>
      ))}
    </div>
  )
}
