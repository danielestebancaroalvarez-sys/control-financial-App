'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  buildPartnerExpenseNotification,
  PARTNER_LARGE_EXPENSE_THRESHOLD,
} from '@/lib/notifications/partner-activity'
import { appendInAppNotifications } from '@/lib/notifications/in-app-store'
import {
  isPaymentRemindersEnabled,
  showPaymentNotification,
} from '@/lib/notifications/reminder-preferences'
import type { CurrencyCode } from '@/lib/household/types'

const SEEN_KEY = 'couplecash_seen_partner_tx'
const PUSH_KEY = 'couplecash_partner_push_sent'

function getSeenSet(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function markSeen(id: string) {
  const seen = getSeenSet()
  seen.add(id)
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)))
}

function wasPushSent(id: string): boolean {
  try {
    return sessionStorage.getItem(`${PUSH_KEY}:${id}`) === '1'
  } catch {
    return false
  }
}

function markPushSent(id: string) {
  sessionStorage.setItem(`${PUSH_KEY}:${id}`, '1')
}

type TxRow = {
  id: string
  type: string
  created_by: string
  amount_base: number
  description: string
}

export function PartnerActivityWatcher({
  householdId,
  currentUserId,
  currency,
}: {
  householdId: string
  currentUserId: string
  currency: CurrencyCode
}) {
  const handling = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    async function handleInsert(row: TxRow) {
      if (handling.current) return
      if (!row?.id || row.type !== 'expense') return
      if (row.created_by === currentUserId) return
      if (Number(row.amount_base) < PARTNER_LARGE_EXPENSE_THRESHOLD) return
      if (getSeenSet().has(row.id)) return

      handling.current = true
      markSeen(row.id)

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', row.created_by)
          .maybeSingle()

        const authorName =
          profile?.full_name?.trim()?.split(/\s+/)[0] ?? 'Tu pareja'

        const notification = buildPartnerExpenseNotification({
          transactionId: row.id,
          authorName,
          description: row.description,
          amountBase: Number(row.amount_base),
          currency,
        })

        appendInAppNotifications([notification])

        if (
          isPaymentRemindersEnabled() &&
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted' &&
          !wasPushSent(row.id)
        ) {
          await showPaymentNotification({
            title: notification.title,
            body: notification.body,
            tag: notification.id,
            url: notification.href,
          })
          markPushSent(row.id)
        }
      } finally {
        handling.current = false
      }
    }

    const channel = supabase
      .channel(`partner-activity:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `household_id=eq.${householdId}`,
        },
        payload => {
          handleInsert(payload.new as TxRow)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, currentUserId, currency])

  return null
}
