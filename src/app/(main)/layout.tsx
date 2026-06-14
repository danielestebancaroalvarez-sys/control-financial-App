import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getUserHousehold } from '@/lib/household/queries'
import { AppHeader } from '@/components/layout/app-header'
import { BottomTabBar } from '@/components/layout/bottom-tab-bar'
import { PageTransition } from '@/components/layout/page-transition'

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

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'Usuario'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B2EBF2] via-[#C8F0DC] to-[#FFE0B2]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-28 pt-2">
        <AppHeader displayName={displayName} email={user.email} />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomTabBar />
      </div>
    </div>
  )
}
