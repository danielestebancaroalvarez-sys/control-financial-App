import type { AssistantModule } from './assistant-types'

export type GuideStepId =
  | 'profile'
  | 'period'
  | 'income'
  | 'fixed'
  | 'subscription'
  | 'savings'
  | 'sleep'
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
    description: 'Completa el formulario con categoría, monto, frecuencia y modo de pago.',
    hint: 'Al continuar verás Ingreso + Fijo ya seleccionados. Completa el formulario abajo.',
  },
  fixed: {
    id: 'fixed',
    module: 'finance',
    stepIndex: 4,
    totalSteps: 5,
    title: 'Añade un gasto fijo',
    description: 'Arriendo, servicios u otros pagos regulares del hogar.',
    hint: 'Al continuar verás Gasto + Fijo seleccionados. Elige categoría y monto.',
  },
  subscription: {
    id: 'subscription',
    module: 'finance',
    stepIndex: 5,
    totalSteps: 5,
    title: 'Registra una suscripción',
    description: 'Netflix, Spotify y otros débitos automáticos.',
    hint: 'Al continuar verás Suscripción + Fijo en morado. Categoría Suscripciones preseleccionada.',
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
    totalSteps: 4,
    title: 'Registra o configura tu sueño',
    description: 'Usa el registro rápido o añade un sueño manual.',
  },
  task: {
    id: 'task',
    module: 'time',
    stepIndex: 4,
    totalSteps: 4,
    title: 'Crea tu primera tarea',
    description: 'Asigna título, duración y opcionalmente a alguien del hogar.',
    hint: 'El tipo Tarea ya está seleccionado.',
  },
  new: {
    id: 'new',
    module: 'time',
    stepIndex: 3,
    totalSteps: 4,
    title: 'Crea una actividad guardada',
    description: 'Plantillas reutilizables para tareas frecuentes del hogar.',
    hint: 'Pulsa "Nueva actividad" y guarda título y duración.',
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
