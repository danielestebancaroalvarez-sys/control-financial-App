import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import type { CurrencyCode } from '@/lib/household/types'
import { calculateBalance, sumByTypeInPeriod } from './balance'
import { calculateGuiltFreeMoney } from './guilt-free'
import { calculateScheduledFixedExpenses } from './scheduled-expenses'
import { sumVariableExpenses } from './variable-expenses'
import { getPeriodRangeAtOffset, getPeriodBlockLabel } from './format'
import { buildMarketInsights } from './market-analytics'
import type { MarketInsights } from './market-analytics'
import { getCategoryColor } from './categories'
import { buildTrendSeries } from './dashboard-stats'
import { buildExpenseGroupTotals } from './category-groups'
import { calculatePeriodSavingsAllocations } from './savings-dashboard'
import { buildMemberSpendingStats } from './member-spending'
import { buildPredictionsSummary } from './predictions'
import { getHouseholdMembers } from '@/lib/household/queries'
import type {
  Category,
  DashboardSummary,
  Period,
  PredictionsSummary,
  SavingsGoal,
  SearchFilters,
  TransactionListItem,
  TransactionRow,
} from './types'

export const getHouseholdTransactions = cache(
  async (householdId: string): Promise<TransactionRow[]> => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('transactions')
      .select('type, amount_base, transaction_date, category_id, created_by, savings_goal_id')
      .eq('household_id', householdId)

    return (data ?? []) as TransactionRow[]
  }
)

export async function getRealBalance(householdId: string): Promise<number> {
  const transactions = await getHouseholdTransactions(householdId)
  return calculateBalance(transactions).balance
}

export const getCategories = cache(
  async (householdId: string): Promise<Category[]> => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('categories')
      .select('id, name, type, icon, color, is_fixed, is_subscription, is_system')
      .eq('household_id', householdId)
      .order('name')

    return (data ?? []).map(c => ({
      ...c,
      type: c.type as 'income' | 'expense',
      color: getCategoryColor(c.name, c.color),
      is_system: c.is_system ?? false,
      is_subscription: c.is_subscription ?? false,
    }))
  }
)

export const getSavingsGoals = cache(
  async (householdId: string): Promise<SavingsGoal[]> => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('household_id', householdId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return (data ?? []).map(g => ({
      id: g.id,
      name: g.name,
      category: g.category ?? 'other',
      icon: g.icon ?? 'piggy-bank',
      color: g.color ?? '#F59E0B',
      target_amount: Number(g.target_amount),
      current_amount: Number(g.current_amount),
      target_date: g.target_date,
      contribution_amount: g.contribution_amount ? Number(g.contribution_amount) : null,
      contribution_frequency: g.contribution_frequency,
      savings_mode: g.savings_mode,
      annual_interest_rate: g.annual_interest_rate
        ? Number(g.annual_interest_rate)
        : null,
      is_active: g.is_active,
    }))
  }
)

export const getRecurringSchedules = cache(
  async (householdId: string) => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('recurring_schedules')
      .select(
        'type, amount_original, frequency, next_occurrence, is_active'
      )
      .eq('household_id', householdId)
      .eq('is_active', true)

    return data ?? []
  }
)

