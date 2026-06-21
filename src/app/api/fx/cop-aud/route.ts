import { NextResponse } from 'next/server'
import { getCopAudRates } from '@/lib/finance/exchange-rates'

export async function GET() {
  const rates = await getCopAudRates()

  if (!rates) {
    return NextResponse.json(
      { error: 'No se pudo obtener la tasa de cambio.' },
      { status: 502 }
    )
  }

  return NextResponse.json(rates)
}
