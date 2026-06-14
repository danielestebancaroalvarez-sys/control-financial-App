'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { X, Plus, Sparkles } from 'lucide-react'

export function AddSheet() {
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
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />

      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md"
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
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#DFE6E9]" />
          </div>

          <div className="flex items-center justify-between px-5 pb-4">
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

          <div className="px-5 space-y-4">
            <div className="flex rounded-2xl bg-[#F5F5F5] p-1">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF] text-white text-[12px] font-bold"
              >
                Ingreso Manual
              </button>
              <button
                type="button"
                disabled
                className="flex-1 py-2.5 rounded-xl text-[#B2BEC3] text-[12px] font-semibold flex flex-col items-center gap-0.5"
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Escáner con IA
                </span>
                <span className="text-[9px]">Próximamente</span>
              </button>
            </div>

            <div className="rounded-2xl border border-[#F0F0F0] p-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#00BFA5]/15 mb-3">
                <Plus className="w-6 h-6 text-[#00BFA5]" />
              </div>
              <p className="text-[14px] font-semibold text-[#2D3436] mb-1">
                Formulario en Fase 4
              </p>
              <p className="text-[12px] text-[#636E72]">
                Tipo, categoría, monto, recurrencia y detalle por producto.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
