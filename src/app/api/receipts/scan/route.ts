import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getHouseholdBaseCurrency } from '@/lib/finance/queries'
import { scanReceiptWithGemini } from '@/lib/receipts/gemini-scanner'
import { RECEIPT_MAX_BYTES, RECEIPT_MIME_TYPES } from '@/lib/receipts/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
    }

    const formData = await request.formData()
    const householdId = String(formData.get('householdId') ?? '')
    const categoryId = String(formData.get('categoryId') ?? '')
    const image = formData.get('image')

    if (!householdId || !categoryId || !(image instanceof Blob)) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 })
    }

    const { data: category } = await supabase
      .from('categories')
      .select('id, name, household_id, type')
      .eq('id', categoryId)
      .eq('household_id', householdId)
      .maybeSingle()

    if (!category || category.name !== 'Mercado' || category.type !== 'expense') {
      return NextResponse.json(
        { error: 'El escaneo de recibos solo está disponible para la categoría Mercado.' },
        { status: 400 }
      )
    }

    const mimeType = image.type || 'image/jpeg'
    if (!RECEIPT_MIME_TYPES.includes(mimeType as (typeof RECEIPT_MIME_TYPES)[number])) {
      return NextResponse.json({ error: 'Formato de imagen no permitido.' }, { status: 400 })
    }

    if (image.size > RECEIPT_MAX_BYTES) {
      return NextResponse.json({ error: 'Imagen demasiado grande (máx. 5 MB).' }, { status: 400 })
    }

    const baseCurrency = await getHouseholdBaseCurrency(householdId)
    const buffer = Buffer.from(await image.arrayBuffer())
    const parsed = await scanReceiptWithGemini(buffer, mimeType, baseCurrency)

    return NextResponse.json({ receipt: parsed })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'No se pudo analizar el recibo.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
