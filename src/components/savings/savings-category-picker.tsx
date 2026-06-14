'use client'

import { CategoryIcon } from '@/components/transactions/category-icon'
import {
  SAVINGS_CATEGORY_OPTIONS,
  type SavingsCategoryId,
} from '@/lib/finance/savings-categories'

export function SavingsCategoryPicker({
  value,
  onChange,
}: {
  value: SavingsCategoryId
  onChange: (id: SavingsCategoryId) => void
}) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-[#636E72] mb-2">
        Categoría del ahorro
      </p>
      <div className="grid grid-cols-2 gap-2">
        {SAVINGS_CATEGORY_OPTIONS.map(option => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-colors ${
                selected
                  ? 'ring-2 ring-[#2D3436] ring-offset-1'
                  : 'bg-[#F5F5F5] hover:bg-[#EEEEEE]'
              }`}
              style={
                selected
                  ? { backgroundColor: `${option.color}18` }
                  : undefined
              }
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${option.color}22`,
                  color: option.color,
                }}
              >
                <CategoryIcon icon={option.icon} className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] font-semibold leading-tight ${
                  selected ? 'text-[#2D3436]' : 'text-[#636E72]'
                }`}
              >
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
