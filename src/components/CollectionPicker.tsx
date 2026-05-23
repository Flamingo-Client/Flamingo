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
    <div className="space-y-1 max-h-48 overflow-y-auto">
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
            className="flex-1 h-7 text-xs bg-muted/30 border border-border rounded px-1.5 outline-none focus:border-ring"
          />
          <Button size="sm" className="h-7 text-xs" onClick={handleCreate}>Create</Button>
        </div>
      ) : (
        <>
          {collections.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No collections yet.
            </p>
          ) : (
            <div className="space-y-0.5">
              {collections.map((c) => (
                <button
                  key={c.id}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                  onClick={() => { addRequestToCollection(c.id, requestId); onDone() }}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          )}
          <button
            className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 transition-all mt-1"
            onClick={() => setAdding(true)}
          >
            <FolderPlus className="h-3 w-3" />
            New Collection
          </button>
        </>
      )}
    </div>
  )
}
