import { cache } from 'react'
import { getAuthUser } from '@/lib/auth/session'
import { getUserHousehold } from '@/lib/household/queries'
import { getUserDashboardPeriod, getUserTheme } from '@/lib/profile/queries'

export const getMainAppContext = cache(async () => {
  const [user, household] = await Promise.all([
    getAuthUser(),
    getUserHousehold(),
  ])

  if (!user || !household) return null

  return { user, household }
})

export const getMainAppContextWithPeriod = cache(async () => {
  const ctx = await getMainAppContext()
  if (!ctx) return null

  const [period, theme] = await Promise.all([
    getUserDashboardPeriod(),
    getUserTheme(),
  ])
  return { ...ctx, period, theme }
})
