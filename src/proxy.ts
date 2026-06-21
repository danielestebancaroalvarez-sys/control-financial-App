import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'
import type { SupabaseClient } from '@supabase/supabase-js'

async function getSetupFlags(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  financeSetupCompleted: boolean
  timeSetupCompleted: boolean
  travelSetupCompleted: boolean
}> {
  const withTravel = await supabase
    .from('profiles')
    .select(
      'setup_completed_at, time_setup_completed_at, travel_setup_completed_at'
    )
    .eq('id', userId)
    .maybeSingle()

  if (!withTravel.error && withTravel.data) {
    return {
      financeSetupCompleted: !!withTravel.data.setup_completed_at,
      timeSetupCompleted: !!withTravel.data.time_setup_completed_at,
      travelSetupCompleted: !!withTravel.data.travel_setup_completed_at,
    }
  }

  // Migration de Viajes aún no aplicada: columna travel_setup_completed_at no existe
  const fallback = await supabase
    .from('profiles')
    .select('setup_completed_at, time_setup_completed_at')
    .eq('id', userId)
    .maybeSingle()

  return {
    financeSetupCompleted: !!fallback.data?.setup_completed_at,
    timeSetupCompleted: !!fallback.data?.time_setup_completed_at,
    travelSetupCompleted: true,
  }
}

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/auth')
  const isOnboardingRoute = pathname.startsWith('/onboarding')
  const isFinanceSetupRoute = pathname.startsWith('/configuracion-inicial')
  const isTimeSetupRoute = pathname.startsWith('/tiempo/configuracion-inicial')
  const isTravelSetupRoute = pathname.startsWith('/viajes/configuracion-inicial')
  const isTimeModule =
    pathname === '/tiempo' || pathname.startsWith('/tiempo/')
  const isTravelModule =
    pathname === '/viajes' || pathname.startsWith('/viajes/')
  const isFinanceModule = !isTimeModule && !isTravelModule

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const [{ data: membership }, setupFlags] = await Promise.all([
      supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle(),
      getSetupFlags(supabase, user.id),
    ])

    const hasHousehold = !!membership
    const financeSetupCompleted = setupFlags.financeSetupCompleted
    const timeSetupCompleted = setupFlags.timeSetupCompleted
    const travelSetupCompleted = setupFlags.travelSetupCompleted

    if (!hasHousehold && !isOnboardingRoute && !isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    if (hasHousehold && isOnboardingRoute) {
      const url = request.nextUrl.clone()
      url.pathname = financeSetupCompleted ? '/' : '/configuracion-inicial'
      return NextResponse.redirect(url)
    }

    if (hasHousehold && !isAuthRoute && !isOnboardingRoute) {
      if (
        isTravelModule &&
        !isTravelSetupRoute &&
        !travelSetupCompleted
      ) {
        const url = request.nextUrl.clone()
        url.pathname = '/viajes/configuracion-inicial'
        return NextResponse.redirect(url)
      }

      if (
        isTimeModule &&
        !isTimeSetupRoute &&
        !timeSetupCompleted
      ) {
        const url = request.nextUrl.clone()
        url.pathname = '/tiempo/configuracion-inicial'
        return NextResponse.redirect(url)
      }

      if (
        isFinanceModule &&
        !isFinanceSetupRoute &&
        !financeSetupCompleted
      ) {
        const url = request.nextUrl.clone()
        url.pathname = '/configuracion-inicial'
        return NextResponse.redirect(url)
      }
    }

    if (hasHousehold && financeSetupCompleted && isFinanceSetupRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    if (hasHousehold && timeSetupCompleted && isTimeSetupRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/tiempo'
      return NextResponse.redirect(url)
    }

    if (hasHousehold && travelSetupCompleted && isTravelSetupRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/viajes'
      return NextResponse.redirect(url)
    }

    if (pathname === '/login') {
      const url = request.nextUrl.clone()
      if (!hasHousehold) {
        url.pathname = '/onboarding'
      } else if (!financeSetupCompleted) {
        url.pathname = '/configuracion-inicial'
      } else {
        url.pathname = '/'
      }
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
