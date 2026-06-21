'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing, Loader2 } from 'lucide-react'
import { getTimeActivityReminderPayload } from '@/lib/notifications/reminder-actions'
import {
  canUseNotifications,
  getActivityReminderMode,
  isActivityRemindersEnabled,
  requestNotificationPermission,
  setActivityReminderMode,
  setActivityRemindersEnabled,
  showActivityNotification,
  type ActivityReminderMode,
} from '@/lib/notifications/activity-reminder-preferences'
import { NOTIFICATION_PERMISSION_HINT } from '@/lib/notifications/notification-branding'

export function ActivityReminderSetting() {
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState<ActivityReminderMode>('weekly-summary')
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setSupported(canUseNotifications())
    setEnabled(isActivityRemindersEnabled())
    setMode(getActivityReminderMode())
    if (canUseNotifications()) {
      setPermission(Notification.permission)
    }
  }, [])

  async function handleEnable() {
    setLoading(true)
    setMessage(null)

    const result = await requestNotificationPermission()
    setPermission(result)

    if (result !== 'granted') {
      setMessage('Necesitas permitir notificaciones en el navegador o en Ajustes del sistema.')
      setLoading(false)
      return
    }

    setActivityRemindersEnabled(true)
    setEnabled(true)
    setMessage('Recordatorios activados. Te avisaremos de tareas e hitos de tus metas.')
    setLoading(false)
  }

  function handleDisable() {
    setActivityRemindersEnabled(false)
    setEnabled(false)
    setMessage('Recordatorios desactivados.')
  }

  function handleModeChange(next: ActivityReminderMode) {
    setActivityReminderMode(next)
    setMode(next)
  }

  async function handleTestNotification() {
    setLoading(true)
    setMessage(null)

    if (permission !== 'granted') {
      await handleEnable()
      if (Notification.permission !== 'granted') return
    }

    const payload = await getTimeActivityReminderPayload()
    if (!payload || payload.activities.length === 0) {
      setMessage(
        'No hay tareas ni hitos pendientes esta semana. Crea una en Tareas o Metas.'
      )
      setLoading(false)
      return
    }

    const lines = payload.activities
      .slice(0, 3)
      .map(a => `• ${a.title} · ${a.dueDateLabel}`)
      .join('\n')

    await showActivityNotification({
      title: 'Prueba · Actividades de la semana',
      body: lines,
      tag: 'activity-reminder-test',
      url: '/tiempo/tareas',
    })

    setMessage('Notificación de prueba enviada.')
    setLoading(false)
  }

  if (!supported) {
    return (
      <div>
        <h2 className="text-[15px] font-bold text-cc-primary mb-2 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#6366F1]" />
          Recordatorios de actividades
        </h2>
        <p className="text-[13px] text-cc-secondary">
          Tu navegador no soporta notificaciones. Prueba instalando la app en Chrome o Safari.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[15px] font-bold text-cc-primary flex items-center gap-2">
          <BellRing className="w-4 h-4 text-[#6366F1]" />
          Recordatorios de actividades
        </h2>
        <p className="text-[12px] text-cc-secondary mt-1">
          Avisos de tareas pendientes e hitos de metas. También aparecen en la campana del
          encabezado.
        </p>
        <p className="text-[10px] text-cc-muted mt-2">{NOTIFICATION_PERMISSION_HINT}</p>
      </div>

      {!enabled ? (
        <button
          type="button"
          onClick={handleEnable}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-[13px] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Bell className="w-4 h-4" />
              Activar recordatorios
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#6366F1]/10">
            <span className="text-[13px] font-semibold text-[#6366F1]">Activos</span>
            <button
              type="button"
              onClick={handleDisable}
              className="text-[12px] font-bold text-cc-secondary underline"
            >
              Desactivar
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-cc-secondary">Cuándo avisar</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('weekly-summary')}
                className={`text-left p-3 rounded-xl text-[12px] ${
                  mode === 'weekly-summary'
                    ? 'bg-[#6366F1] text-white font-bold'
                    : 'cc-surface-muted text-cc-secondary'
                }`}
              >
                Resumen el domingo o lunes
                <span className="block text-[10px] font-normal mt-0.5 opacity-90">
                  Lista tareas e hitos de la semana
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('day-before')}
                className={`text-left p-3 rounded-xl text-[12px] ${
                  mode === 'day-before'
                    ? 'bg-[#6366F1] text-white font-bold'
                    : 'cc-surface-muted text-cc-secondary'
                }`}
              >
                Un día antes de cada actividad
                <span className="block text-[10px] font-normal mt-0.5 opacity-90">
                  Aviso la víspera de cada tarea o hito
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestNotification}
            disabled={loading}
            className="w-full py-2.5 rounded-xl cc-surface-muted text-cc-primary font-bold text-[12px] disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Probar notificación ahora'}
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <p className="text-[11px] text-[#EC4899]">
          Las notificaciones están bloqueadas. Habilítalas en la configuración del navegador.
        </p>
      )}

      {message && <p className="text-[12px] text-cc-secondary">{message}</p>}
    </div>
  )
}
