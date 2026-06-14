'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { AddTransactionForm } from '@/components/transactions/add-transaction-form'
import type { Category } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

export function AddSheet({
  householdId,
  baseCurrency,
  categories,
  authorName,
}: {
  householdId: string
  baseCurrency: CurrencyCode
  categories: Category[]
  authorName: string
}) {
  const router = useRouter()

  function handleClose() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <>
      <motion.button
        type="button"
        aria-label="Cerrar"
        className="fixed inset-0 z-40 bg-[#2D3436]/20 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={handleClose}
      />

      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md max-h-[92vh] overflow-y-auto"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.12}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 500) handleClose()
        }}
      >
        <div className="rounded-t-[2rem] bg-white shadow-[0_-12px_48px_rgba(0,0,0,0.15)] border-t border-white/80 pb-[max(6rem,env(safe-area-inset-bottom))]">
          <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10">
            <div className="w-10 h-1 rounded-full bg-[#DFE6E9]" />
          </div>

          <div className="flex items-center justify-between px-5 pb-4 sticky top-4 bg-white z-10">
            <button
              type="button"
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#636E72] hover:bg-[#EEEEEE] transition-colors"
              aria-label="Cerrar formulario"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-[16px] font-bold text-[#2D3436]">Añadir Movimiento</h2>
            <div className="w-9" />
          </div>

          <div className="px-5 pb-4">
            <AddTransactionForm
              householdId={householdId}
              baseCurrency={baseCurrency}
              categories={categories}
              authorName={authorName}
              onSuccess={handleClose}
            />
          </div>
        </div>
      </motion.div>
    </>
  )
}
