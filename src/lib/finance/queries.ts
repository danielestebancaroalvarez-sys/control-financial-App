import { createClient } from '@/utils/supabase/server'
import { syncUserProfileFromMetadata } from '@/lib/profile/sync'
import type { CurrencyCode } from '@/lib/household/types'
import { calculateBalance, sumByTypeInPeriod } from './balance'
import { calculateGuiltFreeMoney } from './guilt-free'
import { getPeriodRange } from './format'
import { getCategoryColor } from './categories'
import { buildPredictionsSummary } from './predictions'
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

export async function getHouseholdTransactions(
  householdId: string
): Promise<TransactionRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('type, amount_base, transaction_date, category_id')
    .eq('household_id', householdId)

  return (data ?? []) as TransactionRow[]
}

export async function getRealBalance(householdId: string): Promise<number> {
  const transactions = await getHouseholdTransactions(householdId)
  return calculateBalance(transactions).balance
}

export async function getCategories(householdId: string): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, type, icon, color, is_fixed, is_system')
    .eq('household_id', householdId)
    .order('name')

  return (data ?? []).map(c => ({
    ...c,
    type: c.type as 'income' | 'expense',
    color: getCategoryColor(c.name, c.color),
    is_system: c.is_system ?? false,
  }))
}

export async function getDashboardSummary(
  householdId: string,
  period: Period = 'monthly'
): Promise<DashboardSummary> {
  const supabase = await createClient()
  const { start, end } = getPeriodRange(period)

  const [transactions, savingsResult, categoriesResult] =
    await Promise.all([
      getHouseholdTransactions(householdId),
      supabase
        .from('savings_goals')
        .select(
          'name, target_amount, current_amount, contribution_amount, contribution_frequency, is_active'
        )
        .eq('household_id', householdId)
        .eq('is_active', true),
      supabase
        .from('categories')
        .select('id, name, color')
        .eq('household_id', householdId)
        .eq('type', 'expense'),
    ])

  const balance = calculateBalance(transactions)
  const periodIncome = sumByTypeInPeriod(transactions, 'income', start, end)
  const periodExpenses = sumByTypeInPeriod(transactions, 'expense', start, end)

  const savingsGoals = savingsResult.data ?? []
  const totalSavings = savingsGoals.reduce(
    (sum, g) => sum + Number(g.current_amount),
    0
  )

  const guiltFreeMoney = calculateGuiltFreeMoney(periodIncome, periodExpenses)

  const categoryMap = new Map(
    (categoriesResult.data ?? []).map(c => [
      c.id,
      { ...c, color: getCategoryColor(c.name, c.color) },
    ])
  )

  const categoryTotals = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.category_id) continue
    if (tx.transaction_date < start || tx.transaction_date > end) continue
    const prev = categoryTotals.get(tx.category_id) ?? 0
    categoryTotals.set(tx.category_id, prev + Number(tx.amount_base))
  }

  const topCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, amount]) => {
      const cat = categoryMap.get(id)
      return {
        name: cat?.name ?? 'Sin categoría',
        amount,
        color: cat?.color ?? null,
      }
    })

  const savingsProgress = savingsGoals.map(g => ({
    name: g.name,
    current: Number(g.current_amount),
    target: Number(g.target_amount),
    percent: Math.min(
      100,
      Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
    ),
  }))

  return {
    realBalance: balance.balance,
    monthlyIncome: periodIncome,
    monthlyExpenses: periodExpenses,
    totalSavings,
    guiltFreeMoney,
    topCategories,
    savingsGoals: savingsProgress,
    period,
  }
}

export async function searchTransactions(
  householdId: string,
  filters: SearchFilters
): Promise<TransactionListItem[]> {
  const supabase = await createClient()
  await syncUserProfileFromMetadata()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase
    .from('transactions')
    .select(
      `
      id, type, description, transaction_date,
      amount_base, amount_original, currency_original,
      category_id, created_by, line_items,
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
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', authorIds)

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
    }
  })
}

export async function getSavingsGoals(householdId: string): Promise<SavingsGoal[]> {
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

export async function getPredictionsSummary(
  householdId: string,
  period: Period = 'monthly'
): Promise<PredictionsSummary> {
  const supabase = await createClient()

  const [recurringResult, txResult] = await Promise.all([
    supabase
      .from('recurring_schedules')
      .select(
        'id, description, amount_original, frequency, next_occurrence, category_id, categories (name, icon, is_fixed)'
      )
      .eq('household_id', householdId)
      .eq('is_active', true)
      .eq('type', 'expense'),
    supabase
      .from('transactions')
      .select('category_id, amount_base, transaction_date, line_items')
      .eq('household_id', householdId)
      .eq('type', 'expense'),
  ])

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
        ? { name: cat.name, icon: cat.icon, is_fixed: cat.is_fixed }
        : null,
    }
  })

  return buildPredictionsSummary(
    recurring,
    (txResult.data ?? []).map(tx => ({
      category_id: tx.category_id,
      amount_base: tx.amount_base,
      transaction_date: tx.transaction_date,
      line_items: tx.line_items as { name: string; price: number }[] | null,
    })),
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
