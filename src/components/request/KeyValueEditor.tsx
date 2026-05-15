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
    <div className="space-y-0.5">
      <div className="grid grid-cols-[20px_1fr_1fr_24px] gap-1 items-center text-[10px] text-muted-foreground px-1 pb-1">
        <span />
        <span>{namePlaceholder}</span>
        <span className="flex items-center gap-1">
          {valuePlaceholder}
          <span className="text-[9px] text-muted-foreground/30">{"{{var}}"}</span>
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
            className="grid grid-cols-[20px_1fr_1fr_24px] gap-1 items-center group"
          >
            <div className="flex items-center justify-center">
              <Switch
                checked={item.enabled}
                onCheckedChange={(checked) => updateItem(item.id, { enabled: checked })}
                className="scale-75 data-[state=checked]:bg-primary"
              />
            </div>
            <Input
              value={item.key}
              onChange={(e) => updateItem(item.id, { key: e.target.value })}
              placeholder={namePlaceholder}
              className="h-7 text-xs border-0 bg-muted/30 px-2 rounded"
            />
            <Input
              value={item.value}
              onChange={(e) => updateItem(item.id, { value: e.target.value })}
              placeholder={valuePlaceholder}
              className="h-7 text-xs border-0 bg-muted/30 px-2 rounded font-mono"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeItem(item.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground w-full mt-1" onClick={addItem}>
        <Plus className="h-3 w-3 mr-1" />
        Add
      </Button>
    </div>
  )
}
