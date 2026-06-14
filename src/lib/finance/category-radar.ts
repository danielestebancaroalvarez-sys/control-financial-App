import type { Category } from './types'

export type CategoryRadarKind = 'service' | 'subscription' | 'shopping' | 'other'

export function getCategoryRadarKind(
  category: Pick<Category, 'name' | 'is_fixed' | 'is_subscription'> | null | undefined
): CategoryRadarKind {
  if (!category) return 'other'
  if (category.is_fixed) return 'service'
  if (category.is_subscription) return 'subscription'
  if (category.name === 'Mercado') return 'shopping'
  return 'other'
}

export function parseLineItems(raw: unknown): { name: string; price: number }[] | null {
  if (!raw || !Array.isArray(raw)) return null
  const items = raw
    .map(entry => {
      if (!entry || typeof entry !== 'object') return null
      const record = entry as Record<string, unknown>
      const name = String(record.name ?? '').trim()
      const price = Number(record.price) || 0
      if (!name || price <= 0) return null
      return { name, price }
    })
    .filter((item): item is { name: string; price: number } => item !== null)

  return items.length > 0 ? items : null
}
