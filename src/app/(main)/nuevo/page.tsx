import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getCategories } from '@/lib/finance/queries'
import { getFirstName } from '@/lib/utils/name'
import { AddTransactionForm } from '@/components/transactions/add-transaction-form'

export default async function NuevoPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const categories = await getCategories(ctx.household.id)
  const displayName =
    ctx.user.user_metadata?.full_name ??
    ctx.user.user_metadata?.name ??
    ctx.user.email?.split('@')[0] ??
    'Usuario'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-[#2D3436]">Nuevo registro</h1>
        <p className="text-[12px] text-[#636E72]">Ingreso o gasto del hogar</p>
      </div>
      <AddTransactionForm
        householdId={ctx.household.id}
        baseCurrency={ctx.household.base_currency}
        categories={categories}
        authorName={getFirstName(displayName)}
      />
    </div>
  )
}
