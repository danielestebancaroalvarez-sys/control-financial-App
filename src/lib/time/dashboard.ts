import type {
  HouseholdTask,
  ProductivityGoal,
  TaskTemplate,
  TimeBlock,
  TimeCategory,
  TimeDashboardSummary,
  TimeEntry,
  TimeMemberMetrics,
} from './types'
import type { TimeFrequency } from './types'
import {
  blockMinutesInRange,
  buildSleepEntryOverrideKeys,
} from './sleep-overrides'
import { getPeriodRangeAtOffset, daysUntilDate } from './format'
import {
  buildDaily24hSlices,
  calculateProductivityScore,
  EFFORT_CATEGORIES,
  LEISURE_CATEGORIES,
  PRODUCTIVITY_CATEGORIES,
  type CategoryMinutes,
  mapToSortedCategories,
  percentOf,
  sumCategoryMinutes,
  taskEffortMinutes,
} from './productivity-metrics'
import { getTimeChartColor } from './chart-colors'

type MemberRow = {
  user_id: string
  full_name: string | null
  avatar_url: string | null
}

type CategoryRow = {
  id?: string
  name: string
  icon: string | null
  color: string | null
}

type BlockRow = {
  id: string
  category_id: string
  assigned_to: string | null
  title: string
  frequency: string
  anchor_date: string
  duration_minutes: number
  start_time: string | null
  end_time: string | null
  time_categories: CategoryRow | CategoryRow[] | null
}

type EntryRow = {
  id: string
  user_id: string
  category_id: string
  title: string
  entry_date: string
  duration_minutes: number
  start_time: string | null
  end_time: string | null
  time_categories: CategoryRow | CategoryRow[] | null
}

type TaskRow = {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  created_by: string
  due_date: string | null
  estimated_minutes: number | null
  difficulty: number
  color: string | null
  icon: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  status: 'pending' | 'done' | 'cancelled'
  completed_at: string | null
  template_id?: string | null
}

type GoalRow = {
  id: string
  title: string
  vision: string | null
  target_date: string | null
  color: string | null
  icon: string | null
  image_path?: string | null
  created_by?: string
  goal_steps: {
    id: string
    title: string
    step_order: number
    step_type: string
    estimated_minutes: number | null
    due_date: string | null
    assigned_to: string | null
    status: 'pending' | 'done'
  }[]
}

function pickCat(
  raw: CategoryRow | CategoryRow[] | null
): CategoryRow | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

function memberName(members: MemberRow[], userId: string | null): string | null {
  if (!userId) return null
  return members.find(m => m.user_id === userId)?.full_name ?? 'Miembro'
}

export function mapTimeBlock(row: BlockRow, members: MemberRow[]): TimeBlock {
  const cat = pickCat(row.time_categories)
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: cat?.name ?? 'Sin categoría',
    categoryIcon: cat?.icon ?? null,
    categoryColor: cat?.color ?? '#6366F1',
    assignedTo: row.assigned_to,
    assigneeName: memberName(members, row.assigned_to),
    title: row.title,
    frequency: row.frequency as TimeFrequency,
    anchorDate: row.anchor_date,
    durationMinutes: row.duration_minutes,
    startTime: row.start_time,
    endTime: row.end_time,
  }
}

export function mapTimeEntry(row: EntryRow, members: MemberRow[]): TimeEntry {
  const cat = pickCat(row.time_categories)
  return {
    id: row.id,
    userId: row.user_id,
    userName: memberName(members, row.user_id),
    categoryId: row.category_id,
    categoryName: cat?.name ?? 'Sin categoría',
    categoryIcon: cat?.icon ?? null,
    categoryColor: cat?.color ?? '#6366F1',
    title: row.title,
    entryDate: row.entry_date,
    durationMinutes: row.duration_minutes,
    startTime: row.start_time,
    endTime: row.end_time,
  }
}

