import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getUserHousehold } from '@/lib/household/queries'
import { getCategories } from '@/lib/finance/queries'
import { getFirstName } from '@/lib/utils/name'
import { AddTransactionForm } from '@/components/transactions/add-transaction-form'
import { ArrowLeft } from 'lucide-react'

export default async function NuevoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const household = await getUserHousehold()
  if (!household || !user) return null

  const categories = await getCategories(household.id)
  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'Usuario'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 rounded-full bg-white/80 border border-white/60 flex items-center justify-center text-[#636E72] hover:bg-white shadow-sm"
          aria-label="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-bold text-[#2D3436]">Nuevo registro</h1>
          <p className="text-[12px] text-[#636E72]">Ingreso o gasto del hogar</p>
        </div>
      </div>

      <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
        <AddTransactionForm
          householdId={household.id}
          baseCurrency={household.base_currency}
          categories={categories}
          authorName={getFirstName(displayName)}
        />
      </div>
    </div>
  )
}
