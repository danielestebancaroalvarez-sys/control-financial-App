'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { LineItem } from '@/lib/finance/types'

export function LineItemsEditor({
  items,
  onChange,
  currency,
}: {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  currency: string
}) {
  const total = items.reduce((sum, item) => sum + (item.price || 0), 0)

  function updateItem(index: number, field: 'name' | 'price', value: string) {
    const next = items.map((item, i) => {
      if (i !== index) return item
      if (field === 'name') return { ...item, name: value }
      return { ...item, price: parseFloat(value) || 0 }
    })
    onChange(next)
  }

  function addItem() {
    onChange([...items, { name: '', price: 0 }])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="rounded-2xl cc-surface-muted p-4 space-y-2">
      <p className="text-[11px] text-cc-secondary">
        Total por productos: {total.toFixed(2)} {currency}
      </p>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={item.name}
            onChange={e => updateItem(i, 'name', e.target.value)}
            placeholder="Producto"
            className="flex-1 px-3 py-2 rounded-xl cc-surface-solid text-[13px] outline-none text-cc-primary"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={item.price || ''}
            onChange={e => updateItem(i, 'price', e.target.value)}
            placeholder="0.00"
            className="w-20 px-3 py-2 rounded-xl cc-surface-solid text-[13px] outline-none text-cc-primary"
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="text-cc-muted hover:text-red-500"
              aria-label="Quitar producto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1 text-[12px] font-semibold text-[#00BFA5]"
      >
        <Plus className="w-3.5 h-3.5" />
        Añadir producto
      </button>
    </div>
  )
}
