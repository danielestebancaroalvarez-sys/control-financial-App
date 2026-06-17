import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { getHouseholdMembers } from '@/lib/household/queries'
import { buildTimeDashboardSummary, mapHouseholdTask, mapProductivityGoal, mapTimeBlock, mapTimeEntry } from './dashboard'
import { getPeriodRangeAtOffset } from './format'
import { buildWeeklyScheduleEvents } from './schedule'
import type {
  HouseholdTask,
  ProductivityGoal,
  TimeBlock,
  TimeCategory,
  TimeDashboardSummary,
  TimeEntry,
} from './types'
import type { ScheduleEvent } from './schedule'
import type { HouseholdMember } from '@/lib/household/types'

export const getTimeCategories = cache(
  async (householdId: string): Promise<TimeCategory[]> => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('time_categories')
      .select('id, name, icon, color, is_system')
      .eq('household_id', householdId)
      .order('name')

    return (data ?? []).map(row => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      is_system: row.is_system ?? false,
    }))
  }
)

export async function getTimeDashboard(
  householdId: string,
  periodOffset = 0
): Promise<TimeDashboardSummary> {
  const supabase = await createClient()
  const members = await getHouseholdMembers(householdId)
  const memberRows = members.map(m => ({
    user_id: m.user_id,
    full_name: m.full_name,
    avatar_url: m.avatar_url,
  }))

  const [categories, blocksRes, entriesRes, tasksRes, goalsRes] =
    await Promise.all([
      getTimeCategories(householdId),
      supabase
        .from('time_blocks')
        .select(
          `id, category_id, assigned_to, title, frequency, anchor_date, duration_minutes, start_time, end_time,
          time_categories ( name, icon, color )`
        )
        .eq('household_id', householdId)
        .eq('is_active', true),
      supabase
        .from('time_entries')
        .select(
          `id, user_id, category_id, title, entry_date, duration_minutes, start_time, end_time,
          time_categories ( name, icon, color )`
        )
        .eq('household_id', householdId),
      supabase
        .from('household_tasks')
        .select(
          'id, title, description, assigned_to, created_by, due_date, estimated_minutes, difficulty, status, completed_at'
        )
        .eq('household_id', householdId)
        .neq('status', 'cancelled'),
      supabase
        .from('productivity_goals')
        .select(
          `id, title, vision, target_date, color, icon,
          goal_steps ( id, title, step_order, step_type, estimated_minutes, due_date, assigned_to, status )`
        )
        .eq('household_id', householdId)
        .eq('is_active', true),
    ])

  return buildTimeDashboardSummary(
    periodOffset,
    memberRows,
    categories,
    blocksRes.data ?? [],
    entriesRes.data ?? [],
    tasksRes.data ?? [],
    goalsRes.data ?? []
  )
}

export async function getTimeBlocks(householdId: string): Promise<TimeBlock[]> {
  const supabase = await createClient()
  const members = await getHouseholdMembers(householdId)
  const memberRows = members.map(m => ({
    user_id: m.user_id,
    full_name: m.full_name,
    avatar_url: m.avatar_url,
  }))

  const { data } = await supabase
    .from('time_blocks')
    .select(
      `id, category_id, assigned_to, title, frequency, anchor_date, duration_minutes, start_time, end_time,
      time_categories ( name, icon, color )`
    )
    .eq('household_id', householdId)
    .eq('is_active', true)
    .order('title')

  return (data ?? []).map(row => mapTimeBlock(row, memberRows))
}

export async function getTimeEntries(
  householdId: string,
  limit = 50
): Promise<TimeEntry[]> {
  const supabase = await createClient()
  const members = await getHouseholdMembers(householdId)
  const memberRows = members.map(m => ({
    user_id: m.user_id,
    full_name: m.full_name,
    avatar_url: m.avatar_url,
  }))

  const { data } = await supabase
    .from('time_entries')
    .select(
      `id, user_id, category_id, title, entry_date, duration_minutes, start_time, end_time,
      time_categories ( name, icon, color )`
    )
    .eq('household_id', householdId)
    .order('entry_date', { ascending: false })
    .limit(limit)

  return (data ?? []).map(row => mapTimeEntry(row, memberRows))
}

export async function getHouseholdTasks(
  householdId: string
): Promise<HouseholdTask[]> {
  const supabase = await createClient()
  const members = await getHouseholdMembers(householdId)
  const memberRows = members.map(m => ({
    user_id: m.user_id,
    full_name: m.full_name,
    avatar_url: m.avatar_url,
  }))

  const { data } = await supabase
    .from('household_tasks')
    .select(
      'id, title, description, assigned_to, created_by, due_date, estimated_minutes, difficulty, status, completed_at'
    )
    .eq('household_id', householdId)
    .neq('status', 'cancelled')
    .order('due_date', { ascending: true, nullsFirst: false })

  return (data ?? []).map(row => mapHouseholdTask(row, memberRows))
}

export async function getProductivityGoals(
  householdId: string
): Promise<ProductivityGoal[]> {
  const supabase = await createClient()
  const members = await getHouseholdMembers(householdId)
  const memberRows = members.map(m => ({
    user_id: m.user_id,
    full_name: m.full_name,
    avatar_url: m.avatar_url,
  }))

  const { data } = await supabase
    .from('productivity_goals')
    .select(
      `id, title, vision, target_date, color, icon,
      goal_steps ( id, title, step_order, step_type, estimated_minutes, due_date, assigned_to, status )`
    )
    .eq('household_id', householdId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (data ?? []).map(row => mapProductivityGoal(row, memberRows))
}

export type WeeklyScheduleData = {
  periodStart: string
  periodEnd: string
  events: ScheduleEvent[]
  blocks: TimeBlock[]
  members: HouseholdMember[]
}

export async function getWeeklySchedule(
  householdId: string,
  periodOffset = 0
): Promise<WeeklyScheduleData> {
  const { start, end } = getPeriodRangeAtOffset('weekly', periodOffset)
  const members = await getHouseholdMembers(householdId)
  const memberRows = members.map(m => ({
    user_id: m.user_id,
    full_name: m.full_name,
    avatar_url: m.avatar_url,
  }))

  const supabase = await createClient()

  const [blocksRes, entriesRes] = await Promise.all([
    supabase
      .from('time_blocks')
      .select(
        `id, category_id, assigned_to, title, frequency, anchor_date, duration_minutes, start_time, end_time,
        time_categories ( name, icon, color )`
      )
      .eq('household_id', householdId)
      .eq('is_active', true),
    supabase
      .from('time_entries')
      .select(
        `id, user_id, category_id, title, entry_date, duration_minutes, start_time, end_time,
        time_categories ( name, icon, color )`
      )
      .eq('household_id', householdId)
      .gte('entry_date', start)
      .lte('entry_date', end),
  ])

  const blocks = (blocksRes.data ?? []).map(row => mapTimeBlock(row, memberRows))
  const entries = (entriesRes.data ?? []).map(row => mapTimeEntry(row, memberRows))
  const events = buildWeeklyScheduleEvents(blocks, entries, start, end)

  return {
    periodStart: start,
    periodEnd: end,
    events,
    blocks,
    members,
  }
}
