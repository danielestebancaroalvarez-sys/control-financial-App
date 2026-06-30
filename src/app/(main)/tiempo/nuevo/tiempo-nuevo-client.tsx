'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Check, Clock, ListTodo, Loader2, Moon, Repeat } from 'lucide-react'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { SleepTracker } from '@/components/time/sleep-tracker'
import { FormField, FormSection } from '@/components/time/form-field'
import { TaskAppearancePicker } from '@/components/time/task-appearance-picker'
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
import {
  TASK_DIFFICULTY_COLORS,
  TASK_DIFFICULTY_LABELS,
  type TaskDifficulty,
  type TimeCategory,
  type TimeFrequency,
  type TaskTemplate,
} from '@/lib/time/types'
import type { CategoryIconId } from '@/lib/finance/category-icons'
import { TASK_COLOR_PRESETS } from '@/lib/time/task-icons'
import type { HouseholdMember } from '@/lib/household/types'
import type { SleepTrackerData } from '@/lib/time/sleep-queries'

type EntryKind = 'time' | 'task' | 'sleep'
type EntryNature = 'fixed' | 'variable'

const inputClass = `w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ring-2 ring-transparent ${TIME_THEME.focus}`

export function TiempoNuevoClient({
  householdId,
  categories,
  members,
  currentUserId,
  initialDate,
  initialUserId,
  sleepData,
  taskTemplates = [],
}: {
  householdId: string
  categories: TimeCategory[]
  members: HouseholdMember[]
  currentUserId: string
  initialDate?: string
  initialUserId?: string
  sleepData: SleepTrackerData
  taskTemplates?: TaskTemplate[]
}) {
  const router = useRouter()
  const [kind, setKind] = useState<EntryKind>('time')
  const [nature, setNature] = useState<EntryNature>('variable')
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [taskDuration, setTaskDuration] = useState('')
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(2)
  const [date, setDate] = useState(initialDate || getTodayString())
  const [anchorDate, setAnchorDate] = useState(getTodayString())
  const [frequency, setFrequency] = useState<TimeFrequency>('weekly')
  const [assignedTo, setAssignedTo] = useState(initialUserId || '')
  const [dueDate, setDueDate] = useState('')
  const [taskColor, setTaskColor] = useState<string>(TASK_COLOR_PRESETS[0])
  const [taskIcon, setTaskIcon] = useState<CategoryIconId>('package')
  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCategory = categories.find(
    c => c.id === (categoryId || categories[0]?.id)
  )

  const durationMinutes = useMemo(() => {
    if (kind === 'task') return parseDurationInput(taskDuration)
    return minutesFromTimeRange(startTime, endTime)
  }, [kind, startTime, endTime, taskDuration])

  const pageTitle =
    kind === 'sleep'
      ? 'Registrar sueño'
      : kind === 'task'
        ? 'Nueva tarea'
        : nature === 'fixed'
          ? 'Nuevo bloque fijo'
          : 'Registrar tiempo'

  const pageHint =
    kind === 'sleep'
      ? 'El sueño real sustituye el bloque fijo programado ese día en el horario y las estadísticas.'
      : kind === 'task'
        ? 'Crea una tarea del hogar y asígnala a alguien de la pareja, o usa una actividad guardada.'
        : nature === 'fixed'
          ? 'Programa una actividad que se repite en tu horario semanal.'
          : 'Registra el tiempo que ya dedicaste a una actividad.'

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId)
    if (!templateId) return
    const template = taskTemplates.find(t => t.id === templateId)
    if (!template) return
    setTitle(template.title)
    setDescription(template.description ?? '')
    setTaskDuration(String(template.estimatedMinutes))
    setDifficulty(template.difficulty)
    setTaskColor(template.color)
    setTaskIcon(template.icon as CategoryIconId)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const catId = categoryId || categories[0]?.id

    if (kind === 'task') {
      const result = await createHouseholdTask({
        householdId,
        title: title.trim() || 'Tarea',
        description: description.trim() || undefined,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null,
        estimatedMinutes: durationMinutes,
        difficulty,
        color: taskColor,
        icon: taskIcon,
        scheduledStart: scheduledStart || null,
        scheduledEnd: scheduledEnd || null,
        templateId: selectedTemplateId || null,
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

    if (!catId) {
      setError('No hay categorías de tiempo.')
      setLoading(false)
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
        <h1 className="text-[20px] font-bold text-cc-primary">{pageTitle}</h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">{pageHint}</p>
      </div>

      <FormSection title="¿Qué vas a registrar?" description="Elige entre tiempo, sueño o una tarea del hogar.">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setKind('time')}
            className={`rounded-2xl border-2 p-3 text-left ${
              kind === 'time' ? TIME_THEME.cardActive : TIME_THEME.cardIdle
            }`}
          >
            <Clock className="w-5 h-5 text-[#6366F1] mb-2" />
            <p className="text-[12px] font-bold text-cc-primary">Tiempo</p>
            <p className="text-[9px] text-cc-secondary leading-tight">Trabajo, hogar…</p>
          </button>
          <button
            type="button"
            onClick={() => setKind('sleep')}
            className={`rounded-2xl border-2 p-3 text-left ${
              kind === 'sleep' ? TIME_THEME.cardActive : TIME_THEME.cardIdle
            }`}
          >
            <Moon className="w-5 h-5 text-[#4F46E5] mb-2" />
            <p className="text-[12px] font-bold text-cc-primary">Sueño</p>
            <p className="text-[9px] text-cc-secondary leading-tight">Dormir / despertar</p>
          </button>
          <button
            type="button"
            onClick={() => setKind('task')}
            className={`rounded-2xl border-2 p-3 text-left ${
              kind === 'task' ? TIME_THEME.cardActive : TIME_THEME.cardIdle
            }`}
          >
            <ListTodo className="w-5 h-5 text-[#6366F1] mb-2" />
            <p className="text-[12px] font-bold text-cc-primary">Tarea</p>
            <p className="text-[9px] text-cc-secondary leading-tight">Reparar, limpiar…</p>
          </button>
        </div>
      </FormSection>

      {kind === 'sleep' && (
        <SleepTracker
          householdId={householdId}
          data={sleepData}
          variant="embedded"
          onActionSuccess={() => {}}
        />
      )}

      {kind === 'time' && (
        <FormSection
          title="Tipo de registro"
          description="Puntual = ya ocurrió. Fijo = aparece en tu horario cada semana."
        >
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setNature('variable')}
              className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left ${nature === 'variable' ? TIME_THEME.cardActive : TIME_THEME.cardIdle}`}
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
              className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left ${nature === 'fixed' ? TIME_THEME.cardActive : TIME_THEME.cardIdle}`}
            >
              <Repeat className="w-5 h-5 text-[#6366F1] shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-cc-primary">Bloque fijo</p>
                <p className="text-[10px] text-cc-secondary">Se repite cada día, semana o mes</p>
              </div>
            </button>
          </div>
        </FormSection>
      )}

      {kind !== 'sleep' && (
      <form onSubmit={handleSubmit} className="cc-surface rounded-[24px] p-4 space-y-4">
        {kind === 'time' && (
          <FormSection title="Categoría" description="Clasifica el tiempo para ver estadísticas por área.">
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
          </FormSection>
        )}

        {kind === 'task' && taskTemplates.length > 0 && (
          <FormField
            label="Usar actividad guardada"
            hint="Rellena título, duración y dificultad desde tu biblioteca."
          >
            <select
              value={selectedTemplateId}
              onChange={e => applyTemplate(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl cc-input text-[13px] outline-none ${TIME_THEME.focus}`}
            >
              <option value="">Escribir manualmente</option>
              {taskTemplates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({formatDuration(t.estimatedMinutes)})
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField
          label={kind === 'task' ? 'Nombre de la tarea' : 'Nombre de la actividad'}
          hint={
            kind === 'task'
              ? 'Ej: Limpiar horno, Pagar luz, Comprar regalo.'
              : 'Ej: Trabajo, Sueño anoche, Clase de yoga.'
          }
          required
        >
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={kind === 'task' ? 'Ej: Lavar el baño' : 'Ej: Trabajo'}
            className={inputClass}
          />
        </FormField>

        {kind === 'task' && (
          <FormField
            label="Detalles"
            hint="Instrucciones, materiales o notas para quien la haga."
          >
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalles opcionales"
              rows={2}
              className={inputClass}
            />
          </FormField>
        )}

        {kind === 'task' ? (
          <FormField
            label="Duración estimada"
            hint="Cuánto tiempo crees que tomará. Ej: 30, 1h, 1h 30m."
          >
            <input
              type="text"
              value={taskDuration}
              onChange={e => setTaskDuration(e.target.value)}
              placeholder="Ej: 1h"
              className={inputClass}
            />
          </FormField>
        ) : (
          <FormSection title="¿Cuándo ocurre?" description="Indica la hora de inicio y fin de la actividad.">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Hora de inicio" hint="Ej: 09:00" required>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Hora de fin" hint="Ej: 17:30" required>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className={inputClass}
                />
              </FormField>
            </div>
            {durationMinutes != null && durationMinutes > 0 && (
              <p className="text-[11px] text-cc-secondary">
                Duración calculada: {formatDuration(durationMinutes)}
              </p>
            )}
          </FormSection>
        )}

        {kind === 'task' && (
          <FormField
            label="Dificultad"
            hint="Ayuda a repartir la carga entre la pareja según el esfuerzo que requiere."
            required
          >
            <div className="flex gap-2">
              {([1, 2, 3] as TaskDifficulty[]).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border-2 transition-all ${
                    difficulty === level
                      ? 'text-white border-transparent'
                      : 'cc-surface-muted text-cc-secondary border-[var(--cc-border)]'
                  }`}
                  style={
                    difficulty === level
                      ? { backgroundColor: TASK_DIFFICULTY_COLORS[level] }
                      : undefined
                  }
                >
                  {TASK_DIFFICULTY_LABELS[level]}
                </button>
              ))}
            </div>
          </FormField>
        )}

        {kind === 'task' && (
          <FormSection
            title="Apariencia"
            description="Personaliza el color e icono para identificarla en la lista y el calendario."
          >
            <TaskAppearancePicker
              color={taskColor}
              icon={taskIcon}
              onColorChange={setTaskColor}
              onIconChange={setTaskIcon}
            />
          </FormSection>
        )}

        {kind === 'time' && nature === 'variable' && (
          <FormField
            label="Fecha"
            hint="El día en que ocurrió esta actividad. No puede ser futura."
            required
          >
            <input
              type="date"
              value={date}
              max={getTodayString()}
              onChange={e => setDate(e.target.value)}
              className={inputClass}
            />
          </FormField>
        )}

        {kind === 'time' && nature === 'fixed' && (
          <FormSection title="¿Se repite?" description="Define desde cuándo y con qué frecuencia aparece en el horario.">
            <FormField
              label="Fecha de inicio"
              hint="El primer día en que empieza esta rutina."
              required
            >
              <input
                type="date"
                value={anchorDate}
                onChange={e => setAnchorDate(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField
              label="Frecuencia de repetición"
              hint="Con qué regularidad se repite en tu calendario."
              required
            >
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as TimeFrequency)}
                className={`w-full px-3 py-2.5 rounded-xl cc-input text-[13px] font-semibold outline-none ${TIME_THEME.focus}`}
              >
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
              </select>
            </FormField>
          </FormSection>
        )}

        {(kind === 'task' || nature === 'fixed') && (
          <FormField
            label={kind === 'task' ? 'Asignar a' : '¿Para quién es?'}
            hint={
              kind === 'task'
                ? 'Quién debe completar esta tarea.'
                : 'De quién es este bloque en el horario semanal.'
            }
          >
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl cc-input text-[13px] outline-none ${TIME_THEME.focus}`}
            >
              <option value="">Sin asignar</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name ?? 'Miembro'}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {kind === 'task' && (
          <FormSection
            title="Horario en calendario"
            description="Opcional. Si indicas hora, la tarea aparece en el horario semanal ese día."
          >
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Hora inicio" hint="Ej: 10:00">
                <input
                  type="time"
                  value={scheduledStart}
                  onChange={e => setScheduledStart(e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Hora fin" hint="Ej: 11:00">
                <input
                  type="time"
                  value={scheduledEnd}
                  onChange={e => setScheduledEnd(e.target.value)}
                  className={inputClass}
                />
              </FormField>
            </div>
          </FormSection>
        )}

        {kind === 'task' && (
          <FormField label="Fecha límite" hint="Opcional. Cuándo debería estar lista y en qué día del calendario aparece.">
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className={inputClass}
            />
          </FormField>
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
      )}
    </div>
  )
}
