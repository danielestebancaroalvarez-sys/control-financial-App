'use client'

import { CategoryIcon } from '@/components/transactions/category-icon'
import { TASK_COLOR_PRESETS, TASK_ICON_OPTIONS } from '@/lib/time/task-icons'
import type { CategoryIconId } from '@/lib/finance/category-icons'

export function TaskAppearancePicker({
  color,
  icon,
  onColorChange,
  onIconChange,
}: {
  color: string
  icon: string
  onColorChange: (color: string) => void
  onIconChange: (icon: CategoryIconId) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[12px] font-bold text-cc-primary mb-2">Color</p>
        <div className="flex flex-wrap gap-2">
          {TASK_COLOR_PRESETS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                color === c ? 'scale-110 border-cc-primary' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[12px] font-bold text-cc-primary mb-2">Icono</p>
        <div className="grid grid-cols-6 gap-2">
          {TASK_ICON_OPTIONS.map(opt => {
            const selected = icon === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onIconChange(opt.id)}
                title={opt.label}
                className={`flex items-center justify-center p-2.5 rounded-xl transition-all ${
                  selected ? '' : 'cc-surface-muted'
                }`}
                style={
                  selected
                    ? {
                        backgroundColor: `${color}22`,
                        color,
                        boxShadow: `inset 0 0 0 2px ${color}`,
                      }
                    : { color: '#94A3B8' }
                }
              >
                <CategoryIcon icon={opt.id} className="w-4 h-4" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
