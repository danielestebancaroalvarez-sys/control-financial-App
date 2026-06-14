import { GoogleGenerativeAI } from '@google/generative-ai'
import type { WeeklyInsight } from '@/lib/finance/types'

const MODEL = 'gemini-2.5-flash-lite'

export type InsightContext = {
  currency: string
  period: string
  periodStart: string
  periodEnd: string
  realBalance: number
  income: number
  expenses: number
  guiltFreeMoney: number
  periodSavings: number
  totalSavingsAccumulated: number
  topCategories: { name: string; amount: number; percentOfExpenses: number }[]
  expenseGroups: { name: string; amount: number }[]
  savingsGoals: { name: string; percent: number; current: number; target: number }[]
  mercadoProjection: {
    spentSoFar: number
    projectedTotal: number
    historicalAverage: number
    percentVsAverage: number
    daysRemaining: number
  } | null
  pendingPayments: { name: string; amount: number; category: string | null }[]
  paidPaymentsCount: number
  totalPaymentsCount: number
  shoppingListDueCount: number
}

const INSIGHT_PROMPT = `Eres un asesor financiero para parejas que usan CoupleCash.
Analizas el mes en curso del hogar. Recibes métricas reales en JSON.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{
  "summary": string,
  "tips": string[]
}

Reglas del summary (2-3 frases):
- Empieza con el estado general del mes (bien / apretado / en rojo) según guiltFreeMoney y gastos vs ingresos.
- Menciona el dato más relevante: mayor categoría de gasto, mercado proyectado, o pagos pendientes.
- Usa cifras del JSON; no inventes montos.

Reglas de tips (exactamente 3):
1. Un tip sobre control de gastos o categoría que más pesa.
2. Un tip sobre ahorros, metas o dinero libre de culpa.
3. Un tip sobre mercado, pagos recurrentes pendientes o lista de compra (si aplica).

Tono: cercano, directo, en español. Sin jerga técnica. Máx. 130 caracteres por tip.`

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
      temperature: 0.35,
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
