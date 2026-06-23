'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, UserX } from 'lucide-react'
import { deleteUserAccount } from '@/lib/account/actions'

const CONFIRM_TEXT = 'ELIMINAR MI CUENTA'

export function DeleteAccountButton({ email }: { email: string | null | undefined }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const canConfirm = confirm.trim() === CONFIRM_TEXT

  function handleCancel() {
    setOpen(false)
    setConfirm('')
    setError(null)
  }

  function handleDelete() {
    if (!canConfirm) return
    setError(null)
    startTransition(async () => {
      const result = await deleteUserAccount()
      if (result?.error) {
        setError(result.error)
        return
      }
      router.push('/login?deleted=1')
      router.refresh()
    })
  }

  return (
    <section className="cc-surface rounded-[24px] border border-[#FFCDD2]/80 p-5">
      <h2 className="text-[15px] font-bold text-[#C62828] mb-1 flex items-center gap-2">
        <UserX className="w-4 h-4" />
        Eliminar mi cuenta
      </h2>
      <p className="text-[12px] text-cc-secondary mb-4">
        Borra tu perfil, sesión y datos personales. Si eres el único miembro del hogar,
        también se eliminan finanzas, tareas y viajes del hogar. Si compartes hogar con tu
        pareja, sales del hogar y se anonimizan tus referencias; los datos compartidos
        permanecen para el otro miembro.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full py-3.5 rounded-[14px] border-2 border-[#FFCDD2] text-[#C62828] font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#FFEBEE] active:scale-[0.98] transition-all"
        >
          <AlertTriangle className="w-4 h-4" />
          Eliminar cuenta y datos
        </button>
      ) : (
        <div className="space-y-3 rounded-2xl bg-[#FFEBEE] border border-[#FFCDD2] p-4">
          <p className="text-[12px] text-cc-primary">
            Cuenta: <strong>{email ?? 'sin correo'}</strong>
          </p>
          <p className="text-[12px] text-cc-primary">
            Esta acción es permanente. Escribe exactamente{' '}
            <strong>{CONFIRM_TEXT}</strong> para confirmar.
          </p>
          <input
            type="text"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder={CONFIRM_TEXT}
            className="w-full px-3 py-2.5 rounded-xl bg-white text-[14px] outline-none focus:ring-2 focus:ring-[#C62828]/30"
            autoComplete="off"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={pending}
              className="flex-1 py-2.5 rounded-xl bg-white text-cc-secondary text-[13px] font-semibold disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canConfirm || pending}
              className="flex-1 py-2.5 rounded-xl bg-[#C62828] text-white text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserX className="w-4 h-4" />
              )}
              {pending ? 'Eliminando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-red-600 mt-2">{error}</p>}
    </section>
  )
}
