import { createClient } from '@/utils/supabase/server'
import { RECEIPT_MAX_BYTES, RECEIPT_MIME_TYPES } from './types'

export function buildReceiptStoragePath(householdId: string, transactionId: string) {
  return `${householdId}/${transactionId}.jpg`
}

export async function uploadReceiptForTransaction(
  householdId: string,
  transactionId: string,
  file: Blob,
  mimeType: string
): Promise<{ error?: string; path?: string }> {
  if (!RECEIPT_MIME_TYPES.includes(mimeType as (typeof RECEIPT_MIME_TYPES)[number])) {
    return { error: 'Formato de imagen no permitido.' }
  }

  if (file.size > RECEIPT_MAX_BYTES) {
    return { error: 'La imagen supera el límite de 5 MB.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const { data: tx } = await supabase
    .from('transactions')
    .select('id, household_id')
    .eq('id', transactionId)
    .eq('household_id', householdId)
    .maybeSingle()

  if (!tx) return { error: 'Transacción no encontrada.' }

  const path = buildReceiptStoragePath(householdId, transactionId)
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (uploadError) {
    return { error: 'No se pudo guardar la imagen del recibo.' }
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ receipt_image_path: path })
    .eq('id', transactionId)
    .eq('household_id', householdId)

  if (updateError) {
    return { error: 'Recibo subido pero no se pudo vincular a la transacción.' }
  }

  return { path }
}