export async function getDashboardSummary(
  householdId: string,
  period: Period = 'monthly',
  periodOffset = 0
): Promise<DashboardSummary> {
  const safeOffset = Math.max(0, Math.min(11, Math.floor(periodOffset)))
  const { start, end } = getPeriodRangeAtOffset(period, safeOffset)

  const [transactions, savingsGoals, categories, members, recurring] =
    await Promise.all([
      getHouseholdTransactions(householdId),
      getSavingsGoals(householdId),
      getCategories(householdId),
      getHouseholdMembers(householdId),
      getRecurringSchedules(householdId),
    ])

  const balance = calculateBalance(transactions)
  const periodIncome = sumByTypeInPeriod(transactions, 'income', start, end)
  const periodExpenses = sumByTypeInPeriod(transactions, 'expense', start, end)
  const totalSavings = savingsGoals.reduce(
    (sum, g) => sum + Number(g.current_amount),
    0
  )
  const { total: periodSavings, items: savingsBreakdown } =
    calculatePeriodSavingsAllocations(savingsGoals, period, start, end)

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const categoryMap = new Map(
    expenseCategories.map(c => [
      c.id,
      {
        id: c.id,
        name: c.name,
        color: c.color,
        is_fixed: c.is_fixed,
        is_subscription: c.is_subscription,
      },
    ])
  )

  const scheduledFixedExpenses = calculateScheduledFixedExpenses(
    recurring,
    start,
    end
  )
  const variableSpent = sumVariableExpenses(
    transactions,
    start,
    end,
    categoryMap
  )
  const guiltFreeMoney = calculateGuiltFreeMoney(
    periodIncome,
    scheduledFixedExpenses,
    periodSavings,
    variableSpent
  )
  const budgetDeficit =
    guiltFreeMoney < 0 ? Math.round(Math.abs(guiltFreeMoney) * 100) / 100 : 0

  let expenseChangePercent: number | null = null
  if (safeOffset < 11) {
    const prev = getPeriodRangeAtOffset(period, safeOffset + 1)
    const prevExpenses = sumByTypeInPeriod(
      transactions,
      'expense',
      prev.start,
      prev.end
    )
    if (prevExpenses > 0) {
      expenseChangePercent =
        Math.round(
          ((periodExpenses - prevExpenses) / prevExpenses) * 1000
        ) / 10
    }
  }

  const categoryTotals = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.category_id) continue
    if (tx.transaction_date < start || tx.transaction_date > end) continue
    const prev = categoryTotals.get(tx.category_id) ?? 0
    categoryTotals.set(tx.category_id, prev + Number(tx.amount_base))
  }

  const mapCategoryAmount = ([id, amount]: [string, number]) => {
    const cat = categoryMap.get(id)
    return {
      name: cat?.name ?? 'Sin categoría',
      amount,
      color: cat?.color ?? null,
    }
  }

  const topCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(mapCategoryAmount)

  const allCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(mapCategoryAmount)

  const expenseGroups = buildExpenseGroupTotals(categoryTotals, categoryMap)

  const trend = buildTrendSeries(transactions, period, safeOffset, 6)
  const savingsProgress = savingsGoals.map(g => ({
    name: g.name,
    current: Number(g.current_amount),
    target: Number(g.target_amount),
    percent: Math.min(
      100,
      Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
    ),
  }))

  const memberSpending = buildMemberSpendingStats(
    transactions,
    start,
    end,
    members.map(m => ({
      user_id: m.user_id,
      full_name: m.full_name,
      avatar_url: m.avatar_url,
    })),
    categoryMap
  )

  return {
    realBalance: balance.balance,
    monthlyIncome: periodIncome,
    monthlyExpenses: periodExpenses,
    periodSavings,
    savingsBreakdown,
    totalSavings,
    guiltFreeMoney,
    budgetDeficit,
    scheduledFixedExpenses,
    variableSpent,
    expenseChangePercent,
    topCategories,
    expenseGroups,
    savingsGoals: savingsProgress,
    memberSpending,
    period,
    periodOffset: safeOffset,
    periodStart: start,
    periodEnd: end,
    periodLabel: getPeriodBlockLabel(period, safeOffset, start, end),
    trend,
    allCategories,
  }
}

export async function searchTransactions(
  householdId: string,
  filters: SearchFilters
): Promise<TransactionListItem[]> {
  const supabase = await createClient()
  const user = await getAuthUser()

  let query = supabase
    .from('transactions')
    .select(
      `
      id, type, description, transaction_date,
      amount_base, amount_original, currency_original,
      category_id, created_by, line_items, receipt_image_path,
      categories (name, icon, color)
    `
    )
    .eq('household_id', householdId)
    .neq('type', 'adjustment')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200)

  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }
  if (filters.createdBy) {
    query = query.eq('created_by', filters.createdBy)
  }
  if (filters.startDate) {
    query = query.gte('transaction_date', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('transaction_date', filters.endDate)
  }
  if (filters.q) {
    query = query.ilike('description', `%${filters.q}%`)
  }

  const { data } = await query
  if (!data) return []

  const authorIds = [...new Set(data.map(r => r.created_by))]
  const { data: profiles } =
    authorIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', authorIds)
      : { data: [] }

  const profileMap = new Map(
    (profiles ?? []).map(p => [p.id, p.full_name])
  )

  return data.map(row => {
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
    let authorName = profileMap.get(row.created_by) ?? null
    if (!authorName && user && user.id === row.created_by) {
      authorName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email?.split('@')[0] ??
        'Usuario'
    }
    return {
      id: row.id,
      type: row.type,
      description: row.description,
      transaction_date: row.transaction_date,
      amount_base: Number(row.amount_base),
      amount_original: Number(row.amount_original),
      currency_original: row.currency_original,
      category_id: row.category_id,
      category_name: cat?.name ?? null,
      category_icon: cat?.icon ?? null,
      category_color: cat ? getCategoryColor(cat.name, cat.color) : null,
      created_by: row.created_by,
      author_name: authorName,
      line_items: row.line_items as TransactionListItem['line_items'],
      receipt_image_path: row.receipt_image_path ?? null,
    }
  })
}

