export const PRODUCTIVITY_CATEGORIES = new Set([
  'Trabajo',
  'Universidad',
  'Hogar',
  'Ejercicio',
])

export const LEISURE_CATEGORIES = new Set(['Ocio'])

export const EFFORT_CATEGORIES = new Set(['Trabajo', 'Universidad', 'Ejercicio'])

const MINUTES_PER_DAY = 24 * 60

export type CategoryMinutes = {
  name: string
  minutes: number
  color: string
}

export function sumCategoryMinutes(
  categories: Map<string, CategoryMinutes>,
  names: Set<string>
): number {
  let total = 0
  for (const [name, row] of categories) {
    if (names.has(name)) total += row.minutes
  }
  return total
}

export function mapToSortedCategories(
  map: Map<string, CategoryMinutes>
): CategoryMinutes[] {
  return [...map.values()].sort((a, b) => b.minutes - a.minutes)
}

export function taskEffortMinutes(
  estimatedMinutes: number | null,
  difficulty: number
): number {
  const base = estimatedMinutes ?? 30
  const mult = difficulty >= 3 ? 1.5 : difficulty <= 1 ? 0.8 : 1
  return Math.round(base * mult)
}

export function buildDaily24hSlices(
  weekCategories: CategoryMinutes[]
): CategoryMinutes[] {
  const daily = weekCategories.map(c => ({
    ...c,
    minutes: Math.round(c.minutes / 7),
  }))
  const tracked = daily.reduce((sum, c) => sum + c.minutes, 0)

  if (tracked <= 0) return []

  if (tracked > MINUTES_PER_DAY) {
    const scale = MINUTES_PER_DAY / tracked
    return daily
      .map(c => ({ ...c, minutes: Math.round(c.minutes * scale) }))
      .filter(c => c.minutes > 0)
  }

  const slices = daily.filter(c => c.minutes > 0)
  const gap = MINUTES_PER_DAY - tracked
  if (gap > 0) {
    slices.push({ name: 'Sin registrar', minutes: gap, color: '#94A3B8' })
  }
  return slices
}

export function percentOf(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}
