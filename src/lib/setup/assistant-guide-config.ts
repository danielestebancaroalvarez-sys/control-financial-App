import type { AssistantModule } from './assistant-types'

export type GuideStepId =
  | 'profile'
  | 'period'
  | 'income'
  | 'fixed'
  | 'subscription'
  | 'savings'
  | 'sleep'
  | 'time_fixed'
  | 'task'
  | 'new'

export type GuideStepConfig = {
  id: GuideStepId
  module: AssistantModule
  stepIndex: number
  totalSteps: number
  title: string
  description: string
  hint?: string
}

export const GUIDE_STEPS: Record<GuideStepId, GuideStepConfig> = {
  profile: {
    id: 'profile',
    module: 'finance',
    stepIndex: 1,
    totalSteps: 5,
    title: 'Completa tu nombre de perfil',
    description: 'Edita tu nombre abajo para que tu pareja te identifique en la app.',
  },
  period: {
    id: 'period',
    module: 'finance',
    stepIndex: 2,
    totalSteps: 5,
    title: 'Elige vista semanal o mensual',
    description: 'Selecciona cómo quieres ver el dashboard y las predicciones.',
  },
  income: {
    id: 'income',
    module: 'finance',
    stepIndex: 3,
    totalSteps: 5,
    title: 'Registra tu ingreso fijo',
    description: 'En Nuevo registro elige Ingreso → Fijo y completa categoría, monto y frecuencia.',
  },
  fixed: {
    id: 'fixed',
    module: 'finance',
    stepIndex: 4,
    totalSteps: 5,
    title: 'Añade un gasto fijo',
    description: 'En Nuevo registro elige Gasto → Fijo y programa arriendo, servicios u otros pagos regulares.',
  },
  subscription: {
    id: 'subscription',
    module: 'finance',
    stepIndex: 5,
    totalSteps: 5,
    title: 'Registra una suscripción',
    description: 'En Nuevo registro elige Gasto y selecciona la categoría Suscripciones en el formulario.',
    hint: 'La categoría Suscripciones aparece preseleccionada en el selector.',
  },
  savings: {
    id: 'savings',
    module: 'finance',
    stepIndex: 5,
    totalSteps: 5,
    title: 'Crea una meta de ahorro',
    description: 'Opcional: define un objetivo y cuánto aportarás.',
  },
  sleep: {
    id: 'sleep',
    module: 'time',
    stepIndex: 2,
    totalSteps: 5,
    title: 'Registra o configura tu sueño',
    description: 'Elige Sueño y usa el registro rápido o añade un sueño manual.',
  },
  time_fixed: {
    id: 'time_fixed',
    module: 'time',
    stepIndex: 3,
    totalSteps: 5,
    title: 'Programa un tiempo fijo',
    description: 'Elige Tiempo → Bloque fijo para actividades que se repiten cada semana en tu horario.',
    hint: 'Ejemplo: trabajo, gym o tiempo de estudio con hora de inicio y fin.',
  },
  new: {
    id: 'new',
    module: 'time',
    stepIndex: 4,
    totalSteps: 5,
    title: 'Crea una actividad guardada',
    description: 'Plantillas reutilizables para tareas frecuentes del hogar.',
    hint: 'Pulsa "Nueva actividad" y guarda título y duración.',
  },
  task: {
    id: 'task',
    module: 'time',
    stepIndex: 5,
    totalSteps: 5,
    title: 'Crea tu primera tarea',
    description: 'Elige Tarea, asigna título, duración y opcionalmente a alguien del hogar.',
  },
}

export function parseGuideParam(
  value: string | null
): GuideStepConfig | null {
  if (!value) return null
  if (value in GUIDE_STEPS) {
    return GUIDE_STEPS[value as GuideStepId]
  }
  return null
}
