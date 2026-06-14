export const TAB_ROUTES = [
  '/',
  '/buscar',
  '/nuevo',
  '/ahorros',
  '/predicciones',
] as const

export type TabRoute = (typeof TAB_ROUTES)[number]

export function getTabIndex(pathname: string): number {
  if (pathname.startsWith('/ajustes')) return -1
  if (pathname.startsWith('/mercado')) {
    return TAB_ROUTES.indexOf('/predicciones')
  }

  const idx = TAB_ROUTES.findIndex(
    route => route === pathname || (route !== '/' && pathname.startsWith(route))
  )
  return idx === -1 ? 0 : idx
}

export function getTabDirection(from: string, to: string): 1 | -1 {
  const fromIdx = getTabIndex(from)
  const toIdx = getTabIndex(to)
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return 1
  return toIdx > fromIdx ? 1 : -1
}
