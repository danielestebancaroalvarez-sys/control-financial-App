import type { DriveStep } from 'driver.js'
import type { FinanceStepId } from './assistant-types'

export type TourStepId =
  | 'income-fixed'
  | 'expense-fixed'
  | 'subscription'
  | 'savings'
  | 'receipt-scan'

const TOUR_IDS: TourStepId[] = [
  'income-fixed',
  'expense-fixed',
  'subscription',
  'savings',
  'receipt-scan',
]

export function parseTourParam(value: string | null): TourStepId | null {
  if (!value) return null
  return TOUR_IDS.includes(value as TourStepId) ? (value as TourStepId) : null
}

export function tourIdForFinanceStep(stepId: FinanceStepId): TourStepId {
  const map: Record<FinanceStepId, TourStepId> = {
    income: 'income-fixed',
    fixed_expense: 'expense-fixed',
    subscription: 'subscription',
    savings: 'savings',
    receipt_scan: 'receipt-scan',
  }
  return map[stepId]
}

export function financeStepForTourId(tourId: TourStepId): FinanceStepId {
  const map: Record<TourStepId, FinanceStepId> = {
    'income-fixed': 'income',
    'expense-fixed': 'fixed_expense',
    subscription: 'subscription',
    savings: 'savings',
    'receipt-scan': 'receipt_scan',
  }
  return map[tourId]
}

export function getTourDriverSteps(tourId: TourStepId): DriveStep[] {
  switch (tourId) {
    case 'income-fixed':
      return [
        {
          element: '[data-tour="tx-income"]',
          popover: {
            title: 'Ingreso',
            description:
              'Empieza eligiendo Ingreso para registrar dinero que entra al hogar.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="mode-fixed"]',
          popover: {
            title: 'Ingreso fijo',
            description:
              'Los salarios y rentas van como ingreso recurrente (fijo).',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="fixed-form"]',
          popover: {
            title: 'Completa y guarda',
            description:
              'Indica categoría, monto y frecuencia. Luego pulsa Guardar.',
            side: 'top',
            align: 'center',
          },
        },
      ]
    case 'expense-fixed':
      return [
        {
          element: '[data-tour="tx-expense"]',
          popover: {
            title: 'Gasto',
            description: 'Elige Gasto para registrar dinero que sale.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="mode-fixed"]',
          popover: {
            title: 'Gasto fijo',
            description:
              'Arriendo, servicios y otros pagos regulares van como gasto fijo.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="fixed-form"]',
          popover: {
            title: 'Programa el pago',
            description:
              'Completa categoría, monto y frecuencia, luego guarda.',
            side: 'top',
            align: 'center',
          },
        },
      ]
    case 'subscription':
      return [
        {
          element: '[data-tour="tx-expense"]',
          popover: {
            title: 'Gasto',
            description: 'Las suscripciones son gastos fijos recurrentes.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="mode-fixed"]',
          popover: {
            title: 'Fijo',
            description: 'Netflix, Spotify y similares se programan como fijo.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="category-picker"]',
          popover: {
            title: 'Categoría Suscripciones',
            description:
              'Usa la categoría Suscripciones (ya preseleccionada).',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="submit-fixed"]',
          popover: {
            title: 'Guardar suscripción',
            description: 'Indica monto y frecuencia mensual, luego guarda.',
            side: 'top',
            align: 'center',
          },
        },
      ]
    case 'savings':
      return [
        {
          element: '[data-tour="new-savings-goal"]',
          popover: {
            title: 'Meta de ahorro',
            description:
              'Pulsa aquí para crear tu primera meta: vacaciones, emergencia, etc.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '[data-tour="savings-form"]',
          popover: {
            title: 'Define la meta',
            description:
              'Nombre, monto objetivo y cuánto aportarás. Guarda al terminar.',
            side: 'top',
            align: 'center',
          },
        },
      ]
    case 'receipt-scan':
      return [
        {
          element: '[data-tour="tx-expense"]',
          popover: {
            title: 'Gasto puntual',
            description: 'Los recibos de supermercado son gastos puntuales.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="mode-variable"]',
          popover: {
            title: 'Puntual',
            description: 'Elige Puntual para un gasto de una sola vez.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="category-picker"]',
          popover: {
            title: 'Categoría Mercado',
            description: 'Selecciona Mercado para habilitar el escaneo.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="receipt-scanner"]',
          popover: {
            title: 'Escanear recibo',
            description:
              'Toma una foto del recibo: la IA extrae productos y el total.',
            side: 'top',
            align: 'center',
          },
        },
      ]
    default:
      return []
  }
}
