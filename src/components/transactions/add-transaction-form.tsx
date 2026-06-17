'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, Plus, Trash2, Check, ShoppingCart,
} from 'lucide-react'
import { createTransaction, createCategory } from '@/lib/finance/actions'
import { attachReceiptToTransaction } from '@/lib/receipts/actions'
import { compressReceiptImage } from '@/lib/receipts/compress-image'
import type { ParsedReceipt } from '@/lib/receipts/types'
import { ReceiptAttachment } from './receipt-attachment'
import { ReceiptScanner } from './receipt-scanner'
import { getTodayString } from '@/lib/finance/format'
import { TX_TYPE_THEME, type TxType } from './tx-type-theme'
import { CategoryIcon } from './category-icon'
import type { Category, LineItem } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

const TODAY = getTodayString()

export function AddTransactionForm({
  householdId,
  baseCurrency,
  categories,
  authorName,
  onSuccess,
  defaultType = 'expense',
  hideTypeSelector = false,
}: {
  householdId: string
  baseCurrency: CurrencyCode
  categories: Category[]
  authorName: string
  onSuccess?: () => void
  defaultType?: TxType
  hideTypeSelector?: boolean
}) {
  const router = useRouter()
  const [txType, setTxType] = useState<TxType>(defaultType)
  const theme = TX_TYPE_THEME[txType]

  useEffect(() => {
    setTxType(defaultType)
  }, [defaultType])
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(TODAY)
  const [lineItemsEnabled, setLineItemsEnabled] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([{ name: '', price: 0 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null)
  const [receiptUploadWarning, setReceiptUploadWarning] = useState<string | null>(null)

  const filteredCategories = useMemo(
    () => categories.filter(c => c.type === txType && c.name !== 'Ahorro'),
    [categories, txType]
  )

  const selectedCategory = filteredCategories.find(
    c => c.id === (categoryId || filteredCategories[0]?.id)
  )
  const isMercado = selectedCategory?.name === 'Mercado'

  const displayAmount = useMemo(() => {
    if (lineItemsEnabled && isMercado) {
      return lineItems.reduce((s, i) => s + (i.price || 0), 0)
    }
    return parseFloat(amount) || 0
  }, [lineItemsEnabled, isMercado, lineItems, amount])

  function handleTypeChange(type: TxType) {
    setTxType(type)
    setCategoryId('')
    setLineItemsEnabled(false)
    clearReceipt()
  }

  function clearReceipt() {
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl)
    setReceiptFile(null)
    setReceiptPreviewUrl(null)
    setReceiptUploadWarning(null)
  }

  async function handleReceiptSelect(file: File) {
    const compressed = await compressReceiptImage(file)
    const preview = URL.createObjectURL(compressed)
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl)
    setReceiptFile(new File([compressed], 'receipt.jpg', { type: 'image/jpeg' }))
    setReceiptPreviewUrl(preview)
    setReceiptUploadWarning(null)
  }

  function handleReceiptSelectFromScanner(file: File, previewUrl: string) {
    if (receiptPreviewUrl && receiptPreviewUrl !== previewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl)
    }
    setReceiptFile(file)
    setReceiptPreviewUrl(previewUrl)
    setReceiptUploadWarning(null)
  }

  function handleApplyScannedReceipt(receipt: ParsedReceipt) {
    if (receipt.storeName) setDescription(receipt.storeName)
    if (receipt.transactionDate && receipt.transactionDate <= TODAY) {
      setDate(receipt.transactionDate)
    }
    if (receipt.items.length > 0) {
      setLineItemsEnabled(true)
      setLineItems(receipt.items)
    } else if (receipt.total && receipt.total > 0) {
      setAmount(String(receipt.total))
    }
  }

  function addLineItem() {
    setLineItems(prev => [...prev, { name: '', price: 0 }])
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    setLineItems(prev =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value }
          : item
      )
    )
  }

  function removeLineItem(index: number) {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    setCreatingCategory(true)
    const result = await createCategory({
      householdId,
      name: newCategoryName.trim(),
      type: txType,
    })
    setCreatingCategory(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setShowNewCategory(false)
    setNewCategoryName('')
    if (result.id) setCategoryId(result.id)
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (date > TODAY) {
      setError(
        'No puedes registrar movimientos con fecha futura. Usa la sección de ingresos y gastos fijos para programar repetición.'
      )
      setLoading(false)
      return
    }

    const catId = categoryId || filteredCategories[0]?.id
    if (!catId) {
      setError('Selecciona una categoría.')
      setLoading(false)
      return
    }

    const desc = description.trim() || selectedCategory?.name || 'Movimiento'
    const parsedAmount = displayAmount

    if (parsedAmount <= 0) {
      setError('Ingresa un monto válido.')
      setLoading(false)
      return
    }

    const result = await createTransaction({
      householdId,
      type: txType,
      categoryId: catId,
      description: desc,
      amount: parsedAmount,
      currency: baseCurrency,
      transactionDate: date,
      lineItems:
        lineItemsEnabled && isMercado
          ? lineItems.filter(i => i.name.trim() && i.price > 0)
          : undefined,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (receiptFile && result.id) {
      const formData = new FormData()
      formData.append('receipt', receiptFile)
      const uploadResult = await attachReceiptToTransaction(
        householdId,
        result.id,
        formData
      )
      if (uploadResult.error) {
        setReceiptUploadWarning(
          'Gasto guardado, pero no se pudo adjuntar el recibo: ' + uploadResult.error
        )
        setLoading(false)
        return
      }
    }

    setLoading(false)
    onSuccess?.()
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!hideTypeSelector && (
        <div>
          <p className="text-[12px] font-semibold text-cc-secondary text-center mb-2">
            Tipo de movimiento
          </p>
          <div className="flex rounded-2xl cc-surface-muted p-1">
            {(['income', 'expense'] as const).map(type => {
              const t = TX_TYPE_THEME[type]
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                    txType === type
                      ? `bg-gradient-to-r ${t.gradient} text-white shadow-sm`
                      : 'text-cc-secondary'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="text-center py-2">
        <p className={`text-[36px] font-bold tracking-tight ${theme.text}`}>
          {baseCurrency === 'COP' ? '$' : '$ '}
          {displayAmount.toFixed(baseCurrency === 'COP' ? 0 : 2)}
        </p>
        {!lineItemsEnabled && (
          <div>
            <label className="text-[11px] text-cc-secondary font-medium">Monto</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className={`mt-1 w-40 mx-auto block text-center text-[14px] px-3 py-2 rounded-xl cc-surface-muted outline-none ring-2 ring-transparent ${theme.focus}`}
            />
          </div>
        )}
      </div>

      <div>
        <p className="text-[11px] font-semibold text-cc-secondary mb-2">Categoría</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {filteredCategories.map(cat => {
            const active = (categoryId || filteredCategories[0]?.id) === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoryId(cat.id)
                  if (cat.name !== 'Mercado') setLineItemsEnabled(false)
                }}
                className={`shrink-0 flex flex-col items-center gap-1.5 w-[4.5rem] py-3 rounded-2xl transition-all ${
                  active
                    ? `bg-gradient-to-br ${theme.gradient} text-white shadow-md`
                    : 'cc-surface-muted text-cc-secondary'
                }`}
              >
                <CategoryIcon icon={cat.icon} className="w-5 h-5" />
                <span className="text-[9px] font-semibold text-center leading-tight px-1">
                  {cat.name}
                </span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setShowNewCategory(v => !v)}
            className={`shrink-0 flex flex-col items-center justify-center gap-1 w-[4.5rem] py-3 rounded-2xl border-2 border-dashed ${theme.ring} ${theme.text}`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Nueva</span>
          </button>
        </div>
        {showNewCategory && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="Nombre categoría"
              className="flex-1 px-3 py-2 rounded-xl bg-[#F5F5F5] text-[13px] outline-none"
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={creatingCategory}
              className={`px-4 py-2 rounded-xl text-white text-[12px] font-bold disabled:opacity-60 bg-gradient-to-r ${theme.gradient}`}
            >
              {creatingCategory ? '...' : 'Crear'}
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="text-[11px] font-semibold text-cc-secondary">Descripción</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={
            selectedCategory?.name === 'Suscripciones'
              ? 'Ej: Netflix, Spotify, Disney+...'
              : 'Ej: Cena, Salario marzo...'
          }
          className={`mt-1 w-full px-4 py-3 rounded-xl cc-surface-muted text-[14px] outline-none ring-2 ring-transparent ${theme.focus}`}
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-cc-secondary">
          Fecha del movimiento
        </label>
        <p className="text-[10px] text-cc-muted mb-1">
          Solo hoy o fechas pasadas. Para repetir, cambia al tab Fijos.
        </p>
        <input
          type="date"
          value={date}
          max={TODAY}
          onChange={e => setDate(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl cc-surface-muted text-[14px] outline-none ring-2 ring-transparent ${theme.focus}`}
        />
      </div>

      {txType === 'expense' && (
        <ReceiptAttachment
          previewUrl={receiptPreviewUrl}
          onSelect={handleReceiptSelect}
          onClear={clearReceipt}
        />
      )}

      {isMercado && txType === 'expense' && (
        <ReceiptScanner
          householdId={householdId}
          categoryId={categoryId || filteredCategories[0]?.id || ''}
          previewUrl={receiptPreviewUrl}
          onSelectFile={handleReceiptSelectFromScanner}
          onApply={handleApplyScannedReceipt}
        />
      )}

      {isMercado && txType === 'expense' && (
        <div className="rounded-2xl bg-[#F5F5F5] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#00BFA5]" />
              <span className="text-[13px] font-semibold text-cc-primary">
                Detalle por producto
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={lineItemsEnabled}
              onClick={() => setLineItemsEnabled(v => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                lineItemsEnabled ? 'bg-[#00BFA5]' : 'bg-[#DFE6E9]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  lineItemsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {lineItemsEnabled && (
            <div className="space-y-2">
              <p className="text-[11px] text-cc-secondary">
                Total calculado: {displayAmount.toFixed(2)} {baseCurrency}
              </p>
              {lineItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => updateLineItem(i, 'name', e.target.value)}
                    placeholder="Producto"
                    className="flex-1 px-3 py-2 rounded-xl bg-white text-[13px] outline-none"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.price || ''}
                    onChange={e => updateLineItem(i, 'price', e.target.value)}
                    placeholder="0.00"
                    className="w-20 px-3 py-2 rounded-xl bg-white text-[13px] outline-none"
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(i)}
                      className="text-cc-muted hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 text-[12px] font-semibold text-[#00BFA5]"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir producto
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-cc-secondary text-center">
        Registrado por: {authorName}
      </p>

      {error && (
        <p className="text-[12px] text-red-600 text-center">{error}</p>
      )}

      {receiptUploadWarning && (
        <p className="text-[12px] text-amber-700 text-center bg-amber-50 rounded-xl px-3 py-2">
          {receiptUploadWarning}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-4 rounded-2xl text-white text-[15px] font-bold disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg ${theme.submit}`}
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
        ) : (
          <><Check className="w-5 h-5" /> Guardar movimiento</>
        )}
      </button>
    </form>
  )
}
