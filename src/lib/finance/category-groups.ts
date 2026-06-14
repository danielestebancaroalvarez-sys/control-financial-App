import type { Category } from './types'

export type ExpenseGroupName =
  | 'Arriendo'
  | 'Servicios'
  | 'Mercado'
  | 'Restaurantes'
  | 'Transporte'
  | 'Otros'

const GROUP_COLORS: Record<ExpenseGroupName, string> = {
  Arriendo: '#F59E0B',
  Servicios: '#81D4FA',
  Mercado: '#00BFA5',
  Restaurantes: '#FF8A65',
  Transporte: '#7E57C2',
  Otros: '#636E72',
}

const GROUP_ORDER: ExpenseGroupName[] = [
  'Arriendo',
  'Servicios',
  'Mercado',
  'Restaurantes',
  'Transporte',
  'Otros',
]

export function getExpenseGroup(
  categoryName: string,
  category?: Pick<Category, 'is_fixed' | 'is_subscription'> | null
): ExpenseGroupName {
  const name = categoryName.trim()

  if (name === 'Arriendo') return 'Arriendo'
  if (name === 'Mercado') return 'Mercado'
  if (name === 'Restaurantes') return 'Restaurantes'
  if (name === 'Transporte') return 'Transporte'

  if (
    category?.is_fixed ||
    category?.is_subscription ||
    ['Luz', 'Internet', 'Servicios', 'Suscripciones'].includes(name)
  ) {
    return 'Servicios'
  }

  return 'Otros'
}

export function getExpenseGroupColor(group: ExpenseGroupName): string {
  return GROUP_COLORS[group]
}

export function buildExpenseGroupTotals(
  categoryTotals: Map<string, number>,
  categoryMap: Map<string, { name: string; is_fixed: boolean; is_subscription: boolean }>
): { name: ExpenseGroupName; amount: number; color: string }[] {
  const groupTotals = new Map<ExpenseGroupName, number>()

  for (const [categoryId, amount] of categoryTotals) {
    const cat = categoryMap.get(categoryId)
    const group = getExpenseGroup(cat?.name ?? 'Otros', cat)
    groupTotals.set(group, (groupTotals.get(group) ?? 0) + amount)
  }

  return GROUP_ORDER.map(name => ({
    name,
    amount: groupTotals.get(name) ?? 0,
    color: GROUP_COLORS[name],
  })).filter(item => item.amount > 0)
}