export function mapHouseholdTask(row: TaskRow, members: MemberRow[]): HouseholdTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assignedTo: row.assigned_to,
    assigneeName: memberName(members, row.assigned_to),
    createdBy: row.created_by,
    creatorName: memberName(members, row.created_by),
    dueDate: row.due_date,
    estimatedMinutes: row.estimated_minutes,
    difficulty: (row.difficulty ?? 2) as 1 | 2 | 3,
    color: row.color ?? '#6366F1',
    icon: row.icon ?? 'package',
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
    status: row.status,
    completedAt: row.completed_at,
    templateId: row.template_id ?? null,
  }
}

export function mapTaskTemplate(
  row: {
    id: string
    title: string
    description: string | null
    estimated_minutes: number
    difficulty: number
    color: string | null
    icon: string | null
    created_by: string
  },
  members: MemberRow[]
): TaskTemplate {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    estimatedMinutes: row.estimated_minutes,
    difficulty: (row.difficulty ?? 2) as 1 | 2 | 3,
    color: row.color ?? '#6366F1',
    icon: row.icon ?? 'package',
    createdBy: row.created_by,
    creatorName: memberName(members, row.created_by),
  }
}

export function mapProductivityGoal(
  row: GoalRow,
  members: MemberRow[],
  imageUrl: string | null = null
): ProductivityGoal {
  const steps = [...(row.goal_steps ?? [])].sort(
    (a, b) => a.step_order - b.step_order
  )
  const doneSteps = steps.filter(s => s.status === 'done').length
  const totalSteps = steps.length
  const estimatedRemainingMinutes = steps
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + (s.estimated_minutes ?? 0), 0)

  const pendingMilestones = steps
    .filter(s => s.status === 'pending' && s.due_date)
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))

  const nextMilestone = pendingMilestones[0] ?? null

  return {
    id: row.id,
    title: row.title,
    vision: row.vision,
    targetDate: row.target_date,
    color: row.color,
    icon: row.icon,
    imageUrl,
    createdBy: row.created_by ?? '',
    creatorName: memberName(members, row.created_by ?? null),
    doneSteps,
    totalSteps,
    estimatedRemainingMinutes,
    percent: totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0,
    nextMilestoneTitle: nextMilestone?.title ?? null,
    nextMilestoneDate: nextMilestone?.due_date ?? null,
    daysToNextMilestone: nextMilestone?.due_date
      ? daysUntilDate(nextMilestone.due_date)
      : null,
    steps: steps.map(s => ({
      id: s.id,
      goalId: row.id,
      title: s.title,
      stepOrder: s.step_order,
      stepType: (s.step_type === 'action' ? 'action' : 'milestone') as 'milestone' | 'action',
      estimatedMinutes: s.estimated_minutes,
      dueDate: s.due_date,
      assignedTo: s.assigned_to,
      assigneeName: memberName(members, s.assigned_to),
      status: s.status,
    })),
  }
}

function addMemberCategory(
  memberCategoryTotals: Map<string, Map<string, CategoryMinutes>>,
  userId: string | null,
  name: string,
  minutes: number,
  colorIndex: number
) {
  if (!userId || minutes <= 0) return
  if (!memberCategoryTotals.has(userId)) {
    memberCategoryTotals.set(userId, new Map())
  }
  const map = memberCategoryTotals.get(userId)!
  const prev = map.get(name)
  map.set(name, {
    name,
    minutes: (prev?.minutes ?? 0) + minutes,
    color: getTimeChartColor(name, colorIndex),
  })
}

