import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getUserHousehold } from '@/lib/household/queries'
import { processDueRecurringSchedules } from '@/lib/finance/recurring'
import { AppHeader } from '@/components/layout/app-header'
import { BottomTabBar } from '@/components/layout/bottom-tab-bar'
import { PageTransition } from '@/components/layout/page-transition'
import { HouseholdSync } from '@/components/realtime/household-sync'
import { getFirstName } from '@/lib/utils/name'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const household = await getUserHousehold()
  if (!household) redirect('/onboarding')

  await processDueRecurringSchedules()

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
    <div className="min-h-screen bg-gradient-to-br from-[#B2EBF2] via-[#C8F0DC] to-[#FFE0B2]">
      <HouseholdSync householdId={household.id} />
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <AppHeader firstName={firstName} email={user.email} avatarUrl={avatarUrl} />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomTabBar />
      </div>
    </div>
  )
}
