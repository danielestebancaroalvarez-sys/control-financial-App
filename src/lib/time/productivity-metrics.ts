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

/** Puntuación 0–100 por persona en el periodo semanal. */
export function calculateProductivityScore(input: {
  productivityPercent: number
  leisurePercent: number
  effortMinutes: number
  totalMinutes: number
  sleepMinutes: number
  doneTasks: number
  goalProgressPercent: number
}): number {
  const effortScore = Math.min(100, (input.effortMinutes / (35 * 60)) * 100)
  const sleepDaily = input.sleepMinutes / 7
  const sleepScore =
    sleepDaily >= 420 && sleepDaily <= 540 ? 100 : sleepDaily >= 300 ? 70 : sleepDaily > 0 ? 50 : 40
  const taskBonus = Math.min(15, input.doneTasks * 5)
  const leisurePenalty = Math.min(20, input.leisurePercent * 0.35)
  const trackingBonus = input.totalMinutes >= 20 * 60 ? 5 : 0

  const raw =
    input.productivityPercent * 0.4 +
    effortScore * 0.2 +
    sleepScore * 0.1 +
    input.goalProgressPercent * 0.15 +
    taskBonus +
    trackingBonus -
    leisurePenalty

  return Math.max(0, Math.min(100, Math.round(raw)))
}

export function productivityScoreLabel(score: number): string {
  if (score >= 85) return 'Excelente'
  if (score >= 70) return 'Muy bien'
  if (score >= 55) return 'Bien'
  if (score >= 40) return 'Regular'
  return 'Bajo'
}
