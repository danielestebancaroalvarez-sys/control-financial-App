'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Bell, CalendarClock, X } from 'lucide-react'
import { getInAppNotifications } from '@/lib/notifications/reminder-actions'
import type { InAppNotification } from '@/lib/notifications/build-notifications'
import {
  getUnreadCount,
  getStoredNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  syncInAppNotifications,
} from '@/lib/notifications/in-app-store'

function NotificationIcon({ type }: { type: InAppNotification['type'] }) {
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
  onClose,
  onRead,
  onReadAll,
}: {
  notifications: InAppNotification[]
  loading: boolean
  unread: number
  onClose: () => void
  onRead: (id: string) => void
  onReadAll: () => void
}) {
  return (
    <div className="w-full max-w-md rounded-[20px] bg-white border border-[#EEEEEE] shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0]">
        <div>
          <p className="text-[14px] font-bold text-[#2D3436]">Notificaciones</p>
          <p className="text-[10px] text-[#636E72]">Pagos recurrentes próximos</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {unread > 0 && (
            <button
              type="button"
              onClick={onReadAll}
              className="text-[10px] font-bold text-[#00BFA5]"
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
            <X className="w-3.5 h-3.5 text-[#636E72]" />
          </button>
        </div>
      </div>

      <div className="max-h-[min(20rem,50vh)] overflow-y-auto overscroll-contain">
        {loading && notifications.length === 0 ? (
          <p className="text-[13px] text-[#636E72] text-center py-8">Cargando...</p>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="w-8 h-8 text-[#B2BEC3] mx-auto mb-2" />
            <p className="text-[13px] text-[#636E72]">
              No hay pagos programados para la próxima semana.
            </p>
            <Link
              href="/nuevo"
              onClick={onClose}
              className="inline-block mt-3 text-[12px] font-bold text-[#00BFA5]"
            >
              Crear gasto recurrente
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
                  <NotificationIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#2D3436] leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#636E72] mt-0.5 line-clamp-2">
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
            href="/predicciones"
            onClick={onClose}
            className="text-[12px] font-bold text-[#00BFA5]"
          >
            Ver radar de pagos →
          </Link>
        </div>
      )}
    </div>
  )
}

export function NotificationInbox() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const incoming = await getInAppNotifications()
      syncInAppNotifications(incoming)
      setNotifications(incoming)
      setUnread(getUnreadCount())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    refresh()
    const interval = window.setInterval(refresh, 5 * 60 * 1000)
    const onUpdated = () => {
      setNotifications(getStoredNotifications())
      setUnread(getUnreadCount())
    }
    window.addEventListener('couplecash-notifications-updated', onUpdated)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('couplecash-notifications-updated', onUpdated)
    }
  }, [refresh])

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
    markNotificationRead(id)
    setUnread(getUnreadCount())
  }

  function handleReadAll() {
    markAllNotificationsRead()
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
          onClose={() => setOpen(false)}
          onRead={handleRead}
          onReadAll={handleReadAll}
        />
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="relative w-10 h-10 rounded-full bg-white/80 border border-white/70 shadow-sm flex items-center justify-center text-[#636E72] hover:text-[#00BFA5] transition-colors shrink-0"
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EC4899] text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  )
}
