import { motion } from 'framer-motion'
import { Star, Pin, FileText } from 'lucide-react'
import { useTabStore } from '@/stores/tab-store'
import { getMethodColor } from '@/lib/utils'

export default function FavoritesPanel() {
  const { tabs, setActiveTab } = useTabStore()
  const pinnedTabs = tabs.filter((t) => t.pinned)

  if (pinnedTabs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2.5 px-5 py-10">
        <Star className="h-7 w-7 text-faint/50" />
        <p className="text-center text-[12px] leading-relaxed text-muted">
          Right-click a tab and choose “Pin” to keep it here.
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
          className="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-[12px] text-muted transition-colors duration-200 hover:bg-surface hover:text-body"
          onClick={() => setActiveTab(tab.id)}
        >
          <Pin className="h-3 w-3 shrink-0 text-body" />
          <FileText className="h-3 w-3 shrink-0 text-faint" />
          <span className="flex-1 truncate text-left">{tab.name}</span>
        </motion.button>
      ))}
    </div>
  )
}
