import type { DriveStep } from 'driver.js'
import type { FinanceStepId, TimeStepId } from './assistant-types'

export type FinanceTourStepId =
  | 'income-fixed'
  | 'expense-fixed'
  | 'subscription'
  | 'savings'
  | 'receipt-scan'

export type TimeTourStepId = 'sleep' | 'time-fixed' | 'activity' | 'task'

export type TourStepId = FinanceTourStepId | TimeTourStepId

const FINANCE_TOUR_IDS: FinanceTourStepId[] = [
  'income-fixed',
  'expense-fixed',
  'subscription',
  'savings',
  'receipt-scan',
]

const TIME_TOUR_IDS: TimeTourStepId[] = ['sleep', 'time-fixed', 'activity', 'task']

export function parseTourParam(value: string | null): TourStepId | null {
  if (!value) return null
  if (FINANCE_TOUR_IDS.includes(value as FinanceTourStepId)) {
    return value as FinanceTourStepId
  }
  if (TIME_TOUR_IDS.includes(value as TimeTourStepId)) {
    return value as TimeTourStepId
  }
  return null
}

export function isTimeTour(tourId: TourStepId): tourId is TimeTourStepId {
  return TIME_TOUR_IDS.includes(tourId as TimeTourStepId)
}

export function tourIdForFinanceStep(stepId: FinanceStepId): FinanceTourStepId {
  const map: Record<FinanceStepId, FinanceTourStepId> = {
    income: 'income-fixed',
    fixed_expense: 'expense-fixed',
    subscription: 'subscription',
    savings: 'savings',
    receipt_scan: 'receipt-scan',
  }
  return map[stepId]
}

export function tourIdForTimeStep(stepId: TimeStepId): TimeTourStepId {
  const map: Record<TimeStepId, TimeTourStepId> = {
    sleep: 'sleep',
    fixed_time: 'time-fixed',
    activity: 'activity',
    first_task: 'task',
  }
  return map[stepId]
}

export function getTourDriverSteps(tourId: TourStepId): DriveStep[] {
  if (isTimeTour(tourId)) {
    return getTimeTourDriverSteps(tourId)
  }
  return getFinanceTourDriverSteps(tourId)
}

function getFinanceTourDriverSteps(tourId: FinanceTourStepId): DriveStep[] {
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

function getTimeTourDriverSteps(tourId: TimeTourStepId): DriveStep[] {
  switch (tourId) {
    case 'sleep':
      return [
        {
          element: '[data-tour="kind-sleep"]',
          popover: {
            title: 'Sueño',
            description: 'Elige Sueño para registrar cuándo dormiste.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="sleep-tracker"]',
          popover: {
            title: 'Registra tu sueño',
            description:
              'Pulsa "Estoy durmiendo" al acostarte o usa el registro manual con horas de inicio y fin.',
            side: 'top',
            align: 'center',
          },
        },
      ]
    case 'time-fixed':
      return [
        {
          element: '[data-tour="kind-time"]',
          popover: {
            title: 'Tiempo',
            description: 'Registra bloques de trabajo, estudio u otras actividades.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="nature-fixed"]',
          popover: {
            title: 'Bloque fijo',
            description:
              'Programa actividades que se repiten cada semana en tu horario.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="time-category-picker"]',
          popover: {
            title: 'Categoría',
            description: 'Elige el área: trabajo, hogar, ejercicio, etc.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="time-form"]',
          popover: {
            title: 'Horario y guardar',
            description:
              'Indica nombre, hora de inicio y fin, luego guarda el bloque.',
            side: 'top',
            align: 'center',
          },
        },
      ]
    case 'activity':
      return [
        {
          element: '[data-tour="new-activity"]',
          popover: {
            title: 'Nueva actividad',
            description:
              'Las actividades guardadas reutilizan título y duración en tareas futuras.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '[data-tour="activity-form"]',
          popover: {
            title: 'Define la actividad',
            description:
              'Nombre, duración y dificultad. Guarda para usarla en tareas.',
            side: 'top',
            align: 'center',
          },
        },
      ]
    case 'task':
      return [
        {
          element: '[data-tour="kind-task"]',
          popover: {
            title: 'Tarea',
            description: 'Crea una tarea del hogar para ti o tu pareja.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="time-form"]',
          popover: {
            title: 'Detalles de la tarea',
            description:
              'Nombre, duración estimada y opcionalmente fecha límite. Luego guarda.',
            side: 'top',
            align: 'center',
          },
        },
      ]
    default:
      return []
  }
}
