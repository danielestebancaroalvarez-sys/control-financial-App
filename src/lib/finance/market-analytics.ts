import { parseLineItems } from './category-radar'
import { getPeriodRangeAtOffset, listPeriodBlocks } from './format'
import type { Period } from './types'

export type MarketProductGroup =
  | 'carne'
  | 'aseo'
  | 'frutas-verduras'
  | 'lacteos'
  | 'panaderia'
  | 'bebidas'
  | 'otros'

export const MARKET_GROUP_LABELS: Record<MarketProductGroup, string> = {
  carne: 'Carne y proteína',
  aseo: 'Aseo y limpieza',
  'frutas-verduras': 'Frutas y verduras',
  lacteos: 'Lácteos',
  panaderia: 'Panadería',
  bebidas: 'Bebidas',
  otros: 'Otros',
}

const GROUP_KEYWORDS: Record<MarketProductGroup, string[]> = {
  carne: [
    'carne',
    'pollo',
    'cerdo',
    'res',
    'cordero',
    'chorizo',
    'salchicha',
    'jamón',
    'jamon',
    'tocino',
    'hamburguesa',
    'pescado',
    'atún',
    'atun',
    'salmón',
    'salmon',
    'filete',
    'muslo',
    'pechuga',
    'huevo',
    'huevos',
  ],
  aseo: [
    'aseo',
    'jabón',
    'jabon',
    'detergente',
    'shampoo',
    'champú',
    'champu',
    'acondicionador',
    'limpiador',
    'cloro',
    'desinfectante',
    'papel higiénico',
    'papel higienico',
    'servilleta',
    'pañal',
    'panal',
    'toalla',
    'esponja',
    'lavaplatos',
    'suavizante',
    'bleach',
    'limpia',
    'ariel',
    'fabuloso',
    'lyso',
    'papel',
    'bolsa',
  ],
  'frutas-verduras': [
    'fruta',
    'verdura',
    'tomate',
    'cebolla',
    'plátano',
    'platano',
    'banano',
    'manzana',
    'pera',
    'naranja',
    'limón',
    'limon',
    'aguacate',
    'papa',
    'zanahoria',
    'lechuga',
    'espinaca',
    'brocoli',
    'brócoli',
    'fresa',
    'uva',
    'mango',
    'piña',
    'pina',
  ],
  lacteos: [
    'leche',
    'queso',
    'yogurt',
    'yogur',
    'mantequilla',
    'crema',
    'arequipe',
    'kumis',
  ],
  panaderia: [
    'pan',
    'tortilla',
    'galleta',
    'pastel',
    'bollo',
    'arepa',
    'croissant',
    'bagel',
  ],
  bebidas: [
    'agua',
    'jugo',
    'cerveza',
    'refresco',
    'gaseosa',
    'soda',
    'vino',
    'whisky',
    'bebida',
    'cola',
    'sprite',
  ],
  otros: [],
}

type TxRow = {
  category_id: string | null
  amount_base: number
  transaction_date: string
  description: string
  line_items: unknown
}

export type MarketProductStat = {
  name: string
  group: MarketProductGroup
  totalSpent: number
  avgUnitPrice: number
  purchaseCount: number
  avgDaysBetween: number | null
  lastPurchased: string | null
  daysSinceLastPurchase: number | null
  dueSoon: boolean
}

export type MarketGroupStat = {
  group: MarketProductGroup
  label: string
  totalSpent: number
  avgWeeklySpend: number
  purchaseTrips: number
  avgDaysBetweenTrips: number | null
  topProducts: string[]
}

export type WeeklyMarketSpend = {
  label: string
  start: string
  end: string
  amount: number
}

export type ShoppingListItem = {
  name: string
  group: MarketProductGroup
  estimatedPrice: number
  lastPurchased: string | null
  daysSinceLastPurchase: number | null
  avgDaysBetween: number | null
  urgency: 'overdue' | 'soon' | 'regular'
}

