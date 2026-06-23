import type { TaskDifficulty } from './types'
import type { CategoryIconId } from '@/lib/finance/category-icons'

export type SuggestedActivityTemplate = {
  title: string
  estimatedMinutes: number
  difficulty: TaskDifficulty
  icon: CategoryIconId
  color: string
}

export const SUGGESTED_ACTIVITY_TEMPLATES: SuggestedActivityTemplate[] = [
  {
    title: 'Lavar baño',
    estimatedMinutes: 45,
    difficulty: 3,
    icon: 'sparkles',
    color: '#6366F1',
  },
  {
    title: 'Sacar basura',
    estimatedMinutes: 10,
    difficulty: 1,
    icon: 'package',
    color: '#4CAF50',
  },
  {
    title: 'Planchar',
    estimatedMinutes: 30,
    difficulty: 2,
    icon: 'home',
    color: '#FF9800',
  },
  {
    title: 'Limpiar cocina',
    estimatedMinutes: 25,
    difficulty: 2,
    icon: 'utensils',
    color: '#8B5CF6',
  },
  {
    title: 'Aspirar',
    estimatedMinutes: 20,
    difficulty: 2,
    icon: 'home',
    color: '#0EA5E9',
  },
]
