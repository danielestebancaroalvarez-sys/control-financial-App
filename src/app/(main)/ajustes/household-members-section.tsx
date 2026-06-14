'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut, UserMinus } from 'lucide-react'
import { leaveHousehold, removeHouseholdMember } from '@/lib/household/actions'
import type { HouseholdMember } from '@/lib/household/types'

export function HouseholdMembersSection({
  householdId,
  members,
  currentUserId,
}: {
  householdId: string
  members: HouseholdMember[]
  currentUserId: string
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentMember = members.find(m => m.user_id === currentUserId)
  const isOwner = currentMember?.role === 'owner'

  async function handleLeave() {
    if (
      !confirm(
        '¿Salir de este hogar? Perderás acceso a las finanzas compartidas hasta unirte de nuevo con el código.'
      )
    ) {
      return
    }

    setLoadingId('self')
    setError(null)
    const result = await leaveHousehold(householdId)
    if (result?.error) {
      setError(result.error)
      setLoadingId(null)
    }
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`¿Desvincular a ${name} del hogar?`)) return

    setLoadingId(userId)
    setError(null)
    const result = await removeHouseholdMember(householdId, userId)
    if (result.error) {
      setError(result.error)
      setLoadingId(null)
      return
    }
    setLoadingId(null)
    router.refresh()
  }

  return (
    <section className="rounded-[24px] bg-white/90 backdrop-blur-md shadow-sm border border-white/60 p-5 space-y-3">
      <h2 className="text-[15px] font-bold text-[#2D3436]">
        Miembros ({members.length})
      </h2>

      {error && (
        <p className="text-[12px] text-red-600 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
          {error}
        </p>
      )}

      {members.length === 0 ? (
        <p className="text-[13px] text-[#636E72]">
          No se encontraron miembros. Si acabas de invitar a alguien, recarga la página.
        </p>
      ) : (
        <ul className="space-y-3">
          {members.map(member => {
            const isSelf = member.user_id === currentUserId
            const displayName = member.full_name ?? 'Usuario'
            const busy = loadingId === member.user_id || (isSelf && loadingId === 'self')

            return (
              <li
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F5]"
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#2D3436] truncate">
                    {displayName}
                    {isSelf && <span className="text-[#636E72] font-normal"> (tú)</span>}
                  </p>
                  <p className="text-[11px] text-[#636E72] capitalize">
                    {member.role === 'owner' ? 'Administrador' : 'Miembro'}
                  </p>
                </div>

                {isSelf ? (
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={busy}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[#636E72] hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                    Salir
                  </button>
                ) : isOwner ? (
                  <button
                    type="button"
                    onClick={() => handleRemove(member.user_id, displayName)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[#636E72] hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserMinus className="w-3.5 h-3.5" />
                    )}
                    Quitar
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
