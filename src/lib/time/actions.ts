'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  CreateHouseholdTaskInput,
  CreateProductivityGoalInput,
  CreateTimeBlockInput,
  CreateTimeEntryInput,
} from './types'

const TIME_PATHS = [
  '/tiempo',
  '/tiempo/nuevo',
  '/tiempo/fijos',
  '/tiempo/tareas',
  '/tiempo/metas',
]

function revalidateTime() {
  for (const path of TIME_PATHS) revalidatePath(path)
}

export async function createTimeBlock(
  input: CreateTimeBlockInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }
  if (!input.title.trim()) return { error: 'El título es obligatorio.' }
  if (input.durationMinutes <= 0) return { error: 'La duración debe ser mayor a cero.' }

  const { data, error } = await supabase
    .from('time_blocks')
    .insert({
      household_id: input.householdId,
      created_by: user.id,
      category_id: input.categoryId,
      assigned_to: input.assignedTo ?? null,
      title: input.title.trim(),
      frequency: input.frequency,
      anchor_date: input.anchorDate,
      duration_minutes: input.durationMinutes,
      start_time: input.startTime ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'No se pudo crear el bloque.' }
  revalidateTime()
  return { id: data.id }
}

export async function deactivateTimeBlock(
  householdId: string,
  blockId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('time_blocks')
    .update({ is_active: false })
    .eq('id', blockId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }
  revalidateTime()
  return {}
}

export async function createTimeEntry(
  input: CreateTimeEntryInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }
  if (!input.title.trim()) return { error: 'El título es obligatorio.' }
  if (input.durationMinutes <= 0) return { error: 'La duración debe ser mayor a cero.' }

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      household_id: input.householdId,
      user_id: user.id,
      category_id: input.categoryId,
      title: input.title.trim(),
      entry_date: input.entryDate,
      duration_minutes: input.durationMinutes,
      time_block_id: input.timeBlockId ?? null,
      task_id: input.taskId ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'No se pudo registrar el tiempo.' }
  revalidateTime()
  return { id: data.id }
}

export async function createHouseholdTask(
  input: CreateHouseholdTaskInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }
  if (!input.title.trim()) return { error: 'El título es obligatorio.' }

  const { data, error } = await supabase
    .from('household_tasks')
    .insert({
      household_id: input.householdId,
      created_by: user.id,
      assigned_to: input.assignedTo ?? null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      due_date: input.dueDate ?? null,
      estimated_minutes: input.estimatedMinutes ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'No se pudo crear la tarea.' }
  revalidateTime()
  return { id: data.id }
}

export async function completeHouseholdTask(
  householdId: string,
  taskId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('household_tasks')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }
  revalidateTime()
  return {}
}

export async function reopenHouseholdTask(
  householdId: string,
  taskId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('household_tasks')
    .update({ status: 'pending', completed_at: null })
    .eq('id', taskId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }
  revalidateTime()
  return {}
}

export async function deleteHouseholdTask(
  householdId: string,
  taskId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('household_tasks')
    .update({ status: 'cancelled' })
    .eq('id', taskId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }
  revalidateTime()
  return {}
}

export async function createProductivityGoal(
  input: CreateProductivityGoalInput
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }
  if (!input.title.trim()) return { error: 'El título es obligatorio.' }

  const { data: goal, error } = await supabase
    .from('productivity_goals')
    .insert({
      household_id: input.householdId,
      created_by: user.id,
      title: input.title.trim(),
      target_date: input.targetDate ?? null,
      color: input.color ?? '#6366F1',
      icon: input.icon ?? 'target',
    })
    .select('id')
    .single()

  if (error || !goal) return { error: error?.message ?? 'No se pudo crear la meta.' }

  if (input.steps.length > 0) {
    const { error: stepsError } = await supabase.from('goal_steps').insert(
      input.steps.map((step, index) => ({
        goal_id: goal.id,
        household_id: input.householdId,
        title: step.title.trim(),
        step_order: index,
        estimated_minutes: step.estimatedMinutes ?? null,
        due_date: step.dueDate ?? null,
        assigned_to: step.assignedTo ?? null,
      }))
    )
    if (stepsError) return { error: stepsError.message }
  }

  revalidateTime()
  return { id: goal.id }
}

export async function toggleGoalStep(
  householdId: string,
  stepId: string,
  done: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('goal_steps')
    .update({
      status: done ? 'done' : 'pending',
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq('id', stepId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }
  revalidateTime()
  return {}
}

export async function deleteProductivityGoal(
  householdId: string,
  goalId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('productivity_goals')
    .update({ is_active: false })
    .eq('id', goalId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }
  revalidateTime()
  return {}
}
