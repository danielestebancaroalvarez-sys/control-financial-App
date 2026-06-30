'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, ImageIcon, Loader2, ScanLine } from 'lucide-react'
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
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
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
      <div className="cc-scan-card rounded-2xl p-4 space-y-2" data-tour="receipt-scanner">
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-[#00BFA5]" />
          <span className="text-[13px] font-semibold text-cc-primary">
            Escanear recibo con IA
          </span>
        </div>
        <p className="text-[11px] text-cc-secondary">
          Extrae productos, total y fecha. Toma una foto o elige una de tu galería.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={scanning}
            onClick={() => cameraRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00BFA5] text-white text-[12px] font-bold disabled:opacity-60"
          >
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {previewUrl ? 'Otra foto' : 'Tomar foto'}
          </button>
          <button
            type="button"
            disabled={scanning}
            onClick={() => galleryRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl cc-surface-solid border border-[var(--cc-border)] text-[12px] font-bold text-cc-primary disabled:opacity-60"
          >
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 text-[#00BFA5]" />
            )}
            Galería
          </button>
        </div>
        {scanning && (
          <p className="text-[11px] text-cc-secondary text-center flex items-center justify-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analizando recibo...
          </p>
        )}
        {error && <p className="text-[11px] text-red-600">{error}</p>}
      </div>

      <input
        ref={cameraRef}
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
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
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
