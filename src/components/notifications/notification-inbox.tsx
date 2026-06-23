'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Bell, CalendarClock, CheckSquare, Sparkles, Target, Users, X } from 'lucide-react'
import {
  getFinanceInAppNotifications,
  getTimeInAppNotifications,
} from '@/lib/notifications/reminder-actions'
import type { InAppNotification, NotificationModule } from '@/lib/notifications/build-notifications'
import {
  getUnreadCount,
  getStoredNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  clearAllNotifications,
  syncInAppNotifications,
} from '@/lib/notifications/in-app-store'

function NotificationIcon({
  type,
  module,
}: {
  type: InAppNotification['type']
  module: NotificationModule
}) {
  if (type === 'setup-guide') {
    const setupAccent =
      module === 'time' ? '#6366F1' : module === 'travel' ? '#0EA5E9' : '#00BFA5'
    return (
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${setupAccent}22`, color: setupAccent }}
      >
        <Sparkles className="w-4 h-4" />
      </div>
    )
  }

  if (type === 'partner-expense') {
    return (
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#E8EAF6] text-[#5C6BC0] dark:bg-[#2a2d42] dark:text-[#9fa8da]">
        <Users className="w-4 h-4" />
      </div>
    )
  }

  if (module === 'time') {
    const isGoal = type === 'goal-milestone'
    return (
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isGoal ? 'bg-[#EDE9FE] text-[#6366F1]' : 'bg-[#DBEAFE] text-[#2563EB]'
        }`}
      >
        {isGoal ? <Target className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
      </div>
    )
  }

  return (
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        type === 'payment-tomorrow'
          ? 'bg-[#FCE4EC] text-[#EC4899]'
          : type === 'weekly-summary'
            ? 'bg-[#E0F2F1] text-[#00BFA5]'
            : 'bg-[#FFF8E1] text-[#F59E0B]'
      }`}
    >
      <CalendarClock className="w-4 h-4" />
    </div>
  )
}

function NotificationPanel({
  notifications,
  loading,
  unread,
  module,
  onClose,
  onRead,
  onReadAll,
  onClearAll,
}: {
  notifications: InAppNotification[]
  loading: boolean
  unread: number
  module: NotificationModule
  onClose: () => void
  onRead: (id: string) => void
  onReadAll: () => void
  onClearAll: () => void
}) {
  const isTime = module === 'time'
  const isTravel = module === 'travel'
  const accent = isTravel ? '#0EA5E9' : isTime ? '#6366F1' : '#00BFA5'
  const emptyHref = isTravel ? '/viajes/nuevo' : isTime ? '/tiempo/nuevo' : '/nuevo'
  const emptyCta = isTravel
    ? 'Planificar un viaje'
    : isTime
      ? 'Crear tarea o actividad'
      : 'Crear gasto recurrente'
  const footerHref = isTravel
    ? '/viajes/preparacion'
    : isTime
      ? '/tiempo/tareas'
      : '/predicciones'
  const footerLabel = isTravel
    ? 'Ver preparación →'
    : isTime
      ? 'Ver tareas →'
      : 'Ver radar de pagos →'

  return (
    <div className="w-full max-w-md rounded-[20px] cc-surface-solid border border-[#EEEEEE] shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0]">
        <div>
          <p className="text-[14px] font-bold text-cc-primary">Notificaciones</p>
          <p className="text-[10px] text-cc-secondary">
            {isTravel
              ? 'Pasos de viaje y recordatorios'
              : isTime
                ? 'Tareas, hitos y actividades'
                : 'Pagos y actividad de tu pareja'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[10px] font-semibold text-cc-muted hover:text-cc-primary"
            >
              Limpiar
            </button>
          )}
          {unread > 0 && (
            <button
              type="button"
              onClick={onReadAll}
              className="text-[10px] font-bold"
              style={{ color: accent }}
            >
              Marcar leídas
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-3.5 h-3.5 text-cc-secondary" />
          </button>
        </div>
      </div>

      <div className="max-h-[min(20rem,50vh)] overflow-y-auto overscroll-contain">
        {loading && notifications.length === 0 ? (
          <p className="text-[13px] text-cc-secondary text-center py-8">Cargando...</p>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="w-8 h-8 text-cc-muted mx-auto mb-2" />
            <p className="text-[13px] text-cc-secondary">
              {isTime
                ? 'No hay tareas ni hitos pendientes esta semana.'
                : 'No hay pagos programados para la próxima semana.'}
            </p>
            <Link
              href={emptyHref}
              onClick={onClose}
              className="inline-block mt-3 text-[12px] font-bold"
              style={{ color: accent }}
            >
              {emptyCta}
            </Link>
          </div>
        ) : (
          <ul>
            {notifications.map(item => (
              <li key={item.id} className="border-b border-[#F5F5F5] last:border-0">
                <Link
                  href={item.href}
                  onClick={() => {
                    onRead(item.id)
                    onClose()
                  }}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[#FAFAFA] transition-colors"
                >
                  <NotificationIcon type={item.type} module={item.module} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-cc-primary leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-cc-secondary mt-0.5 line-clamp-2">
                      {item.body}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-[#F0F0F0] bg-[#FAFAFA]">
          <Link
            href={footerHref}
            onClick={onClose}
            className="text-[12px] font-bold"
            style={{ color: accent }}
          >
            {footerLabel}
          </Link>
        </div>
      )}
    </div>
  )
}

export function NotificationInbox({ module }: { module: NotificationModule }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const accent =
    module === 'travel' ? '#0EA5E9' : module === 'time' ? '#6366F1' : '#00BFA5'
  const badgeColor =
    module === 'travel' ? '#0EA5E9' : module === 'time' ? '#6366F1' : '#EC4899'

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const incoming =
        module === 'time'
          ? await getTimeInAppNotifications()
          : module === 'travel'
            ? []
            : await getFinanceInAppNotifications()
      syncInAppNotifications(incoming, module)
      setNotifications(incoming)
      setUnread(getUnreadCount(module))
    } finally {
      setLoading(false)
    }
  }, [module])

  useEffect(() => {
    setMounted(true)
    refresh()
    const interval = window.setInterval(refresh, 5 * 60 * 1000)
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ module?: NotificationModule }>).detail
      if (detail?.module && detail.module !== module) return
      setNotifications(getStoredNotifications(module))
      setUnread(getUnreadCount(module))
    }
    window.addEventListener('couplecash-notifications-updated', onUpdated)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('couplecash-notifications-updated', onUpdated)
    }
  }, [refresh, module])

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  function handleOpen() {
    setOpen(prev => !prev)
    if (!open) refresh()
  }

  function handleRead(id: string) {
    markNotificationRead(id, module)
    setUnread(getUnreadCount(module))
  }

  function handleReadAll() {
    markAllNotificationsRead(module)
    setUnread(0)
  }

  function handleClearAll() {
    clearAllNotifications(module)
    setNotifications([])
    setUnread(0)
  }

  const panel = open ? (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[max(4.5rem,env(safe-area-inset-top)+3.5rem)]">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Cerrar notificaciones"
        onClick={() => setOpen(false)}
      />
      <div ref={panelRef} className="relative w-full max-w-md z-10">
        <NotificationPanel
          notifications={notifications}
          loading={loading}
          unread={unread}
          module={module}
          onClose={() => setOpen(false)}
          onRead={handleRead}
          onReadAll={handleReadAll}
          onClearAll={handleClearAll}
        />
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="relative w-10 h-10 rounded-full bg-white/80 border border-white/70 shadow-sm flex items-center justify-center text-cc-secondary transition-colors shrink-0"
        style={{ ['--hover-accent' as string]: accent }}
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
            style={{ backgroundColor: badgeColor }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  )
}
