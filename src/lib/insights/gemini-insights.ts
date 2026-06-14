import { GoogleGenerativeAI } from '@google/generative-ai'
import type { WeeklyInsight } from '@/lib/finance/types'

const MODEL = 'gemini-2.5-flash-lite'

export type InsightContext = {
  currency: string
  period: string
  income: number
  expenses: number
  guiltFreeMoney: number
  periodSavings: number
  topCategories: { name: string; amount: number }[]
  mercadoProjection: {
    spentSoFar: number
    projectedTotal: number
    historicalAverage: number
    percentVsAverage: number
  } | null
  pendingPayments: { name: string; amount: number }[]
  paidPaymentsCount: number
  totalPaymentsCount: number
}

const INSIGHT_PROMPT = `Eres un asesor financiero para parejas que usan CoupleCash.
Recibes métricas del hogar en JSON. Responde ÚNICAMENTE con JSON válido (sin markdown):
{
  "summary": string,
  "tips": string[]
}

Reglas:
- Escribe en español, tono cercano y práctico (máx. 2 frases en summary).
- Genera exactamente 3 tips accionables y concretos.
- Usa los montos del JSON; no inventes cifras.
- Si guiltFreeMoney es negativo, advierte con tacto.
- Si mercadoProjection.percentVsAverage > 10, menciona el sobreconsumo en mercado.
- Tips cortos (máx. 120 caracteres cada uno).`

function parseInsightResponse(text: string): WeeklyInsight {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')

  const parsed = JSON.parse(cleaned) as Partial<WeeklyInsight>
  const tips = Array.isArray(parsed.tips)
    ? parsed.tips.map(t => String(t).trim()).filter(Boolean).slice(0, 3)
    : []

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
    tips,
    generatedAt: new Date().toISOString(),
  }
}

export async function generateWeeklyInsight(
  context: InsightContext
): Promise<WeeklyInsight> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no configurada.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  })

  const result = await model.generateContent([
    INSIGHT_PROMPT,
    JSON.stringify(context, null, 0),
  ])

  const text = result.response.text()
  const insight = parseInsightResponse(text)

  if (!insight.summary && insight.tips.length === 0) {
    throw new Error('La IA no generó insights válidos.')
  }

  return insight
}
