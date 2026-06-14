import type { CurrencyCode } from '@/lib/household/types'

export function convertAmount(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100
}

export function prepareTransactionAmounts(
  amount: number,
  currencyOriginal: CurrencyCode,
  baseCurrency: CurrencyCode,
  exchangeRate: number
) {
  const amountBase =
    currencyOriginal === baseCurrency
      ? amount
      : convertAmount(amount, exchangeRate)

  return {
    amount_original: amount,
    currency_original: currencyOriginal,
    exchange_rate: exchangeRate,
    amount_base: amountBase,
    currency_base: baseCurrency,
  }
}

export async function fetchExchangeRate(
  supabase: { from: (table: string) => unknown },
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  if (from === to) return 1

  const client = supabase as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (a: string, v: string) => {
          eq: (a: string, v: string) => {
            order: (c: string, o: { ascending: boolean }) => {
              limit: (n: number) => {
                maybeSingle: () => Promise<{ data: { rate: number } | null }>
              }
            }
          }
        }
      }
    }
  }

  const { data } = await client
    .from('exchange_rates')
    .select('rate')
    .eq('from_currency', from)
    .eq('to_currency', to)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) throw new Error(`No hay tasa de cambio para ${from} → ${to}`)
  return Number(data.rate)
}
