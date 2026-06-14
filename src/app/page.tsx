import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getUserHousehold } from '@/lib/household/queries'
import SignOutButton from './sign-out-button'
import {
  TrendingUp, Heart, DollarSign, PiggyBank, BarChart2,
  Users, Settings, Home,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const household = await getUserHousehold()
  if (!household) redirect('/onboarding')

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'Usuario'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B2EBF2] via-[#C8F0DC] to-[#FFE0B2] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[32px] bg-white/90 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden border border-white/60">

        <div className="px-8 pt-8 pb-6 text-center bg-gradient-to-br from-[#B2EBF2]/40 to-[#FFE0B2]/30">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#EC4899] flex items-center justify-center">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
            </div>
            <span className="text-[26px] font-bold text-[#2D3436] tracking-tight">
              CoupleCash
            </span>
          </div>
          <p className="text-[#636E72] text-sm">Finanzas en pareja, fácil y feliz</p>
        </div>

        <div className="px-8 pb-8 pt-2">
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00BFA5]/15 mb-3">
              <Users className="w-8 h-8 text-[#00BFA5]" />
            </div>
            <h1 className="text-2xl font-bold text-[#2D3436] mb-1">
              ¡Bienvenido, {displayName}!
            </h1>
            <p className="text-[#636E72] text-sm">{user.email}</p>
          </div>

          {/* Hogar activo */}
          <div className="rounded-2xl bg-[#F5F5F5] px-4 py-3 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#00BFA5]/20 flex items-center justify-center shrink-0">
              <Home className="w-4 h-4 text-[#00BFA5]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#636E72] font-medium">Hogar activo</p>
              <p className="text-[15px] font-bold text-[#2D3436] truncate">{household.name}</p>
            </div>
            <span className="text-[12px] font-bold text-[#00BFA5] bg-[#00BFA5]/10 px-2 py-1 rounded-lg">
              {household.base_currency}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: DollarSign, label: 'Balance', value: '$0.00', color: 'from-[#00BFA5]/20 to-[#2DD4BF]/20', iconColor: 'text-[#00BFA5]' },
              { icon: PiggyBank, label: 'Ahorros', value: '$0.00', color: 'from-[#F59E0B]/20 to-[#FBBF24]/20', iconColor: 'text-[#F59E0B]' },
              { icon: BarChart2, label: 'Gastos', value: '$0.00', color: 'from-[#EC4899]/20 to-[#F472B6]/20', iconColor: 'text-[#EC4899]' },
            ].map(({ icon: Icon, label, value, color, iconColor }) => (
              <div
                key={label}
                className={`rounded-2xl bg-gradient-to-br ${color} p-3 flex flex-col items-center gap-1`}
              >
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <span className="text-[10px] text-[#636E72] font-medium">{label}</span>
                <span className="text-[13px] font-bold text-[#2D3436]">{value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-[#F5F5F5] px-5 py-4 mb-4 text-center">
            <p className="text-[13px] text-[#636E72]">
              Tu dashboard está listo. Los widgets se activarán en la siguiente fase.
            </p>
          </div>

          <Link
            href="/ajustes"
            className="w-full py-3.5 rounded-2xl bg-[#F5F5F5] text-[#2D3436] font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#EEEEEE] transition-all mb-3"
          >
            <Settings className="w-4 h-4" />
            Cuenta y Ajustes
          </Link>

          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
