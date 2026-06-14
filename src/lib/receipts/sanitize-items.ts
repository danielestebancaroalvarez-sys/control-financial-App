import type { ParsedReceipt, ParsedReceiptItem } from './types'

const NON_PRODUCT_PATTERNS = [
  /^subtotal$/i,
  /^total$/i,
  /^iva$/i,
  /^tax$/i,
  /^impuesto/i,
  /^cambio$/i,
  /^efectivo$/i,
  /^tarjeta$/i,
  /^descuento$/i,
  /^discount$/i,
  /^propina$/i,
  /^gracias/i,
  /^nit\b/i,
  /^fecha/i,
  /^hora/i,
  /^cajero/i,
  /^caja\b/i,
]

export function sanitizeReceiptItems(items: ParsedReceiptItem[]): ParsedReceiptItem[] {
  return items
    .map(item => ({
      ...item,
      name: item.name.trim(),
      price: Math.round(item.price * 100) / 100,
    }))
    .filter(item => {
      if (!item.name || item.price <= 0) return false
      const normalized = item.name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
      return !NON_PRODUCT_PATTERNS.some(pattern => pattern.test(normalized))
    })
}

export function buildReceiptWarnings(
  items: ParsedReceiptItem[],
  total: number | null
): string[] {
  const warnings: string[] = []
  const sum = Math.round(items.reduce((s, i) => s + i.price, 0) * 100) / 100

  if (items.length === 0) {
    warnings.push('No se detectaron productos. Revisa o ingresa manualmente.')
  }

  if (total !== null && items.length > 0) {
    const diff = Math.abs(sum - total)
    if (diff > Math.max(1, total * 0.05)) {
      warnings.push(
        `La suma de productos (${sum}) no coincide con el total del recibo (${total}).`
      )
    }
  }

  return warnings
}

export function normalizeParsedReceipt(raw: ParsedReceipt): ParsedReceipt {
  const items = sanitizeReceiptItems(raw.items)
  const warnings = [...raw.warnings, ...buildReceiptWarnings(items, raw.total)]

  let confidence = raw.confidence
  if (items.length === 0) confidence = 'low'
  else if (warnings.length > 0 && confidence === 'high') confidence = 'medium'

  return {
    ...raw,
    items,
    warnings: [...new Set(warnings)],
    confidence,
  }
}
