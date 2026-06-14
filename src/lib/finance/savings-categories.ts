import type { CategoryIconId } from './category-icons'

export type SavingsCategoryId =
  | 'emergency'
  | 'vacation'
  | 'home'
  | 'retirement'
  | 'education'
  | 'vehicle'
  | 'baby'
  | 'wedding'
  | 'investment'
  | 'other'

export type SavingsCategoryOption = {
  id: SavingsCategoryId
  label: string
  icon: CategoryIconId
  color: string
}

export const SAVINGS_CATEGORY_OPTIONS: SavingsCategoryOption[] = [
  { id: 'emergency', label: 'Fondo de emergencia', icon: 'piggy-bank', color: '#00BFA5' },
  { id: 'vacation', label: 'Vacaciones', icon: 'plane', color: '#2DD4BF' },
  { id: 'home', label: 'Casa / hogar', icon: 'home', color: '#F59E0B' },
  { id: 'retirement', label: 'Retiro', icon: 'banknote', color: '#7E57C2' },
  { id: 'education', label: 'Educación', icon: 'book-open', color: '#636E72' },
  { id: 'vehicle', label: 'Vehículo', icon: 'car', color: '#FF8A65' },
  { id: 'baby', label: 'Bebé / familia', icon: 'baby', color: '#EC4899' },
  { id: 'wedding', label: 'Boda / evento', icon: 'gift', color: '#F472B6' },
  { id: 'investment', label: 'Inversión', icon: 'building-2', color: '#81D4FA' },
  { id: 'other', label: 'Otro', icon: 'tag', color: '#B2BEC3' },
]

export const DEFAULT_SAVINGS_CATEGORY: SavingsCategoryOption =
  SAVINGS_CATEGORY_OPTIONS[0]

export function getSavingsCategory(
  id: string | null | undefined
): SavingsCategoryOption {
  return (
    SAVINGS_CATEGORY_OPTIONS.find(c => c.id === id) ?? DEFAULT_SAVINGS_CATEGORY
  )
}

export function isValidSavingsCategoryId(
  id: string | null | undefined
): id is SavingsCategoryId {
  return SAVINGS_CATEGORY_OPTIONS.some(c => c.id === id)
}
