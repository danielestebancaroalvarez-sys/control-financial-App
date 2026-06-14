import { createClient } from '@/utils/supabase/server'
import { getUserHousehold, getHouseholdMembers } from '@/lib/household/queries'
import { getCategories } from '@/lib/finance/queries'
import { getUserDashboardPeriod } from '@/lib/profile/queries'
import SignOutButton from '@/app/sign-out-button'
import { CopyButton } from './copy-button'
import { DashboardPeriodSetting } from './dashboard-period-setting'
import { CategoriesManager } from './categories-manager'
import { Users, Coins } from 'lucide-react'

export default async function AjustesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const household = await getUserHousehold()
  if (!household || !user) return null

  const [members, dashboardPeriod, categories] = await Promise.all([
    getHouseholdMembers(household.id),
    getUserDashboardPeriod(),
    getCategories(household.id),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-[#2D3436]">Cuenta y Ajustes</h1>
        <p className="text-[13px] text-[#636E72]">Gestiona tu hogar y preferencias</p>
      </div>

      <DashboardPeriodSetting current={dashboardPeriod} />

      <CategoriesManager householdId={household.id} categories={categories} />

      <section className="rounded-[24px] bg-white/90 backdrop-blur-md shadow-sm border border-white/60 p-5">
        <h2 className="text-[15px] font-bold text-[#2D3436] mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#00BFA5]" />
          Tu Hogar
        </h2>
        <p className="text-[18px] font-bold text-[#2D3436]">{household.name}</p>
        <p className="text-[13px] text-[#636E72] mt-1 flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5" />
          Divisa base: <span className="font-semibold">{household.base_currency}</span>
        </p>

        <div className="mt-4 p-3 rounded-2xl bg-[#F5F5F5]">
          <p className="text-[11px] text-[#636E72] font-medium mb-1">Código de invitación</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[20px] font-bold tracking-[0.15em] text-[#2D3436]">
              {household.invite_code}
            </span>
            <CopyButton text={household.invite_code} />
          </div>
          <p className="text-[11px] text-[#636E72] mt-2">
            Comparte este código con tu pareja para que se una al hogar.
          </p>
        </div>
      </section>

      <section className="rounded-[24px] bg-white/90 backdrop-blur-md shadow-sm border border-white/60 p-5">
        <h2 className="text-[15px] font-bold text-[#2D3436] mb-3">
          Miembros ({members.length})
        </h2>
        <ul className="space-y-3">
          {members.map(member => (
            <li
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F5]"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                {(member.full_name ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#2D3436] truncate">
                  {member.full_name ?? 'Usuario'}
                  {member.user_id === user.id && (
                    <span className="text-[#636E72] font-normal"> (tú)</span>
                  )}
                </p>
                <p className="text-[11px] text-[#636E72] capitalize">{member.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[24px] bg-white/90 backdrop-blur-md shadow-sm border border-white/60 p-5">
        <h2 className="text-[15px] font-bold text-[#2D3436] mb-3">Sesión</h2>
        <p className="text-[13px] text-[#636E72] mb-4">{user.email}</p>
        <SignOutButton />
      </section>
    </div>
  )
}
