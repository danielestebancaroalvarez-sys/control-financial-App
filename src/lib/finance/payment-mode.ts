import type { Category } from '@/lib/finance/types'

export type PaymentMode = 'auto' | 'reminder'

export type RecurringFrequency = 'weekly' | 'monthly'

export function autoRegisterToMode(autoRegister: boolean): PaymentMode {
  return autoRegister ? 'auto' : 'reminder'
}

export function modeToAutoRegister(mode: PaymentMode): boolean {
  return mode === 'auto'
}

export function defaultPaymentModeForCategory(
  category: Pick<Category, 'is_subscription' | 'name'> | null | undefined,
  scheduleType: 'income' | 'expense'
): PaymentMode {
  if (!category) return scheduleType === 'income' ? 'auto' : 'reminder'
  if (category.is_subscription) return 'auto'
  const name = category.name.toLowerCase()
  if (name.includes('arriendo') || name.includes('renta')) return 'reminder'
  if (scheduleType === 'income' && (name.includes('salario') || name.includes('sueldo'))) {
    return 'auto'
  }
  return 'reminder'
}
