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
      <div className="flex flex-col items-center gap-2.5 px-4 py-10">
        <History className="h-7 w-7 text-faint/50" />
        <p className="text-[12px] text-muted">No history yet</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between px-2 pb-1 pt-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">Recent</span>
        <Button variant="ghost" size="icon-sm" onClick={clearHistory} className="text-faint hover:text-body">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {filtered.map((entry) => (
        <motion.button
          key={entry.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="group flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-xs px-2 py-1.5 text-xs text-muted transition-colors duration-200 hover:bg-surface hover:text-body"
          onClick={() => handleClick(entry)}
        >
          <span className={`w-10 shrink-0 text-left font-mono text-[10px] font-semibold ${getMethodColor(entry.method)}`}>
            {entry.method}
          </span>

          <span className="min-w-0 flex-1 truncate text-left text-[12px]">
            {entry.url || 'No URL'}
          </span>

          {entry.statusCode ? (
            <span className={`shrink-0 font-mono text-[10px] tabular-nums ${entry.statusCode < 300 ? 'text-good' : entry.statusCode < 500 ? 'text-warn' : 'text-bad'}`}>
              {entry.statusCode}
            </span>
          ) : (
            <span className="shrink-0 text-[10px] text-faint">—</span>
          )}

          <span
            className="flex shrink-0 rounded-[4px] p-0.5 text-faint opacity-0 transition-all duration-150 hover:bg-line hover:text-body group-hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); removeEntry(entry.id) }}
          >
            <X className="h-3 w-3" />
          </span>
        </motion.button>
      ))}
    </div>
  )
}