export function buildTimeDashboardSummary(
  periodOffset: number,
  members: MemberRow[],
  categories: TimeCategory[],
  blocks: BlockRow[],
  entries: EntryRow[],
  tasks: TaskRow[],
  goals: GoalRow[]
): TimeDashboardSummary {
  const { start, end } = getPeriodRangeAtOffset('weekly', periodOffset)
  const periodLabel =
    periodOffset === 0
      ? 'Semana actual'
      : periodOffset === 1
        ? 'Semana anterior'
        : `${start} → ${end}`

  const categoryTotals = new Map<string, CategoryMinutes>()
  const memberTotals = new Map<string, number>()
  const memberCategoryTotals = new Map<string, Map<string, CategoryMinutes>>()
  const memberEffortFromTasks = new Map<string, number>()
  const memberDoneTasks = new Map<string, number>()
  const memberSleepMinutes = new Map<string, number>()
  let totalMinutes = 0
  let sleepMinutes = 0

  const sleepOverrides = buildSleepEntryOverrideKeys(
    entries.map(entry => {
      const cat = pickCat(entry.time_categories)
      return {
        userId: entry.user_id,
        entryDate: entry.entry_date,
        categoryName: cat?.name ?? 'Otros',
      }
    })
  )

  for (const entry of entries) {
    if (entry.entry_date < start || entry.entry_date > end) continue
    const cat = pickCat(entry.time_categories)
    const name = cat?.name ?? 'Otros'
    const color = cat?.color ?? '#94A3B8'
    const prev = categoryTotals.get(name)
    categoryTotals.set(name, {
      name,
      minutes: (prev?.minutes ?? 0) + entry.duration_minutes,
      color: getTimeChartColor(name, categoryTotals.size),
    })
    memberTotals.set(
      entry.user_id,
      (memberTotals.get(entry.user_id) ?? 0) + entry.duration_minutes
    )
    addMemberCategory(
      memberCategoryTotals,
      entry.user_id,
      name,
      entry.duration_minutes,
      categoryTotals.size
    )
    totalMinutes += entry.duration_minutes
    if (name === 'Sueño') {
      sleepMinutes += entry.duration_minutes
      memberSleepMinutes.set(
        entry.user_id,
        (memberSleepMinutes.get(entry.user_id) ?? 0) + entry.duration_minutes
      )
    }
  }

  for (const block of blocks) {
    const cat = pickCat(block.time_categories)
    const name = cat?.name ?? 'Otros'
    const minutes = blockMinutesInRange(
      block.anchor_date,
      block.frequency as TimeFrequency,
      block.duration_minutes,
      start,
      end,
      {
        categoryName: name,
        assignedTo: block.assigned_to,
        sleepOverrides,
      }
    )
    if (minutes <= 0) continue
    const color = cat?.color ?? '#94A3B8'
    const prev = categoryTotals.get(name)
    categoryTotals.set(name, {
      name,
      minutes: (prev?.minutes ?? 0) + minutes,
      color: getTimeChartColor(name, categoryTotals.size),
    })
    if (block.assigned_to) {
      memberTotals.set(
        block.assigned_to,
        (memberTotals.get(block.assigned_to) ?? 0) + minutes
      )
      addMemberCategory(
        memberCategoryTotals,
        block.assigned_to,
        name,
        minutes,
        categoryTotals.size
      )
    }
    totalMinutes += minutes
    if (name === 'Sueño' && block.assigned_to) {
      sleepMinutes += minutes
      memberSleepMinutes.set(
        block.assigned_to,
        (memberSleepMinutes.get(block.assigned_to) ?? 0) + minutes
      )
    } else if (name === 'Sueño') {
      sleepMinutes += minutes
    }
  }

  for (const task of tasks) {
    if (task.status !== 'done' || !task.completed_at) continue
    const completedDate = task.completed_at.slice(0, 10)
    if (completedDate < start || completedDate > end) continue
    const userId = task.assigned_to ?? task.created_by
    const effort = taskEffortMinutes(task.estimated_minutes, task.difficulty ?? 2)
    memberEffortFromTasks.set(userId, (memberEffortFromTasks.get(userId) ?? 0) + effort)
    memberDoneTasks.set(userId, (memberDoneTasks.get(userId) ?? 0) + 1)
  }

  const goalProgressByUser = new Map<string, number[]>()
  for (const goal of goals) {
    const mapped = mapProductivityGoal(goal, members)
    if (goal.created_by) {
      const list = goalProgressByUser.get(goal.created_by) ?? []
      list.push(mapped.percent)
      goalProgressByUser.set(goal.created_by, list)
    }
  }

  const byCategory = mapToSortedCategories(categoryTotals)

  const productivityMinutes = sumCategoryMinutes(
    categoryTotals,
    PRODUCTIVITY_CATEGORIES
  )
  const leisureMinutes = sumCategoryMinutes(categoryTotals, LEISURE_CATEGORIES)

  const byMember = members
    .map(m => {
      const minutes = memberTotals.get(m.user_id) ?? 0
      return {
        userId: m.user_id,
        name: m.full_name ?? 'Miembro',
        minutes,
        percent: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
        avatarUrl: m.avatar_url,
      }
    })
    .filter(m => m.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)

  const memberMetrics: TimeMemberMetrics[] = members
    .map(m => {
      const memberCats = memberCategoryTotals.get(m.user_id) ?? new Map()
      const weekCategories = mapToSortedCategories(memberCats)
      const total = memberTotals.get(m.user_id) ?? 0
      const productivityMins = sumCategoryMinutes(memberCats, PRODUCTIVITY_CATEGORIES)
      const leisureMins = sumCategoryMinutes(memberCats, LEISURE_CATEGORIES)
      const effortFromTime = sumCategoryMinutes(memberCats, EFFORT_CATEGORIES)
      const effortFromTasks = memberEffortFromTasks.get(m.user_id) ?? 0
      const memberSleep = memberSleepMinutes.get(m.user_id) ?? 0
      const doneTasksCount = memberDoneTasks.get(m.user_id) ?? 0
      const goalPercents = goalProgressByUser.get(m.user_id) ?? []
      const goalProgressPercent =
        goalPercents.length > 0
          ? Math.round(goalPercents.reduce((a, b) => a + b, 0) / goalPercents.length)
          : 0
      const productivityPercent = percentOf(productivityMins, total)
      const leisurePercent = percentOf(leisureMins, total)

      return {
        userId: m.user_id,
        name: m.full_name ?? 'Miembro',
        avatarUrl: m.avatar_url,
        totalMinutes: total,
        productivityMinutes: productivityMins,
        productivityPercent,
        leisureMinutes: leisureMins,
        leisurePercent,
        effortMinutes: effortFromTime + effortFromTasks,
        doneTasks: doneTasksCount,
        sleepMinutes: memberSleep,
        goalProgressPercent,
        productivityScore: calculateProductivityScore({
          productivityPercent,
          leisurePercent,
          effortMinutes: effortFromTime + effortFromTasks,
          totalMinutes: total,
          sleepMinutes: memberSleep,
          doneTasks: doneTasksCount,
          goalProgressPercent,
        }),
        dailyCategories: buildDaily24hSlices(weekCategories),
      }
    })
    .filter(m => m.totalMinutes > 0 || m.effortMinutes > 0)
    .sort((a, b) => b.productivityScore - a.productivityScore)

  const pendingTasks = tasks.filter(t => t.status === 'pending').length
  const doneTasks = tasks.filter(
    t => t.status === 'done' && t.completed_at
  ).length

  const activeGoals = goals
    .map(g => mapProductivityGoal(g, members))
    .filter(g => g.percent < 100)
    .slice(0, 5)

  return {
    periodStart: start,
    periodEnd: end,
    periodLabel,
    totalMinutes,
    byCategory,
    byMember,
    productivityMinutes,
    productivityPercent: percentOf(productivityMinutes, totalMinutes),
    leisureMinutes,
    leisurePercent: percentOf(leisureMinutes, totalMinutes),
    memberMetrics,
    sleepMinutes,
    pendingTasks,
    doneTasks,
    activeGoals,
  }
}
