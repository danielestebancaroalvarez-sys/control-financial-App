'use client'

import { Bell, Zap } from 'lucide-react'
import type { PaymentMode } from '@/lib/finance/payment-mode'

export function PaymentModeSelector({
  value,
  onChange,
  scheduleType,
}: {
  value: PaymentMode
  onChange: (mode: PaymentMode) => void
  scheduleType: 'income' | 'expense'
}) {
  const isExpense = scheduleType === 'expense'

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-cc-secondary">
        {isExpense ? '¿Cómo se paga este gasto?' : '¿Cómo entra este ingreso?'}
      </p>
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => onChange('auto')}
          className={`flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition-all ${
            value === 'auto'
              ? 'border-[#00BFA5] bg-[#E0F2F1] dark:bg-[#1a3330] ring-2 ring-[#00BFA5]/25'
              : 'border-[var(--cc-border)] cc-surface-muted'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-[#00BFA5] text-white flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-cc-primary">Débito automático</p>
            <p className="text-[10px] text-cc-secondary mt-0.5">
              {isExpense
                ? 'Suscripciones y domiciliaciones: se marcan pagadas en la fecha programada.'
                : 'Ingreso recurrente: se registra solo en la fecha programada.'}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange('reminder')}
          className={`flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition-all ${
            value === 'reminder'
              ? 'border-[#F59E0B] bg-[#FFF8E1] dark:bg-[#3a3220] ring-2 ring-[#F59E0B]/25'
              : 'border-[var(--cc-border)] cc-surface-muted'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-cc-primary">Recordatorio de pago</p>
            <p className="text-[10px] text-cc-secondary mt-0.5">
              {isExpense
                ? 'Arriendo, transferencias manuales: te avisa y debes registrar el pago.'
                : 'Te recordamos y debes confirmar cuando recibas el ingreso.'}
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}

export function PaymentModeBadge({ autoRegister }: { autoRegister: boolean }) {
  if (autoRegister) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#E0F2F1] text-[#00796B] dark:bg-[#1a3330] dark:text-[#4db6ac]">
        <Zap className="w-3 h-3" />
        Automático
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#FFF8E1] text-[#B45309] dark:bg-[#3a3220] dark:text-[#F59E0B]">
      <Bell className="w-3 h-3" />
      Recordatorio
    </span>
  )
}
