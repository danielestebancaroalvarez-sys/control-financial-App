import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
import { getHouseholdMembers } from '@/lib/household/queries'
import { getCategories, getRealBalance } from '@/lib/finance/queries'
import { getUserProfile } from '@/lib/profile/queries'
import SignOutButton from '@/app/sign-out-button'
import { CopyButton } from './copy-button'
import { DashboardPeriodSetting } from './dashboard-period-setting'
import { ThemeSetting } from './theme-setting'
import { CategoriesManager } from './categories-manager'
import { PaymentReminderSetting } from './payment-reminder-setting'
import { ResetDataButton } from './reset-data-button'
import { BalanceReconcileSection } from './balance-reconcile-section'
import { HouseholdMembersSection } from './household-members-section'
import { ProfileSettingsForm } from '@/components/profile/profile-settings-form'
import { Users, Coins } from 'lucide-react'

export default async function AjustesPage() {
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  const [members, categories, profile, realBalance] = await Promise.all([
    getHouseholdMembers(ctx.household.id),
    getCategories(ctx.household.id),
    getUserProfile(),
    getRealBalance(ctx.household.id),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-cc-primary">Cuenta y Ajustes</h1>
        <p className="text-[13px] text-cc-secondary">Gestiona tu hogar y preferencias</p>
      </div>

      {profile && (
        <section className="cc-surface rounded-[24px] p-5">
          <ProfileSettingsForm
            initialFullName={profile.fullName ?? ''}
            initialAvatarUrl={profile.avatarUrl}
            email={profile.email}
          />
        </section>
      )}

      <DashboardPeriodSetting current={ctx.period} />

      <ThemeSetting current={ctx.theme} />

      <PaymentReminderSetting />

      <BalanceReconcileSection
        householdId={ctx.household.id}
        currentBalance={realBalance}
        currency={ctx.household.base_currency}
      />

      <CategoriesManager householdId={ctx.household.id} categories={categories} />

      <section className="cc-surface rounded-[24px] p-5">
        <h2 className="text-[15px] font-bold text-cc-primary mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#00BFA5]" />
          Tu Hogar
        </h2>
        <p className="text-[18px] font-bold text-cc-primary">{ctx.household.name}</p>
        <p className="text-[13px] text-cc-secondary mt-1 flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5" />
          Divisa base: <span className="font-semibold">{ctx.household.base_currency}</span>
        </p>

        <div className="mt-4 p-3 rounded-2xl bg-[#F5F5F5]">
          <p className="text-[11px] text-cc-secondary font-medium mb-1">Código de invitación</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[20px] font-bold tracking-[0.15em] text-cc-primary">
              {ctx.household.invite_code}
            </span>
            <CopyButton text={ctx.household.invite_code} />
          </div>
          <p className="text-[11px] text-cc-secondary mt-2">
            Comparte este código con tu pareja para que se una al hogar.
          </p>
        </div>
      </section>

      <HouseholdMembersSection
        householdId={ctx.household.id}
        members={members}
        currentUserId={ctx.user.id}
      />

      <ResetDataButton householdId={ctx.household.id} />

      <section className="cc-surface rounded-[24px] p-5">
        <h2 className="text-[15px] font-bold text-cc-primary mb-3">Sesión</h2>
        <p className="text-[13px] text-cc-secondary mb-4">{ctx.user.email}</p>
        <SignOutButton />
      </section>

      <p className="text-center text-[11px] text-cc-muted pb-2">
        <Link href="/tiempo/ajustes" className="text-[#6366F1] font-semibold">
          Ver ajustes de Tiempo →
        </Link>
      </p>
    </div>
  )
}
