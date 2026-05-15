import { motion } from 'framer-motion'
import { History, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHistoryStore } from '@/stores/history-store'
import { useTabStore } from '@/stores/tab-store'
import { getMethodColor } from '@/lib/utils'

interface Props {
  searchQuery: string
}

export default function HistoryPanel({ searchQuery }: Props) {
  const { entries, clearHistory, removeEntry } = useHistoryStore()
  const { createTab } = useTabStore()

  const handleClick = (entry: (typeof entries)[0]) => {
    if (entry.requestData) {
      useTabStore.setState((state) => ({
        requests: { ...state.requests, [entry.requestId]: entry.requestData as any },
      }))
    }
    createTab(entry.requestId)
  }

  const filtered = searchQuery
    ? entries.filter((e) => e.url.toLowerCase().includes(searchQuery.toLowerCase()))
    : entries

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <History className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">No history yet</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs text-muted-foreground">Recent</span>
        <Button variant="ghost" size="icon-sm" onClick={clearHistory} className="text-muted-foreground">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {filtered.map((entry) => (
        <motion.button
          key={entry.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-all group"
          onClick={() => handleClick(entry)}
        >
          <span className={`font-mono font-semibold text-[10px] w-10 shrink-0 text-left ${getMethodColor(entry.method)}`}>
            {entry.method}
          </span>
          <span className="truncate flex-1 text-left min-w-0">{entry.url || 'No URL'}</span>
          {entry.statusCode ? (
            <span className={`text-[10px] font-mono shrink-0 tabular-nums ${entry.statusCode < 300 ? 'text-emerald-500' : entry.statusCode < 500 ? 'text-amber-500' : 'text-red-500'}`}>
              {entry.statusCode}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/40 shrink-0">---</span>
          )}
          <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex" onClick={(e) => { e.stopPropagation(); removeEntry(entry.id) }}>
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </span>
        </motion.button>
      ))}
    </div>
  )
}
