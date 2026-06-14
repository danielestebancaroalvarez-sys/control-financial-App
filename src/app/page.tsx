import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import SignOutButton from './sign-out-button'
import { TrendingUp, Heart, DollarSign, PiggyBank, BarChart2, Users } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'Usuario'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A8EDEA] via-[#C8F5D1] to-[#FFDAB9] flex items-center justify-center p-6">
      <div
        className="w-full max-w-md rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.85)',
        }}
      >
        {/* Header */}
        <div
          className="px-8 pt-8 pb-6 text-center"
          style={{
            background:
              'linear-gradient(160deg, rgba(168,237,234,0.45) 0%, rgba(255,218,185,0.35) 100%)',
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#EC4899] flex items-center justify-center">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
            </div>
            <span className="text-[26px] font-bold text-[#1A1A2E] tracking-tight">
              CoupleCash
            </span>
          </div>
          <p className="text-[#6B7280] text-sm">Finanzas en pareja, fácil y feliz</p>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 pt-2">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#2DD4BF]/20 to-[#1ABC9C]/30 mb-3">
              <Users className="w-8 h-8 text-[#1ABC9C]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A2E] mb-1">
              ¡Bienvenido, {displayName}!
            </h1>
            <p className="text-[#6B7280] text-sm">{user.email}</p>
          </div>

          {/* Stats grid placeholder */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: DollarSign, label: 'Balance', value: '$0.00', color: 'from-[#2DD4BF]/20 to-[#1ABC9C]/20', iconColor: 'text-[#1ABC9C]' },
              { icon: PiggyBank, label: 'Ahorros', value: '$0.00', color: 'from-[#F59E0B]/20 to-[#FBBF24]/20', iconColor: 'text-[#F59E0B]' },
              { icon: BarChart2, label: 'Gastos', value: '$0.00', color: 'from-[#EC4899]/20 to-[#F472B6]/20', iconColor: 'text-[#EC4899]' },
            ].map(({ icon: Icon, label, value, color, iconColor }) => (
              <div
                key={label}
                className={`rounded-[16px] bg-gradient-to-br ${color} p-3 flex flex-col items-center gap-1`}
              >
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <span className="text-[10px] text-[#6B7280] font-medium">{label}</span>
                <span className="text-[13px] font-bold text-[#1A1A2E]">{value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-[16px] bg-[#F3F4F6] px-5 py-4 mb-6 text-center">
            <p className="text-[13px] text-[#6B7280]">
              Tu dashboard está listo. Aquí aparecerán tus finanzas en pareja.
            </p>
          </div>

          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
