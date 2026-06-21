'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { FormField } from '@/components/time/form-field'
import { updateTimeBlock } from '@/lib/time/actions'
import { TIME_THEME } from '@/lib/time/theme'
import { formatTimeFrequency } from '@/lib/time/frequency'
import type { HouseholdMember } from '@/lib/household/types'
import type { TimeBlock, TimeCategory, TimeFrequency } from '@/lib/time/types'

const inputClass = `w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ${TIME_THEME.focus}`

export function EditTimeBlockSheet({
  block,
  categories,
  members,
  householdId,
  onClose,
}: {
  block: TimeBlock
  categories: TimeCategory[]
  members: HouseholdMember[]
  householdId: string
  onClose: () => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState(block.title)
  const [categoryId, setCategoryId] = useState(block.categoryId)
  const [assignedTo, setAssignedTo] = useState(block.assignedTo ?? '')
  const [frequency, setFrequency] = useState<TimeFrequency>(block.frequency)
  const [anchorDate, setAnchorDate] = useState(block.anchorDate)
  const [startTime, setStartTime] = useState(block.startTime?.slice(0, 5) ?? '09:00')
  const [endTime, setEndTime] = useState(block.endTime?.slice(0, 5) ?? '17:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(block.title)
    setCategoryId(block.categoryId)
    setAssignedTo(block.assignedTo ?? '')
    setFrequency(block.frequency)
    setAnchorDate(block.anchorDate)
    setStartTime(block.startTime?.slice(0, 5) ?? '09:00')
    setEndTime(block.endTime?.slice(0, 5) ?? '17:00')
  }, [block])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await updateTimeBlock({
      householdId,
      blockId: block.id,
      categoryId,
      title,
      assignedTo: assignedTo || null,
      frequency,
      anchorDate,
      startTime,
      endTime,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-[24px] cc-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-cc-primary">Editar bloque fijo</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-cc-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <FormField label="Título" required>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField label="Categoría" required>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-[12px] font-semibold ${
                    categoryId === cat.id
                      ? 'ring-2 ring-[#6366F1] bg-[#6366F1]/10'
                      : 'cc-surface-muted'
                  }`}
                >
                  <CategoryIcon icon={cat.icon} className="w-4 h-4 shrink-0" />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Persona">
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className={inputClass}
            >
              <option value="">Sin asignar</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name ?? 'Miembro'}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Frecuencia">
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value as TimeFrequency)}
              className={inputClass}
            >
              {(['daily', 'weekly', 'biweekly', 'monthly'] as TimeFrequency[]).map(f => (
                <option key={f} value={f}>
                  {formatTimeFrequency(f)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Desde (fecha ancla)">
            <input
              type="date"
              value={anchorDate}
              onChange={e => setAnchorDate(e.target.value)}
              className={inputClass}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Inicio">
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Fin">
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>

          {error && <p className="text-[12px] text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white text-[13px] font-bold disabled:opacity-60 ${TIME_THEME.submit}`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando…
              </span>
            ) : (
              'Guardar cambios'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
