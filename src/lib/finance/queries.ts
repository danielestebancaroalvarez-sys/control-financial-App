import { createClient } from '@/utils/supabase/server'
import type { CurrencyCode } from '@/lib/household/types'
import { calculateBalance, sumByTypeInPeriod } from './balance'
import { calculateGuiltFreeMoney, toMonthlyAmount } from './guilt-free'
import { getCurrentMonthRange } from './format'
import type { DashboardSummary, TransactionRow } from './types'

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

export async function getDashboardSummary(
  householdId: string
): Promise<DashboardSummary> {
  const supabase = await createClient()
  const { start, end } = getCurrentMonthRange()

  const [transactions, savingsResult, recurringResult, categoriesResult] =
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
        .from('recurring_schedules')
        .select('type, amount_original, currency_original, frequency, is_active')
        .eq('household_id', householdId)
        .eq('is_active', true),
      supabase
        .from('categories')
        .select('id, name, color')
        .eq('household_id', householdId)
        .eq('type', 'expense'),
    ])

  const balance = calculateBalance(transactions)
  const monthlyIncome = sumByTypeInPeriod(transactions, 'income', start, end)
  const monthlyExpenses = sumByTypeInPeriod(transactions, 'expense', start, end)

  const savingsGoals = savingsResult.data ?? []
  const totalSavings = savingsGoals.reduce(
    (sum, g) => sum + Number(g.current_amount),
    0
  )

  const monthlyFixedExpenses = (recurringResult.data ?? [])
    .filter(r => r.type === 'expense')
    .reduce(
      (sum, r) =>
        sum + toMonthlyAmount(Number(r.amount_original), r.frequency),
      0
    )

  const monthlySavingsContributions = savingsGoals.reduce((sum, g) => {
    if (!g.contribution_amount || !g.contribution_frequency) return sum
    return (
      sum +
      toMonthlyAmount(
        Number(g.contribution_amount),
        g.contribution_frequency as 'weekly' | 'biweekly' | 'monthly'
      )
    )
  }, 0)

  const guiltFreeMoney = calculateGuiltFreeMoney(
    monthlyIncome,
    monthlyFixedExpenses,
    monthlySavingsContributions
  )

  const categoryMap = new Map(
    (categoriesResult.data ?? []).map(c => [c.id, c])
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
    monthlyIncome,
    monthlyExpenses,
    totalSavings,
    guiltFreeMoney,
    topCategories,
    savingsGoals: savingsProgress,
  }
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