export type MarketInsights = {
  weeklySpends: WeeklyMarketSpend[]
  avgWeeklySpend: number
  currentWeekSpend: number
  totalTrips: number
  avgDaysBetweenTrips: number | null
  groupStats: MarketGroupStat[]
  topProducts: MarketProductStat[]
  shoppingList: ShoppingListItem[]
  hasMercadoData: boolean
}

export function classifyMarketProduct(name: string): MarketProductGroup {
  const normalized = name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')

  for (const [group, keywords] of Object.entries(GROUP_KEYWORDS) as [
    MarketProductGroup,
    string[],
  ][]) {
    if (group === 'otros') continue
    if (keywords.some(kw => normalized.includes(kw))) return group
  }

  return 'otros'
}

function daysBetween(a: string, b: string): number {
  const msA = new Date(`${a}T12:00:00`).getTime()
  const msB = new Date(`${b}T12:00:00`).getTime()
  return Math.round(Math.abs(msB - msA) / 86400000)
}

function avgDaysBetweenDates(dates: string[]): number | null {
  if (dates.length < 2) return null
  const sorted = [...dates].sort()
  let total = 0
  for (let i = 1; i < sorted.length; i++) {
    total += daysBetween(sorted[i - 1], sorted[i])
  }
  return Math.round(total / (sorted.length - 1))
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function buildMarketInsights(
  transactions: TxRow[],
  mercadoCategoryId: string | null,
  period: Period = 'weekly'
): MarketInsights {
  const mercadoTx = mercadoCategoryId
    ? transactions.filter(tx => tx.category_id === mercadoCategoryId)
    : []

  const hasMercadoData = mercadoTx.length > 0
  const today = todayString()

  const weeklyBlocks = listPeriodBlocks('weekly', 8)
  const weeklySpends: WeeklyMarketSpend[] = weeklyBlocks.map(block => ({
    label: block.label,
    start: block.start,
    end: block.end,
    amount: Math.round(
      mercadoTx
        .filter(
          tx =>
            tx.transaction_date >= block.start &&
            tx.transaction_date <= block.end
        )
        .reduce((sum, tx) => sum + Number(tx.amount_base), 0) * 100
    ) / 100,
  }))

  const nonZeroWeeks = weeklySpends.filter(w => w.amount > 0)
  const avgWeeklySpend =
    nonZeroWeeks.length > 0
      ? Math.round(
          (nonZeroWeeks.reduce((s, w) => s + w.amount, 0) / nonZeroWeeks.length) *
            100
        ) / 100
      : 0

  const currentWeekSpend = weeklySpends[0]?.amount ?? 0

  const tripDates = [...new Set(mercadoTx.map(tx => tx.transaction_date))].sort()
  const avgDaysBetweenTrips = avgDaysBetweenDates(tripDates)

  const itemMap = new Map<
    string,
    {
      displayName: string
      group: MarketProductGroup
      prices: number[]
      purchaseDates: string[]
    }
  >()

  for (const tx of mercadoTx) {
    const lineItems = parseLineItems(tx.line_items)

    if (lineItems?.length) {
      for (const item of lineItems) {
        const key = item.name.toLowerCase().trim()
        const existing = itemMap.get(key) ?? {
          displayName: item.name,
          group: classifyMarketProduct(item.name),
          prices: [],
          purchaseDates: [],
        }
        existing.prices.push(item.price)
        existing.purchaseDates.push(tx.transaction_date)
        itemMap.set(key, existing)
      }
    }
  }

  const topProducts: MarketProductStat[] = []

  for (const [, stats] of itemMap) {
    const uniqueDates = [...new Set(stats.purchaseDates)].sort()
    const avgDaysBetween = avgDaysBetweenDates(uniqueDates)
    const lastPurchased = uniqueDates.at(-1) ?? null
    const daysSinceLastPurchase = lastPurchased
      ? daysBetween(lastPurchased, today)
      : null

    const dueSoon =
      avgDaysBetween !== null &&
      daysSinceLastPurchase !== null &&
      daysSinceLastPurchase >= Math.max(1, Math.round(avgDaysBetween * 0.85))

    topProducts.push({
      name: stats.displayName,
      group: stats.group,
      totalSpent: Math.round(stats.prices.reduce((s, p) => s + p, 0) * 100) / 100,
      avgUnitPrice:
        Math.round(
          (stats.prices.reduce((s, p) => s + p, 0) / stats.prices.length) * 100
        ) / 100,
      purchaseCount: uniqueDates.length,
      avgDaysBetween,
      lastPurchased,
      daysSinceLastPurchase,
      dueSoon,
    })
  }

  topProducts.sort((a, b) => b.totalSpent - a.totalSpent)

  const groupStats: MarketGroupStat[] = (
    Object.keys(MARKET_GROUP_LABELS) as MarketProductGroup[]
  ).map(group => {
    const products = topProducts.filter(p => p.group === group)
    const totalSpent = Math.round(products.reduce((s, p) => s + p.totalSpent, 0) * 100) / 100

    const tripDatesForGroup = new Set<string>()
    for (const tx of mercadoTx) {
      const items = parseLineItems(tx.line_items)
      if (!items?.length) continue
      const hasGroupItem = items.some(
        item => classifyMarketProduct(item.name) === group
      )
      if (hasGroupItem) tripDatesForGroup.add(tx.transaction_date)
    }

    const sortedTrips = [...tripDatesForGroup].sort()
    const weeksWithData = Math.max(1, nonZeroWeeks.length)

    return {
      group,
      label: MARKET_GROUP_LABELS[group],
      totalSpent,
      avgWeeklySpend: Math.round((totalSpent / weeksWithData) * 100) / 100,
      purchaseTrips: sortedTrips.length,
      avgDaysBetweenTrips: avgDaysBetweenDates(sortedTrips),
      topProducts: products.slice(0, 3).map(p => p.name),
    }
  })

  groupStats.sort((a, b) => b.totalSpent - a.totalSpent)

  const shoppingList: ShoppingListItem[] = topProducts
    .filter(p => p.dueSoon && p.avgDaysBetween !== null)
    .map(p => {
      const ratio =
        p.daysSinceLastPurchase && p.avgDaysBetween
          ? p.daysSinceLastPurchase / p.avgDaysBetween
          : 1

      let urgency: ShoppingListItem['urgency'] = 'regular'
      if (ratio >= 1) urgency = 'overdue'
      else if (ratio >= 0.85) urgency = 'soon'

      return {
        name: p.name,
        group: p.group,
        estimatedPrice: p.avgUnitPrice,
        lastPurchased: p.lastPurchased,
        daysSinceLastPurchase: p.daysSinceLastPurchase,
        avgDaysBetween: p.avgDaysBetween,
        urgency,
      }
    })
    .sort((a, b) => {
      const order = { overdue: 0, soon: 1, regular: 2 }
      return order[a.urgency] - order[b.urgency]
    })

  if (shoppingList.length === 0 && topProducts.length > 0) {
    for (const p of topProducts.slice(0, 8)) {
      shoppingList.push({
        name: p.name,
        group: p.group,
        estimatedPrice: p.avgUnitPrice,
        lastPurchased: p.lastPurchased,
        daysSinceLastPurchase: p.daysSinceLastPurchase,
        avgDaysBetween: p.avgDaysBetween,
        urgency: 'regular',
      })
    }
  }

  return {
    weeklySpends,
    avgWeeklySpend,
    currentWeekSpend,
    totalTrips: tripDates.length,
    avgDaysBetweenTrips,
    groupStats: groupStats.filter(g => g.totalSpent > 0 || g.purchaseTrips > 0),
    topProducts: topProducts.slice(0, 20),
    shoppingList,
    hasMercadoData,
  }
}
