export type ParsedReceiptItem = {
  name: string
  price: number
  quantity?: number
}

export type ParsedReceipt = {
  storeName: string | null
  transactionDate: string | null
  currency: 'AUD' | 'COP' | null
  items: ParsedReceiptItem[]
  subtotal: number | null
  total: number | null
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
}

export const RECEIPT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024
