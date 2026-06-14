'use server'

import { revalidatePath } from 'next/cache'
import { uploadReceiptForTransaction } from '@/lib/receipts/upload-receipt'

const REVALIDATE_PATHS = ['/', '/buscar', '/nuevo', '/mercado']

export async function attachReceiptToTransaction(
  householdId: string,
  transactionId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const file = formData.get('receipt')
  if (!(file instanceof Blob) || file.size === 0) {
    return { error: 'No se recibió imagen.' }
  }

  const mimeType = file.type || 'image/jpeg'
  const result = await uploadReceiptForTransaction(
    householdId,
    transactionId,
    file,
    mimeType
  )

  if (result.error) return { error: result.error }

  for (const path of REVALIDATE_PATHS) revalidatePath(path)
  return {}
}
