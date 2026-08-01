import { useState } from 'react'
import { Folder, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCollectionStore } from '@/stores/collection-store'

export default function CollectionPicker({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const collections = useCollectionStore((s) => s.collections)
  const addRequestToCollection = useCollectionStore((s) => s.addRequestToCollection)
  const createCollection = useCollectionStore((s) => s.createCollection)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    const id = createCollection(name)
    addRequestToCollection(id, requestId)
    setNewName('')
    onDone()
  }

  return (
    <div className="scrollbar-thin max-h-56 space-y-1 overflow-y-auto">
      {adding ? (
        <div className="flex items-center gap-1 p-1">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') { setAdding(false); setNewName('') }
            }}
            placeholder="Collection name..."
            className="h-8 flex-1 rounded-sm border border-line-strong bg-surface px-2.5 text-[12px] outline-none transition-colors focus:border-body"
          />
          <Button size="sm" className="h-8" onClick={handleCreate}>Create</Button>
        </div>
      ) : (
        <>
          {collections.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted">
              No collections yet.
            </p>
          ) : (
            <div className="space-y-0.5">
              {collections.map((c) => (
                <button
                  key={c.id}
                  className="flex w-full items-center gap-2.5 rounded-xs px-2.5 py-2 text-[13px] text-body transition-colors duration-200 hover:bg-surface-sunken"
                  onClick={() => { addRequestToCollection(c.id, requestId); onDone() }}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0 text-faint" />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          )}
          <button
            className="mt-1 flex w-full items-center gap-2.5 rounded-xs px-2.5 py-2 text-[13px] text-muted transition-colors duration-200 hover:bg-surface-sunken hover:text-body"
            onClick={() => setAdding(true)}
          >
            <FolderPlus className="h-3.5 w-3.5" />
            New collection
          </button>
        </>
      )}
    </div>
  )
}
