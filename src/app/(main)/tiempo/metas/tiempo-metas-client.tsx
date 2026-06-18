'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, Plus, Target, Trash2, X } from 'lucide-react'
import { GoalProgressRing, GoalProgressSummary, GoalTimeline } from '@/components/time/goal-timeline'
import { FormField, FormSection } from '@/components/time/form-field'
import { UserAvatar } from '@/components/profile/user-avatar'
import {
  addGoalStep,
  createProductivityGoal,
  deleteGoalStep,
  deleteProductivityGoal,
  toggleGoalStep,
  uploadProductivityGoalImage,
} from '@/lib/time/actions'
import { formatShortDate } from '@/lib/time/format'
import { TIME_THEME } from '@/lib/time/theme'
import { compressReceiptImage } from '@/lib/receipts/compress-image'
import type { GoalStepType, ProductivityGoal } from '@/lib/time/types'
import type { HouseholdMember } from '@/lib/household/types'

type DraftStep = {
  title: string
  stepType: GoalStepType
  dueDate: string
  minutes: string
}

type GoalFilter = 'all' | 'mine' | 'completed' | string

const inputClass = `w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none ${TIME_THEME.focus}`

export function TiempoMetasClient({
  goals: initialGoals,
  householdId,
  members,
  currentUserId,
}: {
  goals: ProductivityGoal[]
  householdId: string
  members: HouseholdMember[]
  currentUserId: string
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [goals, setGoals] = useState(initialGoals)
  const [filter, setFilter] = useState<GoalFilter>('all')

  useEffect(() => {
    setGoals(initialGoals)
  }, [initialGoals])

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [vision, setVision] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [draftSteps, setDraftSteps] = useState<DraftStep[]>([
    { title: '', stepType: 'milestone', dueDate: '', minutes: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [stepLoadingId, setStepLoadingId] = useState<string | null>(null)
  const [addingToGoalId, setAddingToGoalId] = useState<string | null>(null)
  const [newStep, setNewStep] = useState<DraftStep>({
    title: '',
    stepType: 'milestone',
    dueDate: '',
    minutes: '',
  })
  const [error, setError] = useState<string | null>(null)

  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      if (filter === 'completed') return goal.percent >= 100
      if (filter === 'mine') return goal.createdBy === currentUserId
      if (filter === 'all') return goal.percent < 100
      if (filter.startsWith('user:')) {
        const userId = filter.slice(5)
        return goal.createdBy === userId
      }
      return true
    })
  }, [goals, filter, currentUserId])

  async function handleImagePick(file: File) {
    const compressed = await compressReceiptImage(file)
    setImageFile(new File([compressed], file.name, { type: compressed.type || 'image/jpeg' }))
    setImagePreview(URL.createObjectURL(compressed))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const steps = draftSteps
      .filter(s => s.title.trim())
      .map(s => ({
        title: s.title.trim(),
        stepType: s.stepType,
        dueDate: s.stepType === 'milestone' ? s.dueDate || null : s.dueDate || null,
        estimatedMinutes:
          s.stepType === 'action' && s.minutes ? parseInt(s.minutes, 10) : null,
      }))

    const result = await createProductivityGoal({
      householdId,
      title: title.trim() || 'Nueva meta',
      vision: vision.trim() || null,
      targetDate: targetDate || null,
      steps,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.id && imageFile) {
      const fd = new FormData()
      fd.append('file', imageFile)
      const upload = await uploadProductivityGoalImage(householdId, result.id, fd)
      if (upload.error) {
        setError(upload.error)
        setLoading(false)
        return
      }
    }

    setShowForm(false)
    setTitle('')
    setVision('')
    setTargetDate('')
    clearImage()
    setDraftSteps([{ title: '', stepType: 'milestone', dueDate: '', minutes: '' }])
    setLoading(false)
    router.refresh()
  }

  async function handleToggleStep(goalId: string, stepId: string, done: boolean) {
    setStepLoadingId(stepId)
    const result = await toggleGoalStep(householdId, stepId, !done)
    if (!result.error) router.refresh()
    setStepLoadingId(null)
  }

  async function handleAddStep(goalId: string) {
    if (!newStep.title.trim()) return
    setStepLoadingId(goalId)
    const result = await addGoalStep(householdId, goalId, {
      title: newStep.title.trim(),
      stepType: newStep.stepType,
      dueDate: newStep.dueDate || null,
      estimatedMinutes:
        newStep.stepType === 'action' && newStep.minutes
          ? parseInt(newStep.minutes, 10)
          : null,
    })
    if (!result.error) {
      setAddingToGoalId(null)
      setNewStep({ title: '', stepType: 'milestone', dueDate: '', minutes: '' })
      router.refresh()
    }
    setStepLoadingId(null)
  }

  async function handleDeleteStep(goalId: string, stepId: string) {
    setStepLoadingId(stepId)
    const result = await deleteGoalStep(householdId, stepId)
    if (!result.error) router.refresh()
    setStepLoadingId(null)
  }

  async function handleDeleteGoal(goalId: string) {
    const result = await deleteProductivityGoal(householdId, goalId)
    if (!result.error) {
      setGoals(prev => prev.filter(g => g.id !== goalId))
      router.refresh()
    }
  }

  function StepDraftFields({
    step,
    onChange,
  }: {
    step: DraftStep
    onChange: (s: DraftStep) => void
  }) {
    return (
      <div className="space-y-2 p-3 rounded-xl cc-surface-muted">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...step, stepType: 'milestone' })}
            className={`flex-1 py-2 rounded-lg text-[11px] font-bold ${
              step.stepType === 'milestone'
                ? 'bg-[#6366F1] text-white'
                : 'cc-surface text-cc-secondary'
            }`}
          >
            Hito con fecha
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...step, stepType: 'action' })}
            className={`flex-1 py-2 rounded-lg text-[11px] font-bold ${
              step.stepType === 'action'
                ? 'bg-[#6366F1] text-white'
                : 'cc-surface text-cc-secondary'
            }`}
          >
            Acción rápida
          </button>
        </div>
        <input
          type="text"
          value={step.title}
          onChange={e => onChange({ ...step, title: e.target.value })}
          placeholder={
            step.stepType === 'milestone'
              ? 'Ej: Reservar cita con el banco'
              : 'Ej: Buscar comparativas de préstamos'
          }
          className={inputClass}
        />
        {step.stepType === 'milestone' ? (
          <FormField
            label="Fecha objetivo del hito"
            hint="Mes y año en que quieres lograr este paso."
          >
            <input
              type="date"
              value={step.dueDate}
              onChange={e => onChange({ ...step, dueDate: e.target.value })}
              className={inputClass}
            />
          </FormField>
        ) : (
          <FormField label="Tiempo estimado (min)" hint="Opcional. Ej: 15, 30, 60.">
            <input
              type="number"
              min="1"
              value={step.minutes}
              onChange={e => onChange({ ...step, minutes: e.target.value })}
              placeholder="min"
              className={inputClass}
            />
          </FormField>
        )}
      </div>
    )
  }

  const filterOptions: { id: GoalFilter; label: string }[] = [
    { id: 'all', label: 'Activas' },
    { id: 'mine', label: 'Mías' },
    ...members.map(m => ({
      id: `user:${m.user_id}` as GoalFilter,
      label: m.full_name?.split(' ')[0] ?? 'Miembro',
    })),
    { id: 'completed', label: 'Completadas' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-cc-primary flex items-center gap-2">
          <Target className="w-5 h-5 text-[#6366F1]" />
          Metas y proyectos
        </h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">
          Organiza proyectos del hogar con hitos claros. Ej: Renovar el baño → pedir presupuestos
          (2 semanas) → elegir albañil (1 mes).
        </p>
      </div>

      {goals.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {filterOptions.map(opt => {
            const active = filter === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilter(opt.id)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white'
                    : 'cc-surface-muted text-cc-secondary'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[13px] font-bold"
        >
          <Plus className="w-4 h-4" />
          Nueva meta
        </button>
      ) : (
        <form onSubmit={handleCreate} className="cc-surface rounded-[24px] p-4 space-y-4">
          <FormField
            label="Nombre de la meta"
            hint="Ej: Ahorrar para vacaciones, Arreglar el coche, Curso de cocina."
            required
          >
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nombre de la meta"
              className={inputClass}
            />
          </FormField>

          <FormField label="Imagen de la meta" hint="Opcional. Una foto que te motive.">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) void handleImagePick(file)
              }}
            />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="" className="w-full h-36 object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
                  aria-label="Quitar imagen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 rounded-xl border-2 border-dashed border-[#6366F1]/30 flex flex-col items-center gap-2 text-[#6366F1]"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-[12px] font-bold">Subir imagen</span>
              </button>
            )}
          </FormField>

          <FormField
            label="¿Qué quieres lograr?"
            hint="Una frase que te motive a largo plazo."
          >
            <textarea
              value={vision}
              onChange={e => setVision(e.target.value)}
              placeholder="Ej: Quiero tener el baño listo antes del verano sin endeudarnos."
              rows={2}
              className={inputClass}
            />
          </FormField>
          <FormField
            label="Fecha final de la meta"
            hint="Opcional. Define el horizonte total del proyecto."
          >
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormSection
            title="Hitos y acciones"
            description="Los hitos tienen fecha (meses/años). Las acciones son tareas cortas con minutos."
          >
            {draftSteps.map((step, index) => (
              <StepDraftFields
                key={index}
                step={step}
                onChange={s => {
                  const next = [...draftSteps]
                  next[index] = s
                  setDraftSteps(next)
                }}
              />
            ))}
            <button
              type="button"
              onClick={() =>
                setDraftSteps(prev => [
                  ...prev,
                  { title: '', stepType: 'milestone', dueDate: '', minutes: '' },
                ])
              }
              className="text-[12px] font-bold text-[#6366F1]"
            >
              + Otro paso
            </button>
          </FormSection>

          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                clearImage()
              }}
              className="flex-1 py-2.5 rounded-xl cc-surface-muted text-[13px] font-bold text-cc-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-white text-[13px] font-bold disabled:opacity-60 ${TIME_THEME.submit}`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando…
                </span>
              ) : (
                'Crear meta'
              )}
            </button>
          </div>
        </form>
      )}

      {filteredGoals.length === 0 && !showForm ? (
        <section className="cc-surface rounded-[24px] p-6 text-center">
          <p className="text-[13px] text-cc-secondary">
            {filter === 'all'
              ? 'Crea metas con hitos a futuro para proyectos personales o del hogar.'
              : 'No hay metas con este filtro.'}
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map(goal => {
            const owner = members.find(m => m.user_id === goal.createdBy)
            return (
              <section
                key={goal.id}
                className="rounded-[24px] overflow-hidden border border-[#6366F1]/15 bg-white dark:bg-[var(--cc-surface)] shadow-sm"
              >
                {goal.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={goal.imageUrl}
                    alt=""
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <GoalProgressRing percent={goal.percent} />
                    <div className="min-w-0 pt-0.5">
                      <h2 className="text-[15px] font-bold text-white leading-tight">
                        {goal.title}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-1">
                        {owner && (
                          <UserAvatar
                            name={owner.full_name ?? 'Miembro'}
                            avatarUrl={owner.avatar_url}
                            size="xs"
                            className="ring-white/30"
                          />
                        )}
                        <p className="text-[11px] text-white/85">
                          De {goal.creatorName ?? 'alguien del hogar'}
                        </p>
                      </div>
                      {goal.targetDate && (
                        <p className="text-[11px] text-white/80 mt-0.5">
                          Objetivo: {formatShortDate(goal.targetDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 shrink-0"
                    aria-label="Eliminar meta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <GoalProgressSummary goal={goal} />
                  <GoalTimeline
                    goal={goal}
                    onToggleStep={handleToggleStep}
                    onDeleteStep={handleDeleteStep}
                    stepLoadingId={stepLoadingId}
                  />
                  {addingToGoalId === goal.id ? (
                    <div className="space-y-2 pt-1">
                      <StepDraftFields step={newStep} onChange={setNewStep} />
                      <button
                        type="button"
                        disabled={stepLoadingId === goal.id}
                        onClick={() => handleAddStep(goal.id)}
                        className="w-full py-2 rounded-xl bg-[#6366F1] text-white text-[12px] font-bold"
                      >
                        {stepLoadingId === goal.id ? 'Guardando…' : 'Añadir paso'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingToGoalId(goal.id)
                        setNewStep({
                          title: '',
                          stepType: 'milestone',
                          dueDate: '',
                          minutes: '',
                        })
                      }}
                      className="text-[12px] font-bold text-[#6366F1] pt-1"
                    >
                      + Añadir paso
                    </button>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
