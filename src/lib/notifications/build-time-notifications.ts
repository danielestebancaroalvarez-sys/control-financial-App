import { formatShortDate, getTodayString } from '@/lib/time/format'
import type { InAppNotification } from './build-notifications'

export type TimeActivityReminderPayload = {
  weekStart: string
  weekEnd: string
  activities: {
    id: string
    kind: 'task' | 'goal'
    title: string
    dueDate: string
    dueDateLabel: string
    href: string
    goalTitle?: string
  }[]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function buildTimeInAppNotifications(
  payload: TimeActivityReminderPayload
): InAppNotification[] {
  const now = new Date().toISOString()
  const today = getTodayString()
  const tomorrow = addDays(today, 1)
  const items: InAppNotification[] = []

  if (payload.activities.length > 0) {
    const preview = payload.activities
      .slice(0, 3)
      .map(a => a.title)
      .join(' · ')

    items.push({
      id: `time-weekly-${payload.weekStart}`,
      module: 'time',
      type: 'weekly-activities',
      title: 'Actividades de la semana',
      body:
        payload.activities.length === 1
          ? preview
          : `${payload.activities.length} pendientes: ${preview}${
              payload.activities.length > 3 ? '…' : ''
            }`,
      href: '/tiempo/tareas',
      createdAt: now,
    })
  }

  for (const activity of payload.activities) {
    const isToday = activity.dueDate === today
    const isTomorrow = activity.dueDate === tomorrow

    if (activity.kind === 'goal') {
      items.push({
        id: `goal-step-${activity.id}`,
        module: 'time',
        type: 'goal-milestone',
        title: isToday
          ? `Hito hoy: ${activity.title}`
          : isTomorrow
            ? `Hito mañana: ${activity.title}`
            : `Próximo hito: ${activity.title}`,
        body: activity.goalTitle
          ? `Meta «${activity.goalTitle}» · ${activity.dueDateLabel}`
          : activity.dueDateLabel,
        href: activity.href,
        dueDate: activity.dueDate,
        createdAt: now,
      })
      continue
    }

    items.push({
      id: `task-${activity.id}`,
      module: 'time',
      type: isToday ? 'task-today' : isTomorrow ? 'task-tomorrow' : 'task-upcoming',
      title: isToday
        ? `Tarea hoy: ${activity.title}`
        : isTomorrow
          ? `Tarea mañana: ${activity.title}`
          : `Tarea próxima: ${activity.title}`,
      body: activity.dueDateLabel,
      href: activity.href,
      dueDate: activity.dueDate,
      createdAt: now,
    })
  }

  return items
}

export function formatActivityDueLabel(dueDate: string): string {
  const today = getTodayString()
  const tomorrow = addDays(today, 1)
  if (dueDate === today) return 'Hoy'
  if (dueDate === tomorrow) return 'Mañana'
  return formatShortDate(dueDate)
}
