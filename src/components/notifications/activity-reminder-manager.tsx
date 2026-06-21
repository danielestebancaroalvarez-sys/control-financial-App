'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  getTimeActivityReminderPayload,
  getTimeInAppNotifications,
} from '@/lib/notifications/reminder-actions'
import { buildTimeInAppNotifications } from '@/lib/notifications/build-time-notifications'
import { syncInAppNotifications } from '@/lib/notifications/in-app-store'
import { getTomorrowDateString } from '@/lib/finance/payment-reminders'
import {
  getActivityReminderMode,
  isActivityRemindersEnabled,
  markDayBeforeActivityReminderSent,
  markWeeklyActivityReminderSent,
  showActivityNotification,
  wasDayBeforeActivityReminderSent,
  wasWeeklyActivityReminderSent,
} from '@/lib/notifications/activity-reminder-preferences'

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

function buildWeeklyBody(
  activities: { title: string; dueDateLabel: string }[]
): string {
  if (activities.length === 0) return 'No tienes tareas ni hitos pendientes esta semana.'
  const preview = activities
    .slice(0, 4)
    .map(a => `• ${a.title} · ${a.dueDateLabel}`)
    .join('\n')
  const extra = activities.length > 4 ? `\n…y ${activities.length - 4} más` : ''
  return `${activities.length} actividad${activities.length !== 1 ? 'es' : ''}:\n${preview}${extra}`
}

async function syncTimeInboxFromServer() {
  const items = await getTimeInAppNotifications()
  syncInAppNotifications(items, 'time')
}

export function ActivityReminderManager() {
  const checking = useRef(false)

  const runReminderCheck = useCallback(async () => {
    if (checking.current) return

    checking.current = true
    try {
      const payload = await getTimeActivityReminderPayload()
      if (!payload) return

      syncInAppNotifications(buildTimeInAppNotifications(payload), 'time')

      if (!isActivityRemindersEnabled()) return
      if (typeof window === 'undefined' || !('Notification' in window)) return
      if (Notification.permission !== 'granted') return
      if (payload.activities.length === 0) return

      const mode = getActivityReminderMode()
      const today = new Date()
      const day = today.getDay()

      if (mode === 'weekly-summary') {
        if (day !== 0 && day !== 1) return
        if (wasWeeklyActivityReminderSent(payload.weekStart)) return

        await showActivityNotification({
          title: 'Actividades de la semana',
          body: buildWeeklyBody(payload.activities),
          tag: `weekly-activities-${payload.weekStart}`,
          url: '/tiempo/tareas',
        })
        markWeeklyActivityReminderSent(payload.weekStart)
        return
      }

      const tomorrow = getTomorrowDateString()
      const dueTomorrow = payload.activities.filter(a => a.dueDate === tomorrow)

      for (const activity of dueTomorrow) {
        if (wasDayBeforeActivityReminderSent(activity.id)) continue

        await showActivityNotification({
          title: `Mañana: ${activity.title}`,
          body: activity.goalTitle
            ? `Meta «${activity.goalTitle}» · ${activity.dueDateLabel}`
            : activity.dueDateLabel,
          tag: `activity-${activity.id}`,
          url: activity.href,
        })
        markDayBeforeActivityReminderSent(activity.id)
      }
    } finally {
      checking.current = false
    }
  }, [])

  useEffect(() => {
    syncTimeInboxFromServer()
    runReminderCheck()

    const interval = window.setInterval(() => {
      syncTimeInboxFromServer()
      runReminderCheck()
    }, CHECK_INTERVAL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        syncTimeInboxFromServer()
        runReminderCheck()
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [runReminderCheck])

  return null
}
