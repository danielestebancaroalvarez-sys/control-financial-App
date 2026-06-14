export const TAB_ROUTES = [
  '/',
  '/buscar',
  '/nuevo',
  '/ahorros',
  '/predicciones',
  '/ajustes',
] as const

export type TabRoute = (typeof TAB_ROUTES)[number]

export function getTabIndex(pathname: string): number {
  const idx = TAB_ROUTES.findIndex(
    route => route === pathname || (route !== '/' && pathname.startsWith(route))
  )
  return idx === -1 ? 0 : idx
}

export function getTabDirection(from: string, to: string): 1 | -1 {
  const fromIdx = getTabIndex(from)
  const toIdx = getTabIndex(to)
  if (fromIdx === toIdx) return 1
  return toIdx > fromIdx ? 1 : -1
}

export const PERIOD_ROUTES = ['/', '/buscar', '/predicciones'] as const

export function showsPeriodToggle(pathname: string): boolean {
  return (PERIOD_ROUTES as readonly string[]).includes(pathname)
}
