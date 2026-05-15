import { useState } from 'react'
import { motion } from 'framer-motion'
import { Beaker, Plus, MoreHorizontal, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEnvironmentStore } from '@/stores/environment-store'

export default function EnvironmentsPanel() {
  const { environments, createEnvironment, deleteEnvironment, setActiveEnvironment, updateVariable, deleteVariable } = useEnvironmentStore()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreate = () => {
    if (newName.trim()) {
      createEnvironment(newName.trim())
      setNewName('')
      setCreating(false)
    }
  }

  return (
    <div className="space-y-1">
      {environments.map((env) => (
        <div key={env.id}>
          <button
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all ${
              env.isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
            onClick={() => setActiveEnvironment(env.id)}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: env.color }} />
            <span className="truncate flex-1 text-left">{env.name}</span>
            <span className="text-[10px] text-muted-foreground/50">{Object.keys(env.variables).length} vars</span>
            {env.id !== 'global' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteEnvironment(env.id) }} className="text-destructive">
                    <Trash2 className="h-3 w-3 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </button>

          {env.isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="ml-4 space-y-0.5 mt-1"
            >
              {Object.entries(env.variables).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1 group">
                  <span className="text-[10px] font-mono text-muted-foreground w-16 truncate">{key}</span>
                  <Input
                    value={value}
                    onChange={(e) => updateVariable(env.id, key, e.target.value)}
                    className="h-6 text-[10px] font-mono flex-1 border-0 bg-muted/50 px-1"
                  />
                  <Button variant="ghost" size="icon-sm" onClick={() => deleteVariable(env.id, key)} className="opacity-0 group-hover:opacity-100">
                    <XIcon className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ))}
              <AddVariableRow envId={env.id} />
            </motion.div>
          )}
        </div>
      ))}

      {environments.length === 0 && !creating && (
        <div className="text-[10px] text-muted-foreground/50 text-center py-4 px-3 leading-relaxed">
          Use <code className="text-foreground/60">{"{{variable}}"}</code> in URLs, headers, and body content. They are replaced with the active environment's values when sending.
        </div>
      )}

      {creating ? (
        <div className="flex items-center gap-1 px-2 py-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Environment name"
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
            autoFocus
          />
          <Button variant="ghost" size="icon-sm" onClick={handleCreate}><Check className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => { setCreating(false); setNewName('') }}><X className="h-3 w-3" /></Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground mt-2" onClick={() => setCreating(true)}>
          <Plus className="h-3 w-3 mr-1" /> New Environment
        </Button>
      )}
    </div>
  )
}

function AddVariableRow({ envId }: { envId: string }) {
  const updateVariable = useEnvironmentStore((s) => s.updateVariable)
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')

  const handleSave = () => {
    if (key) { updateVariable(envId, key, value); setKey(''); setValue('') }
  }

  return (
    <div className="flex items-center gap-1 mt-0.5">
      <Input placeholder="key" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} className="h-6 text-[10px] font-mono flex-1 border-0 bg-muted/30 px-1" />
      <Input placeholder="value" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} className="h-6 text-[10px] font-mono flex-1 border-0 bg-muted/30 px-1" />
    </div>
  )
}

function XIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
}
