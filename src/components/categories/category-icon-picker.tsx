'use client'

import { CategoryIcon } from '@/components/transactions/category-icon'
import {
  CATEGORY_ICON_OPTIONS,
  type CategoryIconId,
} from '@/lib/finance/category-icons'

export function CategoryIconPicker({
  value,
  onChange,
  accentColor,
}: {
  value: CategoryIconId
  onChange: (icon: CategoryIconId) => void
  accentColor: string
}) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-[#636E72] mb-2">Icono</p>
      <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
        {CATEGORY_ICON_OPTIONS.map(option => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              title={option.label}
              aria-label={option.label}
              aria-pressed={selected}
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors ${
                selected
                  ? 'ring-2 ring-[#2D3436] ring-offset-1'
                  : 'bg-[#F5F5F5] hover:bg-[#EEEEEE]'
              }`}
              style={
                selected
                  ? {
                      backgroundColor: `${accentColor}18`,
                      color: accentColor,
                    }
                  : { color: '#636E72' }
              }
            >
              <CategoryIcon icon={option.id} className="w-4 h-4" />
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-[#B2BEC3] mt-1.5">
        {CATEGORY_ICON_OPTIONS.find(o => o.id === value)?.label ?? 'Etiqueta'}
      </p>
    </div>
  )
}
