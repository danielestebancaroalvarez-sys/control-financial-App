import { GoogleGenerativeAI } from '@google/generative-ai'
import type { CurrencyCode } from '@/lib/household/types'
import { normalizeParsedReceipt } from './sanitize-items'
import type { ParsedReceipt } from './types'

const MODEL = 'gemini-2.5-flash-lite'

const RECEIPT_PROMPT = `Analiza esta imagen de un recibo de supermercado o tienda.
Responde ÚNICAMENTE con JSON válido (sin markdown) con esta estructura exacta:
{
  "storeName": string | null,
  "transactionDate": "YYYY-MM-DD" | null,
  "currency": "AUD" | "COP" | null,
  "items": [{ "name": string, "price": number, "quantity": number | null }],
  "subtotal": number | null,
  "total": number | null,
  "confidence": "high" | "medium" | "low",
  "warnings": string[]
}

Reglas:
- "items": solo productos comprados, no subtotales, IVA, cambio ni totales.
- "price": precio total de la línea (no unitario si hay cantidad).
- Si la moneda no es clara, usa null.
- Si la fecha no es clara, usa null.
- Incluye warnings si el recibo está borroso o incompleto.`

function parseJsonResponse(text: string): ParsedReceipt {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')

  const parsed = JSON.parse(cleaned) as Partial<ParsedReceipt>

  return normalizeParsedReceipt({
    storeName: typeof parsed.storeName === 'string' ? parsed.storeName : null,
    transactionDate:
      typeof parsed.transactionDate === 'string' ? parsed.transactionDate : null,
    currency:
      parsed.currency === 'AUD' || parsed.currency === 'COP' ? parsed.currency : null,
    items: Array.isArray(parsed.items)
      ? parsed.items
          .map(item => {
            if (!item || typeof item !== 'object') return null
            const record = item as Record<string, unknown>
            const name = String(record.name ?? '').trim()
            const price = Number(record.price) || 0
            const quantity =
              record.quantity != null ? Number(record.quantity) || undefined : undefined
            if (!name || price <= 0) return null
            return { name, price, quantity }
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
      : [],
    subtotal: typeof parsed.subtotal === 'number' ? parsed.subtotal : null,
    total: typeof parsed.total === 'number' ? parsed.total : null,
    confidence:
      parsed.confidence === 'high' ||
      parsed.confidence === 'medium' ||
      parsed.confidence === 'low'
        ? parsed.confidence
        : 'medium',
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings.map(w => String(w))
      : [],
  })
}

export async function scanReceiptWithGemini(
  imageBytes: Buffer,
  mimeType: string,
  baseCurrency: CurrencyCode
): Promise<ParsedReceipt> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no configurada.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  })

  const result = await model.generateContent([
    RECEIPT_PROMPT,
    {
      inlineData: {
        mimeType,
        data: imageBytes.toString('base64'),
      },
    },
  ])

  const text = result.response.text()
  if (!text) throw new Error('Gemini no devolvió respuesta.')

  const parsed = parseJsonResponse(text)

  if (!parsed.currency) {
    parsed.currency = baseCurrency
  }

  return parsed
}
