import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getAuthUser } from '@/lib/auth/session'
import { getUserHousehold } from '@/lib/household/queries'
import { getUserTheme, getUserProfile } from '@/lib/profile/queries'
import { AppHeader } from '@/components/layout/app-header'
import { BottomTabBar } from '@/components/layout/bottom-tab-bar'
import { MainContent } from '@/components/layout/main-content'
import { HouseholdSync } from '@/components/realtime/household-sync'
import { PaymentReminderManager } from '@/components/notifications/payment-reminder-manager'
import { ActivityReminderManager } from '@/components/notifications/activity-reminder-manager'
import { PartnerActivityWatcher } from '@/components/notifications/partner-activity-watcher'
import { ApplyTheme } from '@/components/theme/apply-theme'
import { SavedFlashToast } from '@/components/ui/saved-flash-toast'
import { AssistantWelcomeModal } from '@/components/setup/assistant-welcome-modal'
import { SetupTourHost } from '@/components/setup/setup-tour-host'
import { AssistantActivateHandler } from '@/components/setup/assistant-activate-handler'
import { getAssistantState } from '@/lib/setup/assistant-queries'
import { getFirstName } from '@/lib/utils/name'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const [household, theme, profile, assistantState] = await Promise.all([
    getUserHousehold(),
    getUserTheme(),
    getUserProfile(),
    getAssistantState(),
  ])
  if (!household) redirect('/onboarding')

  const displayName = profile?.fullName ?? 'Usuario'
  const firstName = getFirstName(displayName)
  const avatarUrl = profile?.avatarUrl ?? null

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
      <ActivityReminderManager />
      <Suspense fallback={null}>
        <SavedFlashToast />
      </Suspense>
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <AppHeader
          firstName={firstName}
          email={user.email}
          avatarUrl={avatarUrl}
          assistantState={assistantState}
        />
        <MainContent>{children}</MainContent>
        {assistantState && <AssistantWelcomeModal state={assistantState} />}
        <Suspense fallback={null}>
          <SetupTourHost />
        </Suspense>
        <Suspense fallback={null}>
          <AssistantActivateHandler />
        </Suspense>
        <BottomTabBar />
      </div>
    </div>
  )
}
