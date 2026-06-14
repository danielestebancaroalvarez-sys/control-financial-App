import type { TransactionListItem } from '@/lib/finance/types'

const CACHE_PREFIX = 'couplecash_buscar_'

type SearchCacheEntry = {
  results: TransactionListItem[]
  savedAt: number
}

export function getSearchCacheKey(params: string): string {
  return params || 'default'
}

export function readSearchCache(key: string): TransactionListItem[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!raw) return null
    const entry = JSON.parse(raw) as SearchCacheEntry
    return entry.results ?? null
  } catch {
    return null
  }
}

export function writeSearchCache(key: string, results: TransactionListItem[]) {
  if (typeof window === 'undefined') return
  try {
    const entry: SearchCacheEntry = { results, savedAt: Date.now() }
    sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry))
  } catch {
    // sessionStorage full or unavailable
  }
}
