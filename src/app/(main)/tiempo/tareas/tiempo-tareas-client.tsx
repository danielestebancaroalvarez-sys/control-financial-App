'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Check,
  CheckSquare,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { CategoryIcon } from '@/components/transactions/category-icon'
import {
  completeHouseholdTask,
  deleteHouseholdTask,
  reopenHouseholdTask,
} from '@/lib/time/actions'
import { formatDuration, formatShortDate } from '@/lib/time/format'
import { TASK_DIFFICULTY_COLORS, TASK_DIFFICULTY_LABELS, type HouseholdTask } from '@/lib/time/types'

type Filter = 'all' | 'mine' | 'pending' | 'done'

export function TiempoTareasClient({
  tasks: initialTasks,
  householdId,
  currentUserId,
}: {
  tasks: HouseholdTask[]
  householdId: string
  currentUserId: string
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState<Filter>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filter === 'mine') return t.assignedTo === currentUserId
      if (filter === 'pending') return t.status === 'pending'
      if (filter === 'done') return t.status === 'done'
      return true
    })
  }, [tasks, filter, currentUserId])

  async function toggleDone(task: HouseholdTask) {
    setLoadingId(task.id)
    const result =
      task.status === 'done'
        ? await reopenHouseholdTask(householdId, task.id)
        : await completeHouseholdTask(householdId, task.id)
    if (!result.error) {
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id
            ? {
                ...t,
                status: task.status === 'done' ? 'pending' : 'done',
                completedAt: task.status === 'done' ? null : new Date().toISOString(),
              }
            : t
        )
      )
      router.refresh()
    }
    setLoadingId(null)
  }

  async function handleDelete(id: string) {
    setLoadingId(id)
    const result = await deleteHouseholdTask(householdId, id)
    if (!result.error) {
      setTasks(prev => prev.filter(t => t.id !== id))
      router.refresh()
    }
    setLoadingId(null)
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'mine', label: 'Mías' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'done', label: 'Hechas' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-cc-primary flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#6366F1]" />
            Tareas del hogar
          </h1>
          <p className="text-[12px] text-cc-secondary mt-0.5">
            Asigna, completa y reparte tareas con tu pareja. Crea nuevas desde el botón central +.
          </p>
        </div>
        <Link
          href="/tiempo/actividades"
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-bold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Actividades
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold ${
              filter === f.id
                ? 'bg-[#6366F1] text-white'
                : 'cc-surface-muted text-cc-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <section className="cc-surface rounded-[24px] p-6 text-center">
          <p className="text-[13px] text-cc-secondary">No hay tareas en este filtro.</p>
          <p className="text-[11px] text-cc-muted mt-2">
            Pulsa + en la barra inferior, elige Tarea y personaliza color e icono.
          </p>
        </section>
      ) : (
        <ul className="space-y-2">
          {filtered.map(task => (
            <li
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-2xl cc-surface-muted border-l-4"
              style={{ borderLeftColor: task.color }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${task.color}22`, color: task.color }}
              >
                <CategoryIcon icon={task.icon} className="w-4 h-4" />
              </div>
              <button
                type="button"
                disabled={loadingId === task.id}
                onClick={() => toggleDone(task)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  task.status === 'done'
                    ? 'bg-[#E8F5E9] text-[#2E7D32]'
                    : 'bg-[#EEF2FF] text-[#6366F1]'
                }`}
                aria-label={task.status === 'done' ? 'Marcar pendiente' : 'Completar'}
              >
                {loadingId === task.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : task.status === 'done' ? (
                  <RotateCcw className="w-4 h-4" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={`text-[13px] font-semibold ${
                      task.status === 'done'
                        ? 'text-cc-muted line-through'
                        : 'text-cc-primary'
                    }`}
                  >
                    {task.title}
                  </p>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white"
                    style={{ backgroundColor: TASK_DIFFICULTY_COLORS[task.difficulty] }}
                  >
                    {TASK_DIFFICULTY_LABELS[task.difficulty]}
                  </span>
                </div>
                <p className="text-[11px] text-cc-secondary">
                  {task.assigneeName
                    ? `Asignada a ${task.assigneeName}`
                    : 'Sin asignar'}
                  {task.estimatedMinutes
                    ? ` · ${formatDuration(task.estimatedMinutes)}`
                    : ''}
                  {task.dueDate ? ` · vence ${formatShortDate(task.dueDate)}` : ''}
                  {task.scheduledStart && task.scheduledEnd
                    ? ` · ${task.scheduledStart}–${task.scheduledEnd}`
                    : ''}
                </p>
                {task.description && (
                  <p className="text-[10px] text-cc-muted mt-0.5">{task.description}</p>
                )}
              </div>
              <button
                type="button"
                disabled={loadingId === task.id}
                onClick={() => handleDelete(task.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-cc-muted hover:text-red-500 shrink-0"
                aria-label="Eliminar tarea"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
