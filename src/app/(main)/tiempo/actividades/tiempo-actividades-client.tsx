'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { TaskAppearancePicker } from '@/components/time/task-appearance-picker'
import { TIME_THEME } from '@/lib/time/theme'
import {
  createTaskTemplate,
  deleteTaskTemplate,
  updateTaskTemplate,
} from '@/lib/time/actions'
import { formatDuration, parseDurationInput } from '@/lib/time/format'
import {
  TASK_DIFFICULTY_COLORS,
  TASK_DIFFICULTY_LABELS,
  type TaskDifficulty,
  type TaskTemplate,
} from '@/lib/time/types'
import type { CategoryIconId } from '@/lib/finance/category-icons'
import { TASK_COLOR_PRESETS } from '@/lib/time/task-icons'

type FormState = {
  title: string
  description: string
  duration: string
  difficulty: TaskDifficulty
  color: string
  icon: CategoryIconId
}

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  duration: '30',
  difficulty: 2,
  color: TASK_COLOR_PRESETS[0],
  icon: 'package',
})

const activityTheme = {
  accent: TIME_THEME.accent,
  gradient: `linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)`,
}

export function TiempoActividadesClient({
  householdId,
  initialTemplates,
}: {
  householdId: string
  initialTemplates: TaskTemplate[]
}) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const isEditing = editingId !== null

  const sorted = useMemo(
    () => [...templates].sort((a, b) => a.title.localeCompare(b.title, 'es')),
    [templates]
  )

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
    setError(null)
  }

  function openEdit(template: TaskTemplate) {
    setEditingId(template.id)
    setForm({
      title: template.title,
      description: template.description ?? '',
      duration: String(template.estimatedMinutes),
      difficulty: template.difficulty,
      color: template.color,
      icon: template.icon as CategoryIconId,
    })
    setShowForm(true)
    setError(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    const minutes = parseDurationInput(form.duration)
    if (!form.title.trim()) {
      setError('El título es obligatorio.')
      setLoading(false)
      return
    }
    if (!minutes || minutes <= 0) {
      setError('Indica una duración válida (ej: 30 o 1h).')
      setLoading(false)
      return
    }

    if (isEditing && editingId) {
      const result = await updateTaskTemplate({
        householdId,
        templateId: editingId,
        title: form.title,
        description: form.description,
        estimatedMinutes: minutes,
        difficulty: form.difficulty,
        color: form.color,
        icon: form.icon,
      })
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      setTemplates(prev =>
        prev.map(t =>
          t.id === editingId
            ? {
                ...t,
                title: form.title.trim(),
                description: form.description.trim() || null,
                estimatedMinutes: minutes,
                difficulty: form.difficulty,
                color: form.color,
                icon: form.icon,
              }
            : t
        )
      )
    } else {
      const result = await createTaskTemplate({
        householdId,
        title: form.title,
        description: form.description,
        estimatedMinutes: minutes,
        difficulty: form.difficulty,
        color: form.color,
        icon: form.icon,
      })
      if (result.error || !result.id) {
        setError(result.error ?? 'No se pudo crear la actividad.')
        setLoading(false)
        return
      }
      setTemplates(prev => [
        ...prev,
        {
          id: result.id!,
          title: form.title.trim(),
          description: form.description.trim() || null,
          estimatedMinutes: minutes,
          difficulty: form.difficulty,
          color: form.color,
          icon: form.icon,
          createdBy: '',
          creatorName: null,
        },
      ])
    }

    closeForm()
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    setRemovingId(id)
    const result = await deleteTaskTemplate(householdId, id)
    if (!result.error) {
      setTemplates(prev => prev.filter(t => t.id !== id))
      if (editingId === id) closeForm()
      router.refresh()
    }
    setRemovingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-cc-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: activityTheme.accent }} />
            Actividades guardadas
          </h1>
          <p className="text-[12px] text-cc-secondary mt-0.5">
            Crea una vez y asígnalas a tareas con duración y dificultad ya definidas.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={openCreate}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white text-[13px] font-bold"
        style={{ background: activityTheme.gradient }}
      >
        <Plus className="w-4 h-4" />
        Nueva actividad
      </button>

      {showForm && (
        <section className="cc-surface rounded-[24px] p-4 space-y-3">
          <h2 className="text-[15px] font-bold text-cc-primary">
            {isEditing ? 'Editar actividad' : 'Nueva actividad'}
          </h2>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Ej: Lavar baño"
            className="w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Notas opcionales"
            rows={2}
            className="w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-cc-secondary">
                Duración
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                placeholder="45 o 1h"
                className="mt-1 w-full px-3 py-2.5 rounded-xl cc-input text-[14px] outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-cc-secondary">
                Dificultad
              </label>
              <select
                value={form.difficulty}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    difficulty: Number(e.target.value) as TaskDifficulty,
                  }))
                }
                className="mt-1 w-full px-3 py-2.5 rounded-xl cc-input text-[14px] outline-none"
              >
                {([1, 2, 3] as const).map(d => (
                  <option key={d} value={d}>
                    {TASK_DIFFICULTY_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <TaskAppearancePicker
            color={form.color}
            icon={form.icon}
            onColorChange={color => setForm(f => ({ ...f, color }))}
            onIconChange={icon => setForm(f => ({ ...f, icon }))}
          />
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl text-white text-[13px] font-bold disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: activityTheme.gradient }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-3 rounded-xl cc-surface-muted text-[13px] font-semibold text-cc-secondary"
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      {sorted.length === 0 ? (
        <section className="cc-surface rounded-[24px] p-6 text-center">
          <p className="text-[13px] text-cc-secondary">
            Aún no tienes actividades guardadas. Crea la primera para reutilizarla en tareas.
          </p>
        </section>
      ) : (
        <ul className="space-y-2">
          {sorted.map(template => (
            <li
              key={template.id}
              className="flex items-center gap-3 p-3 rounded-2xl cc-surface-muted"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${template.color}22`,
                  color: template.color,
                }}
              >
                <CategoryIcon icon={template.icon} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-cc-primary truncate">
                  {template.title}
                </p>
                <p className="text-[11px] text-cc-secondary">
                  {formatDuration(template.estimatedMinutes)} ·{' '}
                  <span style={{ color: TASK_DIFFICULTY_COLORS[template.difficulty] }}>
                    {TASK_DIFFICULTY_LABELS[template.difficulty]}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEdit(template)}
                className="p-2 rounded-xl text-cc-secondary hover:text-[#8B5CF6] transition-colors"
                aria-label="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={removingId === template.id}
                onClick={() => handleDelete(template.id)}
                className="p-2 rounded-xl text-cc-secondary hover:text-red-500 disabled:opacity-50"
                aria-label="Eliminar"
              >
                {removingId === template.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-[11px] text-cc-muted pb-2">
        <Link href="/tiempo/tareas" className="font-semibold" style={{ color: activityTheme.accent }}>
          ← Volver a tareas
        </Link>
      </p>
    </div>
  )
}
