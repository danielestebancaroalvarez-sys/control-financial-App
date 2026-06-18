import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/auth')
  const isOnboardingRoute = pathname.startsWith('/onboarding')
  const isSetupRoute = pathname.startsWith('/configuracion-inicial')

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const [{ data: membership }, { data: profile }] = await Promise.all([
      supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('setup_completed_at')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    const hasHousehold = !!membership
    const setupCompleted = !!profile?.setup_completed_at

    if (!hasHousehold && !isOnboardingRoute && !isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    if (hasHousehold && isOnboardingRoute) {
      const url = request.nextUrl.clone()
      url.pathname = setupCompleted ? '/' : '/configuracion-inicial'
      return NextResponse.redirect(url)
    }

    if (
      hasHousehold &&
      !setupCompleted &&
      !isSetupRoute &&
      !isAuthRoute
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/configuracion-inicial'
      return NextResponse.redirect(url)
    }

    if (hasHousehold && setupCompleted && isSetupRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    if (pathname === '/login') {
      const url = request.nextUrl.clone()
      if (!hasHousehold) {
        url.pathname = '/onboarding'
      } else if (!setupCompleted) {
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
    /*
     * Excluir estáticos y assets PWA (manifest + service worker deben ser públicos
     * para que el navegador pueda evaluar la instalación).
     */
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