export async function getShoppingListChecks(
  householdId: string
): Promise<Record<string, boolean>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('household_shopping_checks')
    .select('item_key, is_checked')
    .eq('household_id', householdId)

  const map: Record<string, boolean> = {}
  for (const row of data ?? []) {
    map[row.item_key] = row.is_checked
  }
  return map
}

export async function getPredictionsSummary(
  householdId: string,
  period: Period = 'monthly'
): Promise<PredictionsSummary> {
  const supabase = await createClient()
  const trendStart = getPeriodRangeAtOffset(period, 3).start

  const [recurringResult, txResult, categories] = await Promise.all([
    supabase
      .from('recurring_schedules')
      .select(
        'id, description, amount_original, frequency, next_occurrence, category_id, categories (name, icon, is_fixed, is_subscription)'
      )
      .eq('household_id', householdId)
      .eq('is_active', true)
      .eq('type', 'expense'),
    supabase
      .from('transactions')
      .select(
        'category_id, amount_base, transaction_date, description, line_items, recurring_schedule_id'
      )
      .eq('household_id', householdId)
      .eq('type', 'expense')
      .gte('transaction_date', trendStart),
    getCategories(householdId),
  ])

  const mercado = categories.find(c => c.name === 'Mercado')

  const recurring = (recurringResult.data ?? []).map(r => {
    const cat = Array.isArray(r.categories) ? r.categories[0] : r.categories
    return {
      id: r.id,
      description: r.description,
      amount_original: r.amount_original,
      frequency: r.frequency,
      next_occurrence: r.next_occurrence,
      category_id: r.category_id,
      categories: cat
        ? {
            name: cat.name,
            icon: cat.icon,
            is_fixed: cat.is_fixed,
            is_subscription: cat.is_subscription ?? false,
          }
        : null,
    }
  })

  return buildPredictionsSummary(
    recurring,
    (txResult.data ?? []).map(tx => ({
      category_id: tx.category_id,
      amount_base: tx.amount_base,
      transaction_date: tx.transaction_date,
      description: tx.description,
      line_items: tx.line_items,
      recurring_schedule_id: tx.recurring_schedule_id,
    })),
    mercado?.id ?? null,
    period
  )
}

export async function getMarketInsights(
  householdId: string,
  period: Period = 'weekly'
): Promise<MarketInsights> {
  const supabase = await createClient()
  const lookbackStart = getPeriodRangeAtOffset('weekly', 12).start

  const [txResult, categories] = await Promise.all([
    supabase
      .from('transactions')
      .select('category_id, amount_base, transaction_date, description, line_items')
      .eq('household_id', householdId)
      .eq('type', 'expense')
      .gte('transaction_date', lookbackStart),
    getCategories(householdId),
  ])

  const mercado = categories.find(c => c.name === 'Mercado')

  return buildMarketInsights(
    (txResult.data ?? []).map(tx => ({
      category_id: tx.category_id,
      amount_base: tx.amount_base,
      transaction_date: tx.transaction_date,
      description: tx.description,
      line_items: tx.line_items,
    })),
    mercado?.id ?? null,
    period
  )
}

export async function getHouseholdBaseCurrency(
  householdId: string
): Promise<CurrencyCode> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('households')
    .select('base_currency')
    .eq('id', householdId)
    .single()
  return (data?.base_currency ?? 'AUD') as CurrencyCode
}
