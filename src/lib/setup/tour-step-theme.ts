import type { SetupStepId } from './assistant-types'

export type TourStepTheme = {
  accent: string
  accentLight: string
  accentLightDark: string
  gradient: string
  border: string
  glow: string
}

export type ResolvedTourStepTheme = TourStepTheme & {
  surfaceBg: string
}

export const TOUR_STEP_THEMES: Record<SetupStepId, TourStepTheme> = {
  income: {
    accent: '#00BFA5',
    accentLight: '#E0F2F1',
    accentLightDark: '#1a3330',
    gradient: 'linear-gradient(135deg, #00BFA5 0%, #2DD4BF 100%)',
    border: '#00BFA560',
    glow: '0 12px 40px rgba(0, 191, 165, 0.4)',
  },
  fixed_expense: {
    accent: '#D4737E',
    accentLight: '#FCE4EC',
    accentLightDark: '#3a2228',
    gradient: 'linear-gradient(135deg, #D4737E 0%, #EC4899 100%)',
    border: '#EC489950',
    glow: '0 12px 40px rgba(236, 72, 153, 0.35)',
  },
  subscription: {
    accent: '#7E57C2',
    accentLight: '#EDE7F6',
    accentLightDark: '#2d2640',
    gradient: 'linear-gradient(135deg, #7E57C2 0%, #9575CD 100%)',
    border: '#7E57C250',
    glow: '0 12px 40px rgba(126, 87, 194, 0.35)',
  },
  savings: {
    accent: '#F59E0B',
    accentLight: '#FFF8E1',
    accentLightDark: '#3a3220',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    border: '#F59E0B60',
    glow: '0 12px 40px rgba(245, 158, 11, 0.4)',
  },
  receipt_scan: {
    accent: '#00BFA5',
    accentLight: '#E0F2F1',
    accentLightDark: '#1a3330',
    gradient: 'linear-gradient(135deg, #00BFA5 0%, #2DD4BF 100%)',
    border: '#00BFA550',
    glow: '0 12px 40px rgba(0, 191, 165, 0.35)',
  },
  sleep: {
    accent: '#4F46E5',
    accentLight: '#E0E7FF',
    accentLightDark: '#1e1b4b',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
    border: '#4F46E550',
    glow: '0 12px 40px rgba(79, 70, 229, 0.35)',
  },
  fixed_time: {
    accent: '#6366F1',
    accentLight: '#EEF2FF',
    accentLightDark: '#1e1b4b',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    border: '#6366F150',
    glow: '0 12px 40px rgba(99, 102, 241, 0.35)',
  },
  activity: {
    accent: '#8B5CF6',
    accentLight: '#F3E8FF',
    accentLightDark: '#2d2640',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    border: '#8B5CF650',
    glow: '0 12px 40px rgba(139, 92, 246, 0.35)',
  },
  first_task: {
    accent: '#6366F1',
    accentLight: '#EEF2FF',
    accentLightDark: '#1e1b4b',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    border: '#6366F150',
    glow: '0 12px 40px rgba(99, 102, 241, 0.35)',
  },
}

const DEFAULT_THEME = TOUR_STEP_THEMES.income

export function getTourStepTheme(stepId: string): TourStepTheme {
  const key = stepId as SetupStepId
  return TOUR_STEP_THEMES[key] ?? DEFAULT_THEME
}

export function resolveTourStepTheme(
  stepId: string,
  isDark: boolean
): ResolvedTourStepTheme {
  const theme = getTourStepTheme(stepId)
  return {
    ...theme,
    surfaceBg: isDark ? theme.accentLightDark : theme.accentLight,
  }
}

export const SAVINGS_ACCENT = TOUR_STEP_THEMES.savings.accent
