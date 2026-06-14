'use client'

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { ParsedReceipt, ParsedReceiptItem } from '@/lib/receipts/types'

export function ReceiptReviewSheet({
  receipt,
  previewUrl,
  onApply,
  onClose,
}: {
  receipt: ParsedReceipt
  previewUrl: string | null
  onApply: (receipt: ParsedReceipt) => void
  onClose: () => void
}) {
  const [storeName, setStoreName] = useState(receipt.storeName ?? '')
  const [date, setDate] = useState(receipt.transactionDate ?? '')
  const [items, setItems] = useState<ParsedReceiptItem[]>(
    receipt.items.length > 0 ? receipt.items : [{ name: '', price: 0 }]
  )

  function updateItem(index: number, field: keyof ParsedReceiptItem, value: string) {
    setItems(prev =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value }
          : item
      )
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-[24px] bg-white shadow-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#2D3436]">Revisar recibo</h2>
            <p className="text-[11px] text-[#636E72]">
              Confianza: {receipt.confidence === 'high' ? 'Alta' : receipt.confidence === 'medium' ? 'Media' : 'Baja'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Recibo"
            className="w-full max-h-32 object-contain rounded-xl bg-[#F5F5F5]"
          />
        )}

        {receipt.warnings.length > 0 && (
          <ul className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 space-y-1">
            {receipt.warnings.map(w => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}

        <div>
          <label className="text-[11px] font-semibold text-[#636E72]">Tienda</label>
          <input
            type="text"
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl bg-[#F5F5F5] text-[13px] outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#636E72]">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl bg-[#F5F5F5] text-[13px] outline-none"
          />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-[#636E72]">Productos</p>
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={item.name}
                onChange={e => updateItem(i, 'name', e.target.value)}
                placeholder="Producto"
                className="flex-1 px-3 py-2 rounded-xl bg-[#F5F5F5] text-[13px] outline-none"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={item.price || ''}
                onChange={e => updateItem(i, 'price', e.target.value)}
                placeholder="0"
                className="w-20 px-3 py-2 rounded-xl bg-[#F5F5F5] text-[13px] outline-none"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-[#B2BEC3] hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems(prev => [...prev, { name: '', price: 0 }])}
            className="flex items-center gap-1 text-[12px] font-semibold text-[#00BFA5]"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir producto
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            onApply({
              ...receipt,
              storeName: storeName.trim() || null,
              transactionDate: date || null,
              items: items.filter(i => i.name.trim() && i.price > 0),
            })
          }
          className="w-full py-3 rounded-xl bg-[#00BFA5] text-white font-bold text-[13px]"
        >
          Usar estos datos
        </button>
      </div>
    </div>
  )
}
