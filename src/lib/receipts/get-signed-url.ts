import { createClient } from '@/utils/supabase/server'

export async function getReceiptSignedUrl(
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  if (!path) return null

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('receipts')
    .createSignedUrl(path, expiresIn)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
