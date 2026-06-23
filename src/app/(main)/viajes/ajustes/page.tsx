import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plane } from 'lucide-react'
import { getMainAppContext } from '@/lib/app/context'
import { getUserProfile, getUserTheme } from '@/lib/profile/queries'
import SignOutButton from '@/app/sign-out-button'
import { ThemeSetting } from '@/app/(main)/ajustes/theme-setting'
import { ProfileSettingsForm } from '@/components/profile/profile-settings-form'

export default async function ViajesAjustesPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const profile = await getUserProfile()
  const theme = await getUserTheme()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-cc-primary">Ajustes de Viajes</h1>
        <p className="text-[13px] text-cc-secondary">
          Perfil compartido · preferencias del módulo Viajes
        </p>
      </div>

      {profile && (
        <section className="cc-surface rounded-[24px] p-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-cc-muted mb-3">
            Compartido
          </p>
          <ProfileSettingsForm
            initialFullName={profile.fullName ?? ''}
            initialAvatarUrl={profile.avatarUrl}
            email={profile.email}
            accent="travel"
          />
        </section>
      )}

      <section className="cc-surface rounded-[24px] p-5">
        <ThemeSetting current={theme} accent="travel" embedded />
      </section>

      <section className="cc-surface rounded-[24px] p-5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#0EA5E9] mb-2">
          Viajes
        </p>
        <p className="text-[13px] text-cc-secondary">
          Los presupuestos usan la moneda base del hogar ({ctx.household.base_currency}).
          Las metas de ahorro se sincronizan con Finanzas automáticamente.
        </p>
      </section>

      <section className="cc-surface rounded-[24px] p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-[#0EA5E9]" />
          <span className="text-[13px] font-semibold text-cc-primary">Cerrar sesión</span>
        </div>
        <SignOutButton />
      </section>
    </div>
  )
}
