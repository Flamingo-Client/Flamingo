import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, GripVertical, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { KeyValuePair } from '@/lib/types'
import { generateId } from '@/lib/utils'

interface Props {
  items: KeyValuePair[]
  onChange: (items: KeyValuePair[]) => void
  namePlaceholder?: string
  valuePlaceholder?: string
}

export default function KeyValueEditor({ items, onChange, namePlaceholder = 'Key', valuePlaceholder = 'Value' }: Props) {
  const addItem = () => {
    onChange([...items, { id: generateId(), key: '', value: '', enabled: true }])
  }

  const updateItem = (id: string, updates: Partial<KeyValuePair>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[28px_1fr_1fr_24px] items-center gap-1.5 px-1 pb-1.5 text-[11px] font-medium tracking-wide text-faint">
        <span />
        <span>{namePlaceholder}</span>
        <span className="flex items-center gap-1.5">
          {valuePlaceholder}
          <span className="font-mono text-[10px] text-faint/60">{"{{var}}"}</span>
        </span>
        <span />
      </div>

      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="group grid grid-cols-[28px_1fr_1fr_24px] items-center gap-1.5"
          >
            <div className="flex items-center justify-center">
              <Switch
                checked={item.enabled}
                onCheckedChange={(checked) => updateItem(item.id, { enabled: checked })}
                className="scale-75"
              />
            </div>
            <Input
              value={item.key}
              onChange={(e) => updateItem(item.id, { key: e.target.value })}
              placeholder={namePlaceholder}
              className="h-8 rounded-xs border-transparent bg-surface-sunken px-2.5 text-xs"
            />
            <Input
              value={item.value}
              onChange={(e) => updateItem(item.id, { value: e.target.value })}
              placeholder={valuePlaceholder}
              className="h-8 rounded-xs border-transparent bg-surface-sunken px-2.5 font-mono text-xs"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeItem(item.id)}
              className="text-faint opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button variant="ghost" size="sm" className="mt-1.5 w-full justify-start px-2 text-[12px]" onClick={addItem}>
        <Plus className="h-3.5 w-3.5" />
        Add row
      </Button>
    </div>
  )
}
