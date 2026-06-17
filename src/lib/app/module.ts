export type AppModule = 'finance' | 'time'

export function getAppModule(pathname: string): AppModule {
  return pathname.startsWith('/tiempo') ? 'time' : 'finance'
}

export function moduleHomePath(module: AppModule): string {
  return module === 'time' ? '/tiempo' : '/'
}
