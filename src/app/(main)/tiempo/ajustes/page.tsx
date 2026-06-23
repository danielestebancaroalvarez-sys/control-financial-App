import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, Users } from 'lucide-react'
import { getMainAppContext } from '@/lib/app/context'
import { getHouseholdMembers } from '@/lib/household/queries'
import { getUserProfile, getUserTheme } from '@/lib/profile/queries'
import { getTimeCategories } from '@/lib/time/queries'
import SignOutButton from '@/app/sign-out-button'
import { CopyButton } from '@/app/(main)/ajustes/copy-button'
import { ThemeSetting } from '@/app/(main)/ajustes/theme-setting'
import { HouseholdMembersSection } from '@/app/(main)/ajustes/household-members-section'
import { ProfileSettingsForm } from '@/components/profile/profile-settings-form'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { ActivityReminderSetting } from './activity-reminder-setting'
import { ResetTimeDataButton } from './reset-time-data-button'
import { DeleteAccountButton } from '@/app/(main)/ajustes/delete-account-button'
import { AssistantSettingsPanel } from '@/components/setup/assistant-settings-panel'
import { TiempoAjustesGuideBanner } from '@/components/setup/tiempo-ajustes-guide-banner'
import { getAssistantState } from '@/lib/setup/assistant-queries'

type SearchParams = Promise<{ guide?: string }>

export default async function TiempoAjustesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const [members, profile, timeCategories, theme, assistantState] = await Promise.all([
    getHouseholdMembers(ctx.household.id),
    getUserProfile(),
    getTimeCategories(ctx.household.id),
    getUserTheme(),
    getAssistantState(),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-cc-primary">Ajustes de Tiempo</h1>
        <p className="text-[13px] text-cc-secondary">
          Perfil y hogar compartidos · preferencias del módulo Tiempo
        </p>
      </div>

      <TiempoAjustesGuideBanner guide={params.guide ?? null} />

      {assistantState && (
        <AssistantSettingsPanel
          module="time"
          status={assistantState.time.status}
          completedCount={assistantState.time.completedCount}
          totalCount={assistantState.time.totalCount}
        />
      )}

      {profile && (
        <section className="cc-surface rounded-[24px] p-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-cc-muted mb-3">
            Compartido
          </p>
          <ProfileSettingsForm
            initialFullName={profile.fullName ?? ''}
            initialAvatarUrl={profile.avatarUrl}
            email={profile.email}
            accent="time"
          />
        </section>
      )}

      <section className="cc-surface rounded-[24px] p-5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-cc-muted mb-3">
          Compartido
        </p>
        <ThemeSetting current={theme} accent="time" embedded />
      </section>

      <section className="cc-surface rounded-[24px] p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#6366F1] mb-1">
          Tiempo
        </p>
        <h2 className="text-[15px] font-bold text-cc-primary flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#6366F1]" />
          Categorías de tiempo
        </h2>
        <p className="text-[12px] text-cc-secondary">
          Colores usados en horario y gráficas del hogar.
        </p>
        <ul className="grid grid-cols-2 gap-2">
          {timeCategories.map(cat => (
            <li
              key={cat.id}
              className="flex items-center gap-2 p-2.5 rounded-xl cc-surface-muted text-[12px] font-medium text-cc-primary"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color ?? '#94A3B8' }}
              />
              <CategoryIcon icon={cat.icon} className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{cat.name}</span>
            </li>
          ))}
        </ul>
        <p className="text-[12px] pt-2">
          <Link href="/tiempo/actividades" className="text-[#6366F1] font-semibold">
            Gestionar actividades guardadas →
          </Link>
        </p>
      </section>

      <section className="cc-surface rounded-[24px] p-5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#6366F1] mb-3">
          Tiempo
        </p>
        <ActivityReminderSetting />
      </section>

      <section className="cc-surface rounded-[24px] p-5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-cc-muted mb-3">
          Compartido
        </p>
        <h2 className="text-[15px] font-bold text-cc-primary mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#6366F1]" />
          Tu hogar
        </h2>
        <p className="text-[18px] font-bold text-cc-primary">{ctx.household.name}</p>
        <div className="mt-4 p-3 rounded-2xl cc-surface-muted">
          <p className="text-[11px] text-cc-secondary font-medium mb-1">Código de invitación</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[20px] font-bold tracking-[0.15em] text-cc-primary">
              {ctx.household.invite_code}
            </span>
            <CopyButton text={ctx.household.invite_code} />
          </div>
        </div>
      </section>

      <HouseholdMembersSection
        householdId={ctx.household.id}
        members={members}
        currentUserId={ctx.user.id}
      />

      <ResetTimeDataButton householdId={ctx.household.id} />

      <DeleteAccountButton email={ctx.user.email} />

      <section className="cc-surface rounded-[24px] p-5">
        <h2 className="text-[15px] font-bold text-cc-primary mb-3">Sesión</h2>
        <p className="text-[13px] text-cc-secondary mb-4">{ctx.user.email}</p>
        <SignOutButton />
      </section>

      <p className="text-center text-[11px] text-cc-muted pb-2">
        <Link href="/ajustes" className="text-[#6366F1] font-semibold">
          Ver ajustes de Finanzas →
        </Link>
      </p>
    </div>
  )
}
