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

const INSIGHT_PROMPT = `Eres el coach financiero de CoupleCash, una app para parejas que gestionan el hogar juntos.
Recibes métricas reales del mes en curso (JSON). Tu trabajo es dar un diagnóstico claro y consejos que se puedan actuar HOY.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{
  "summary": string,
  "tips": string[]
}

SUMMARY (2-3 frases, máx. 280 caracteres total):
- Abre con el estado del mes en lenguaje humano: "van bien", "van apretados" o "van en rojo" según guiltFreeMoney y gastos vs ingresos.
- Cita al menos un número concreto del JSON (monto o porcentaje).
- Si hay un riesgo claro (mercado por encima del promedio, pagos pendientes, dinero libre negativo), nómbralo con prioridad.
- Habla al hogar en plural ("ustedes", "su mes"). Sin jerga contable.

TIPS (exactamente 3, máx. 120 caracteres cada uno):
1. ACCIÓN de gasto: qué categoría recortar o vigilar, con cifra o % del JSON.
2. ACCIÓN de ahorro: meta concreta, aporte o cuánto les queda de dinero libre de culpa.
3. ACCIÓN operativa: mercado, pago recurrente pendiente o lista de compra — solo si aplica; si no, un hábito semanal para el hogar.

Reglas:
- Usa SOLO datos del JSON; nunca inventes montos ni categorías.
- Sé directo, empático y práctico. Sin frases genéricas tipo "revisa tu presupuesto".
- Si guiltFreeMoney < 0, el tono es urgente pero calmado, no alarmista.
- Si van bien, celebra brevemente y sugiere mantener el ritmo.`

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
