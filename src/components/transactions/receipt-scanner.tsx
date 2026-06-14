'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, ScanLine } from 'lucide-react'
import { compressReceiptImage } from '@/lib/receipts/compress-image'
import type { ParsedReceipt } from '@/lib/receipts/types'
import type { ShoppingListItem } from '@/lib/finance/market-analytics'
import { ReceiptReviewSheet } from './receipt-review-sheet'

export function ReceiptScanner({
  householdId,
  categoryId,
  previewUrl,
  onSelectFile,
  onApply,
}: {
  householdId: string
  categoryId: string
  previewUrl: string | null
  onSelectFile: (file: File, previewUrl: string) => void
  onApply: (receipt: ParsedReceipt) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null)
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([])

  useEffect(() => {
    fetch(`/api/market/shopping-list?householdId=${householdId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.shoppingList)) {
          setShoppingList(data.shoppingList)
        }
      })
      .catch(() => {})
  }, [householdId])

  async function handleScan(file: File) {
    setScanning(true)
    setError(null)
    setParsed(null)

    try {
      const compressed = await compressReceiptImage(file)
      const preview = URL.createObjectURL(compressed)
      onSelectFile(
        new File([compressed], 'receipt.jpg', { type: 'image/jpeg' }),
        preview
      )

      const formData = new FormData()
      formData.append('householdId', householdId)
      formData.append('categoryId', categoryId)
      formData.append('image', compressed, 'receipt.jpg')

      const res = await fetch('/api/receipts/scan', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudo escanear el recibo.')
        return
      }

      setParsed(data.receipt as ParsedReceipt)
    } catch {
      setError('Error de conexión al escanear.')
    } finally {
      setScanning(false)
    }
  }

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-br from-[#E0F2F1] to-[#F5F5F5] p-4 space-y-2 border border-[#00BFA5]/20">
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-[#00BFA5]" />
          <span className="text-[13px] font-semibold text-cc-primary">
            Escanear recibo con IA
          </span>
        </div>
        <p className="text-[11px] text-cc-secondary">
          Extrae productos, total y fecha. Compara con tu lista de compra sugerida.
        </p>
        <button
          type="button"
          disabled={scanning}
          onClick={() => inputRef.current?.click()}
          className="w-full py-2.5 rounded-xl bg-[#00BFA5] text-white text-[12px] font-bold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analizando recibo...
            </>
          ) : (
            <>
              <ScanLine className="w-4 h-4" />
              {previewUrl ? 'Volver a escanear' : 'Escanear recibo'}
            </>
          )}
        </button>
        {error && <p className="text-[11px] text-red-600">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleScan(file)
          e.target.value = ''
        }}
      />

      {parsed && (
        <ReceiptReviewSheet
          receipt={parsed}
          previewUrl={previewUrl}
          shoppingList={shoppingList}
          onApply={data => {
            onApply(data)
            setParsed(null)
          }}
          onClose={() => setParsed(null)}
        />
      )}
    </>
  )
}
