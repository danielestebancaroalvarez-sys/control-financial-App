export type AppModule = 'finance' | 'time' | 'travel'

export function getAppModule(pathname: string): AppModule {
  if (pathname.startsWith('/viajes')) return 'travel'
  if (pathname.startsWith('/tiempo')) return 'time'
  return 'finance'
}

export function moduleHomePath(module: AppModule): string {
  if (module === 'travel') return '/viajes'
  if (module === 'time') return '/tiempo'
  return '/'
}
