import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getCategories } from '@/lib/finance/queries'
import { getFirstName } from '@/lib/utils/name'
import { AddTransactionForm } from '@/components/transactions/add-transaction-form'
import { FixedScheduleForm } from '@/components/transactions/fixed-schedule-form'

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
        <h1 className="text-[20px] font-bold text-cc-primary">Nuevo registro</h1>
        <p className="text-[12px] text-cc-secondary">
          Registro del día o programación de ingresos y gastos fijos
        </p>
      </div>
      <AddTransactionForm
        householdId={ctx.household.id}
        baseCurrency={ctx.household.base_currency}
        categories={categories}
        authorName={getFirstName(displayName)}
      />
      <FixedScheduleForm
        householdId={ctx.household.id}
        baseCurrency={ctx.household.base_currency}
        categories={categories}
      />
    </div>
  )
}
