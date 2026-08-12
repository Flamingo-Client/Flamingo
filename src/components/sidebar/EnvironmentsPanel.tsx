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
            className={`flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-[12px] transition-colors duration-200 ${
              env.isActive ? 'bg-surface text-body shadow-[0_1px_2px_rgb(0_0_0/0.04)]' : 'text-muted hover:bg-surface hover:text-body'
            }`}
            onClick={() => setActiveEnvironment(env.id)}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: env.color }} />
            <span className="truncate flex-1 text-left">{env.name}</span>
            <span className="text-[10px] tabular-nums text-faint">{Object.keys(env.variables).length} vars</span>
            {env.id !== 'global' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteEnvironment(env.id) }} className="gap-2.5 text-bad data-[highlighted]:bg-bad/[0.08]">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
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
                  <span className="w-16 truncate font-mono text-[10px] text-muted">{key}</span>
                  <Input
                    value={value}
                    onChange={(e) => updateVariable(env.id, key, e.target.value)}
                    className="h-7 flex-1 rounded-[5px] border-transparent bg-surface-sunken px-2 font-mono text-[10px]"
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
        <div className="px-3 py-5 text-center text-[11px] leading-relaxed text-muted">
          Use <code className="font-mono text-body">{"{{variable}}"}</code> in URLs, headers and bodies. They resolve against the active environment when sending.
        </div>
      )}

      {creating ? (
        <div className="flex items-center gap-1 px-2 py-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Environment name"
            className="h-8 flex-1 text-[12px]"
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
            autoFocus
          />
          <Button variant="ghost" size="icon-sm" onClick={handleCreate}><Check className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => { setCreating(false); setNewName('') }}><X className="h-3 w-3" /></Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="mt-2 w-full justify-start px-2 text-[12px]" onClick={() => setCreating(true)}>
          <Plus className="h-3.5 w-3.5" /> New environment
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
      <Input placeholder="key" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} className="h-7 flex-1 rounded-[5px] border-transparent bg-surface-sunken px-2 font-mono text-[10px]" />
      <Input placeholder="value" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} className="h-7 flex-1 rounded-[5px] border-transparent bg-surface-sunken px-2 font-mono text-[10px]" />
    </div>
  )
}

function XIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
}
