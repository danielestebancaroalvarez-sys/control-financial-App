'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing, Loader2 } from 'lucide-react'
import { getPaymentReminderPayload } from '@/lib/notifications/reminder-actions'
import {
  canUseNotifications,
  getPaymentReminderMode,
  isPaymentRemindersEnabled,
  requestNotificationPermission,
  setPaymentReminderMode,
  setPaymentRemindersEnabled,
  showPaymentNotification,
  type PaymentReminderMode,
} from '@/lib/notifications/reminder-preferences'
import { NOTIFICATION_PERMISSION_HINT } from '@/lib/notifications/notification-branding'

export function PaymentReminderSetting() {
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState<PaymentReminderMode>('weekly-summary')
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setSupported(canUseNotifications())
    setEnabled(isPaymentRemindersEnabled())
    setMode(getPaymentReminderMode())
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

    setPaymentRemindersEnabled(true)
    setEnabled(true)
    setMessage('Recordatorios activados. Te avisaremos de tus pagos recurrentes.')
    setLoading(false)
  }

  function handleDisable() {
    setPaymentRemindersEnabled(false)
    setEnabled(false)
    setMessage('Recordatorios desactivados.')
  }

  function handleModeChange(next: PaymentReminderMode) {
    setPaymentReminderMode(next)
    setMode(next)
  }

  async function handleTestNotification() {
    setLoading(true)
    setMessage(null)

    if (permission !== 'granted') {
      await handleEnable()
      if (Notification.permission !== 'granted') return
    }

    const payload = await getPaymentReminderPayload()
    if (!payload || payload.formattedPayments.length === 0) {
      setMessage(
        'No hay pagos recurrentes en la próxima semana. Crea un gasto recurrente en Nuevo.'
      )
      setLoading(false)
      return
    }

    const lines = payload.formattedPayments
      .slice(0, 3)
      .map(p => `• ${p.name} (${p.amountLabel})`)
      .join('\n')

    await showPaymentNotification({
      title: 'Prueba · Pagos próxima semana',
      body: lines,
      tag: 'payment-reminder-test',
      url: '/predicciones',
    })

    setMessage('Notificación de prueba enviada.')
    setLoading(false)
  }

  if (!supported) {
    return (
      <section className="cc-surface rounded-[24px] p-5">
        <h2 className="text-[15px] font-bold text-cc-primary mb-2 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#00BFA5]" />
          Recordatorios de pagos
        </h2>
        <p className="text-[13px] text-cc-secondary">
          Tu navegador no soporta notificaciones. Prueba instalando la app en Chrome o Safari.
        </p>
      </section>
    )
  }

  return (
    <section className="cc-surface rounded-[24px] p-5 space-y-4">
      <div>
        <h2 className="text-[15px] font-bold text-cc-primary flex items-center gap-2">
          <BellRing className="w-4 h-4 text-[#00BFA5]" />
          Recordatorios de pagos
        </h2>
        <p className="text-[12px] text-cc-secondary mt-1">
          Te avisamos de los gastos recurrentes de la próxima semana. También verás
          las alertas en la campana del encabezado.
        </p>
        <p className="text-[10px] text-cc-muted mt-2">{NOTIFICATION_PERMISSION_HINT}</p>
      </div>

      {!enabled ? (
        <button
          type="button"
          onClick={handleEnable}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#00BFA5] text-white font-bold text-[13px] disabled:opacity-60 flex items-center justify-center gap-2"
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
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#E0F2F1]">
            <span className="text-[13px] font-semibold text-[#00796B]">Activos</span>
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
                    ? 'bg-[#00BFA5] text-white font-bold'
                    : 'bg-[#F5F5F5] text-cc-secondary'
                }`}
              >
                Resumen el domingo o lunes
                <span className="block text-[10px] font-normal mt-0.5 opacity-90">
                  Lista todos los pagos de la próxima semana
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('day-before')}
                className={`text-left p-3 rounded-xl text-[12px] ${
                  mode === 'day-before'
                    ? 'bg-[#00BFA5] text-white font-bold'
                    : 'bg-[#F5F5F5] text-cc-secondary'
                }`}
              >
                Un día antes de cada pago
                <span className="block text-[10px] font-normal mt-0.5 opacity-90">
                  Aviso individual la víspera de cada gasto recurrente
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestNotification}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#F5F5F5] text-cc-primary font-bold text-[12px] disabled:opacity-60"
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
    </section>
  )
}
