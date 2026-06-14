import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { getUserHousehold } from '@/lib/household/queries'
import { getUserTheme } from '@/lib/profile/queries'
import { AppHeader } from '@/components/layout/app-header'
import { BottomTabBar } from '@/components/layout/bottom-tab-bar'
import { HouseholdSync } from '@/components/realtime/household-sync'
import { PaymentReminderManager } from '@/components/notifications/payment-reminder-manager'
import { PartnerActivityWatcher } from '@/components/notifications/partner-activity-watcher'
import { ApplyTheme } from '@/components/theme/apply-theme'
import { getFirstName } from '@/lib/utils/name'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const [household, theme] = await Promise.all([
    getUserHousehold(),
    getUserTheme(),
  ])
  if (!household) redirect('/onboarding')

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'Usuario'

  const firstName = getFirstName(displayName)
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined)

  return (
    <div className="min-h-screen cc-app-bg">
      <ApplyTheme theme={theme} />
      <HouseholdSync householdId={household.id} />
      <PartnerActivityWatcher
        householdId={household.id}
        currentUserId={user.id}
        currency={household.base_currency}
      />
      <PaymentReminderManager />
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <AppHeader firstName={firstName} email={user.email} avatarUrl={avatarUrl} />
        <main className="flex-1">{children}</main>
        <BottomTabBar />
      </div>
    </div>
  )
}
