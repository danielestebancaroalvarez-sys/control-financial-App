import type { GuideStepId } from './assistant-guide-config'

export type GuideStepTheme = {
  accent: string
  accentLight: string
  gradient: string
  border: string
  glow: string
}

/** Colores por tipo de paso (ingreso verde, gasto rojizo, ahorro ámbar, tiempo índigo…) */
export const GUIDE_STEP_THEMES: Record<GuideStepId, GuideStepTheme> = {
  profile: {
    accent: '#5C6BC0',
    accentLight: '#E8EAF6',
    gradient: 'linear-gradient(135deg, #5C6BC0 0%, #7986CB 100%)',
    border: '#5C6BC040',
    glow: '0 12px 40px rgba(92, 107, 192, 0.35)',
  },
  period: {
    accent: '#00BFA5',
    accentLight: '#E0F2F1',
    gradient: 'linear-gradient(135deg, #00BFA5 0%, #2DD4BF 100%)',
    border: '#00BFA550',
    glow: '0 12px 40px rgba(0, 191, 165, 0.35)',
  },
  income: {
    accent: '#00BFA5',
    accentLight: '#E0F2F1',
    gradient: 'linear-gradient(135deg, #00BFA5 0%, #2DD4BF 100%)',
    border: '#00BFA560',
    glow: '0 12px 40px rgba(0, 191, 165, 0.4)',
  },
  fixed: {
    accent: '#D4737E',
    accentLight: '#FCE4EC',
    gradient: 'linear-gradient(135deg, #D4737E 0%, #EC4899 100%)',
    border: '#EC489950',
    glow: '0 12px 40px rgba(236, 72, 153, 0.35)',
  },
  subscription: {
    accent: '#7E57C2',
    accentLight: '#EDE7F6',
    gradient: 'linear-gradient(135deg, #7E57C2 0%, #9575CD 100%)',
    border: '#7E57C250',
    glow: '0 12px 40px rgba(126, 87, 194, 0.35)',
  },
  savings: {
    accent: '#F59E0B',
    accentLight: '#FFF8E1',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    border: '#F59E0B60',
    glow: '0 12px 40px rgba(245, 158, 11, 0.4)',
  },
  sleep: {
    accent: '#4F46E5',
    accentLight: '#E0E7FF',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
    border: '#4F46E550',
    glow: '0 12px 40px rgba(79, 70, 229, 0.35)',
  },
  task: {
    accent: '#6366F1',
    accentLight: '#EEF2FF',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    border: '#6366F150',
    glow: '0 12px 40px rgba(99, 102, 241, 0.35)',
  },
  new: {
    accent: '#8B5CF6',
    accentLight: '#F3E8FF',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    border: '#8B5CF650',
    glow: '0 12px 40px rgba(139, 92, 246, 0.35)',
  },
}

const ASSISTANT_STEP_ID_MAP: Record<string, GuideStepId> = {
  profile: 'profile',
  period: 'period',
  income: 'income',
  fixed_expense: 'fixed',
  subscription: 'subscription',
  savings: 'savings',
  sleep: 'sleep',
  first_task: 'task',
  activity: 'new',
}

export function getGuideStepTheme(stepId: string): GuideStepTheme {
  const key = ASSISTANT_STEP_ID_MAP[stepId] ?? (stepId as GuideStepId)
  return GUIDE_STEP_THEMES[key] ?? GUIDE_STEP_THEMES.profile
}
