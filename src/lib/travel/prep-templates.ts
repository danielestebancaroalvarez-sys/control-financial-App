import type { CreatePrepStepInput, TripPrepCategory, TripPrepStepType } from './types'

type PrepTemplate = {
  title: string
  category: TripPrepCategory
  stepType: TripPrepStepType
  daysBeforeStart: number
}

const DEFAULT_PREP_TEMPLATES: PrepTemplate[] = [
  {
    title: 'Investigar vuelos y fechas',
    category: 'research',
    stepType: 'milestone',
    daysBeforeStart: 90,
  },
  {
    title: 'Reservar vuelos',
    category: 'booking',
    stepType: 'milestone',
    daysBeforeStart: 75,
  },
  {
    title: 'Reservar alojamiento',
    category: 'booking',
    stepType: 'milestone',
    daysBeforeStart: 60,
  },
  {
    title: 'Contratar seguro de viaje',
    category: 'booking',
    stepType: 'action',
    daysBeforeStart: 45,
  },
  {
    title: 'Revisar documentos y visa',
    category: 'visa',
    stepType: 'milestone',
    daysBeforeStart: 60,
  },
  {
    title: 'Definir presupuesto de gastos diarios',
    category: 'payment',
    stepType: 'action',
    daysBeforeStart: 30,
  },
  {
    title: 'Armar itinerario día a día',
    category: 'research',
    stepType: 'action',
    daysBeforeStart: 21,
  },
  {
    title: 'Hacer maletas',
    category: 'packing',
    stepType: 'action',
    daysBeforeStart: 3,
  },
]

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function buildDefaultPrepSteps(
  tripId: string,
  householdId: string,
  startDate: string
): Omit<CreatePrepStepInput, 'assignedTo'>[] {
  return DEFAULT_PREP_TEMPLATES.map((tpl, index) => ({
    tripId,
    householdId,
    title: tpl.title,
    stepType: tpl.stepType,
    category: tpl.category,
    dueDate: subtractDays(startDate, tpl.daysBeforeStart),
    stepOrder: index,
  })) as Omit<CreatePrepStepInput, 'assignedTo'>[]
}

export const BUDGET_CATEGORY_LABELS: Record<string, string> = {
  flights: 'Vuelos',
  hotels: 'Hoteles',
  transport: 'Transporte',
  insurance: 'Seguro',
  visas: 'Visas',
  activities: 'Actividades',
  food: 'Comida',
  shopping: 'Compras',
  other: 'Otros',
}

export const DAILY_CATEGORY_LABELS: Record<string, string> = {
  food: 'Comida diaria',
  local_transport: 'Transporte local',
  activities: 'Actividades',
  misc: 'Varios',
}

export const TRIP_STATUS_LABELS: Record<string, string> = {
  planning: 'Planificando',
  saving: 'Ahorrando',
  booked: 'Reservado',
  in_progress: 'En viaje',
  completed: 'Completado',
  cancelled: 'Cancelado',
}
