import { normalizeProductName } from './market-product-keywords'
import type { ShoppingListItem } from './market-analytics'

export type ShoppingListDiff = {
  matched: { listItem: ShoppingListItem; scannedName: string }[]
  missing: ShoppingListItem[]
  extra: { name: string; price: number }[]
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeProductName(a)
  const nb = normalizeProductName(b)
  if (!na || !nb) return false
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true

  const aWords = na.split(' ').filter(w => w.length > 2)
  const bWords = nb.split(' ').filter(w => w.length > 2)
  if (aWords.length === 0 || bWords.length === 0) return false

  const overlap = aWords.filter(w => bWords.some(bw => bw.includes(w) || w.includes(bw)))
  return overlap.length >= Math.min(2, Math.min(aWords.length, bWords.length))
}

export function diffReceiptAgainstShoppingList(
  scannedItems: { name: string; price: number }[],
  shoppingList: ShoppingListItem[]
): ShoppingListDiff {
  const matched: ShoppingListDiff['matched'] = []
  const missing: ShoppingListItem[] = []
  const extra: ShoppingListDiff['extra'] = []
  const usedScanned = new Set<number>()

  for (const listItem of shoppingList) {
    const scanIdx = scannedItems.findIndex(
      (item, i) => !usedScanned.has(i) && namesMatch(listItem.name, item.name)
    )
    if (scanIdx >= 0) {
      matched.push({ listItem, scannedName: scannedItems[scanIdx].name })
      usedScanned.add(scanIdx)
    } else {
      missing.push(listItem)
    }
  }

  scannedItems.forEach((item, i) => {
    if (!usedScanned.has(i)) {
      extra.push(item)
    }
  })

  return { matched, missing, extra }
}
