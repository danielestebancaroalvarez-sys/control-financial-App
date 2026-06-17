'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Check, Clock, ListTodo, Loader2, Repeat } from 'lucide-react'
import { CategoryIcon } from '@/components/transactions/category-icon'
import {
  createHouseholdTask,
  createTimeBlock,
  createTimeEntry,
} from '@/lib/time/actions'
import { TIME_THEME } from '@/lib/time/theme'
import {
  formatDuration,
  getTodayString,
  minutesFromTimeRange,
  parseDurationInput,
} from '@/lib/time/format'
import type { TimeCategory, TimeFrequency } from '@/lib/time/types'
import type { HouseholdMember } from '@/lib/household/types'

type EntryKind = 'time' | 'task'
type EntryNature = 'fixed' | 'variable'

export function TiempoNuevoClient({
  householdId,
  categories,
  members,
  currentUserId,
  initialDate,
  initialUserId,
}: {
  householdId: string
  categories: TimeCategory[]
  members: HouseholdMember[]
  currentUserId: string
  initialDate?: string
  initialUserId?: string
}) {
  const router = useRouter()
  const [kind, setKind] = useState<EntryKind>('time')
  const [nature, setNature] = useState<EntryNature>('variable')
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [taskDuration, setTaskDuration] = useState('')
  const [date, setDate] = useState(initialDate || getTodayString())
  const [anchorDate, setAnchorDate] = useState(getTodayString())
  const [frequency, setFrequency] = useState<TimeFrequency>('weekly')
  const [assignedTo, setAssignedTo] = useState(initialUserId || '')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCategory = categories.find(
    c => c.id === (categoryId || categories[0]?.id)
  )

  const durationMinutes = useMemo(() => {
    if (kind === 'task') return parseDurationInput(taskDuration)
    return minutesFromTimeRange(startTime, endTime)
  }, [kind, startTime, endTime, taskDuration])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const catId = categoryId || categories[0]?.id
    if (!catId) {
      setError('No hay categorías de tiempo.')
      setLoading(false)
      return
    }

    if (kind === 'task') {
      const result = await createHouseholdTask({
        householdId,
        title: title.trim() || 'Tarea',
        description: description.trim() || undefined,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null,
        estimatedMinutes: durationMinutes,
      })
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      setLoading(false)
      router.push('/tiempo/tareas')
      router.refresh()
      return
    }

    if (!durationMinutes || durationMinutes <= 0) {
      setError('La hora de fin debe ser posterior a la de inicio.')
      setLoading(false)
      return
    }

    if (nature === 'fixed') {
      const result = await createTimeBlock({
        householdId,
        categoryId: catId,
        title: title.trim() || selectedCategory?.name || 'Bloque fijo',
        assignedTo: assignedTo || currentUserId,
        frequency,
        anchorDate,
        durationMinutes,
        startTime,
        endTime,
      })
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      setLoading(false)
      router.push('/tiempo/horario')
      router.refresh()
      return
    }

    const result = await createTimeEntry({
      householdId,
      categoryId: catId,
      title: title.trim() || selectedCategory?.name || 'Registro',
      entryDate: date,
      durationMinutes,
      startTime,
      endTime,
    })
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setLoading(false)
    router.push('/tiempo')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold text-cc-primary">Nuevo registro</h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">
          Bloques de tiempo, tareas del hogar o programación fija.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setKind('time')}
          className={`rounded-2xl border-2 p-4 text-left ${kind === 'time' ? TIME_THEME.cardActive : 'cc-surface-muted border-[var(--cc-border)]'}`}
        >
          <Clock className="w-5 h-5 text-[#6366F1] mb-2" />
          <p className="text-[13px] font-bold text-cc-primary">Tiempo</p>
          <p className="text-[10px] text-cc-secondary">Trabajo, sueño, hogar…</p>
        </button>
        <button
          type="button"
          onClick={() => setKind('task')}
          className={`rounded-2xl border-2 p-4 text-left ${kind === 'task' ? TIME_THEME.cardActive : 'cc-surface-muted border-[var(--cc-border)]'}`}
        >
          <ListTodo className="w-5 h-5 text-[#6366F1] mb-2" />
          <p className="text-[13px] font-bold text-cc-primary">Tarea</p>
          <p className="text-[10px] text-cc-secondary">Reparar, limpiar, comprar…</p>
        </button>
      </div>

      {kind === 'time' && (
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => setNature('variable')}
            className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left ${nature === 'variable' ? TIME_THEME.cardActive : 'cc-surface-muted border-[var(--cc-border)]'}`}
          >
            <CalendarClock className="w-5 h-5 text-[#6366F1] shrink-0" />
            <div>
              <p className="text-[12px] font-bold text-cc-primary">Registro puntual</p>
              <p className="text-[10px] text-cc-secondary">Lo que ya ocurrió hoy o antes</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setNature('fixed')}
            className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left ${nature === 'fixed' ? TIME_THEME.cardActive : 'cc-surface-muted border-[var(--cc-border)]'}`}
          >
            <Repeat className="w-5 h-5 text-[#6366F1] shrink-0" />
            <div>
              <p className="text-[12px] font-bold text-cc-primary">Bloque fijo</p>
              <p className="text-[10px] text-cc-secondary">Se repite cada día, semana o mes</p>
            </div>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="cc-surface rounded-[24px] p-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {categories.map(cat => {
            const active = (categoryId || categories[0]?.id) === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`shrink-0 flex flex-col items-center gap-1.5 w-[4.5rem] py-3 rounded-2xl transition-all ${
                  active
                    ? 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-md'
                    : 'cc-surface-muted text-cc-secondary'
                }`}
              >
                <CategoryIcon icon={cat.icon} className="w-5 h-5" />
                <span className="text-[9px] font-semibold text-center leading-tight px-1">
                  {cat.name}
                </span>
              </button>
            )
          })}
        </div>

        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={kind === 'task' ? 'Ej: Lavar el baño' : 'Ej: Trabajo, Sueño anoche…'}
          className={`w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ring-2 ring-transparent ${TIME_THEME.focus}`}
        />

        {kind === 'task' && (
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detalles opcionales"
            rows={2}
            className={`w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ring-2 ring-transparent ${TIME_THEME.focus}`}
          />
        )}

        {kind === 'task' ? (
          <div>
            <label className="text-[11px] font-semibold text-cc-secondary">
              Duración estimada (8h, 90, 1h 30m)
            </label>
            <input
              type="text"
              value={taskDuration}
              onChange={e => setTaskDuration(e.target.value)}
              placeholder="Ej: 1h"
              className={`mt-1 w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ring-2 ring-transparent ${TIME_THEME.focus}`}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-cc-secondary">Hora inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className={`mt-1 w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ${TIME_THEME.focus}`}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-cc-secondary">Hora fin</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className={`mt-1 w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ${TIME_THEME.focus}`}
              />
            </div>
            {durationMinutes != null && durationMinutes > 0 && (
              <p className="col-span-2 text-[11px] text-cc-secondary">
                Duración: {formatDuration(durationMinutes)}
              </p>
            )}
          </div>
        )}

        {kind === 'time' && nature === 'variable' && (
          <div>
            <label className="text-[11px] font-semibold text-cc-secondary">Fecha</label>
            <input
              type="date"
              value={date}
              max={getTodayString()}
              onChange={e => setDate(e.target.value)}
              className={`mt-1 w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ${TIME_THEME.focus}`}
            />
          </div>
        )}

        {kind === 'time' && nature === 'fixed' && (
          <>
            <div>
              <label className="text-[11px] font-semibold text-cc-secondary">
                Fecha ancla / inicio
              </label>
              <input
                type="date"
                value={anchorDate}
                onChange={e => setAnchorDate(e.target.value)}
                className={`mt-1 w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ${TIME_THEME.focus}`}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-cc-secondary">Frecuencia</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as TimeFrequency)}
                className={`mt-1 w-full px-3 py-2.5 rounded-xl cc-input text-[13px] font-semibold outline-none ${TIME_THEME.focus}`}
              >
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
          </>
        )}

        {(kind === 'task' || nature === 'fixed') && (
          <div>
            <label className="text-[11px] font-semibold text-cc-secondary">
              {kind === 'task' ? 'Asignar a' : 'Persona'}
            </label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className={`mt-1 w-full px-3 py-2.5 rounded-xl cc-input text-[13px] outline-none ${TIME_THEME.focus}`}
            >
              <option value="">Sin asignar</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name ?? 'Miembro'}
                </option>
              ))}
            </select>
          </div>
        )}

        {kind === 'task' && (
          <div>
            <label className="text-[11px] font-semibold text-cc-secondary">Fecha límite</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className={`mt-1 w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ${TIME_THEME.focus}`}
            />
          </div>
        )}

        {error && <p className="text-[12px] text-red-600 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 rounded-2xl text-white text-[14px] font-bold disabled:opacity-60 flex items-center justify-center gap-2 ${TIME_THEME.submit}`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              Guardar
            </>
          )}
        </button>
      </form>
    </div>
  )
}
