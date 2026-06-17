import type { CategoryIconId } from '@/lib/finance/category-icons'

export const TASK_COLOR_PRESETS = [
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#EF4444',
  '#64748B',
] as const

export const TASK_ICON_OPTIONS: { id: CategoryIconId; label: string }[] = [
  { id: 'package', label: 'Tarea' },
  { id: 'home', label: 'Hogar' },
  { id: 'shopping-cart', label: 'Compras' },
  { id: 'utensils', label: 'Cocina' },
  { id: 'wrench', label: 'Reparar' },
  { id: 'sparkles', label: 'Limpieza' },
  { id: 'car', label: 'Auto' },
  { id: 'heart', label: 'Salud' },
  { id: 'briefcase', label: 'Trabajo' },
  { id: 'gift', label: 'Regalo' },
  { id: 'leaf', label: 'Jardín' },
  { id: 'dog', label: 'Mascota' },
]

export const DAY_HEADER_COLORS = [
  { bg: '#EEF2FF', text: '#4338CA', accent: '#6366F1' },
  { bg: '#FDF2F8', text: '#BE185D', accent: '#EC4899' },
  { bg: '#FFF7ED', text: '#C2410C', accent: '#F97316' },
  { bg: '#ECFDF5', text: '#047857', accent: '#10B981' },
  { bg: '#EFF6FF', text: '#1D4ED8', accent: '#3B82F6' },
  { bg: '#F5F3FF', text: '#6D28D9', accent: '#8B5CF6' },
  { bg: '#FEF2F2', text: '#B91C1C', accent: '#EF4444' },
]
