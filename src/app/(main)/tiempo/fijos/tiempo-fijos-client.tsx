'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarClock, Loader2, Pencil, Plus, Repeat, Trash2 } from 'lucide-react'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { EditTimeBlockSheet } from '@/components/time/edit-time-block-sheet'
import { deactivateTimeBlock } from '@/lib/time/actions'
import { formatDuration, formatTimeRange } from '@/lib/time/format'
import { formatTimeFrequency } from '@/lib/time/frequency'
import type { HouseholdMember } from '@/lib/household/types'
import type { TimeBlock, TimeCategory } from '@/lib/time/types'

export function TiempoFijosClient({
  blocks: initialBlocks,
  categories,
  members,
  householdId,
  embedded = false,
}: {
  blocks: TimeBlock[]
  categories: TimeCategory[]
  members: HouseholdMember[]
  householdId: string
  embedded?: boolean
}) {
  const router = useRouter()
  const [blocks, setBlocks] = useState(initialBlocks)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)

  async function handleRemove(id: string) {
    setRemovingId(id)
    const result = await deactivateTimeBlock(householdId, id)
    if (!result.error) {
      setBlocks(prev => prev.filter(b => b.id !== id))
      router.refresh()
    }
    setRemovingId(null)
  }

  return (
    <div className="space-y-4">
      {!embedded && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[20px] font-bold text-cc-primary flex items-center gap-2">
                <Repeat className="w-5 h-5 text-[#6366F1]" />
                Bloques fijos
              </h1>
              <p className="text-[12px] text-cc-secondary mt-0.5">
                Trabajo, universidad, sueño y rutinas que se repiten cada semana.
              </p>
            </div>
          </div>

          <Link
            href="/tiempo/nuevo"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[13px] font-bold"
          >
            <Plus className="w-4 h-4" />
            Añadir bloque fijo
          </Link>
        </>
      )}

      {blocks.length === 0 ? (
        <section className="cc-surface rounded-[24px] p-6 text-center">
          <p className="text-[13px] text-cc-secondary">
            Programa tu trabajo, universidad o horas de sueño objetivo.
          </p>
          {!embedded && (
            <Link
              href="/tiempo/nuevo"
              className="inline-block mt-3 text-[13px] font-bold text-[#6366F1]"
            >
              Crear primer bloque →
            </Link>
          )}
        </section>
      ) : (
        <ul className="space-y-2">
          {blocks.map(block => (
            <li
              key={block.id}
              className="flex items-center gap-3 p-3 rounded-2xl cc-surface-muted"
            >
              <button
                type="button"
                onClick={() => setEditingBlock(block)}
                className="flex flex-1 items-center gap-3 min-w-0 text-left"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${block.categoryColor ?? '#6366F1'}22`,
                    color: block.categoryColor ?? '#6366F1',
                  }}
                >
                  <CategoryIcon icon={block.categoryIcon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-cc-primary truncate">
                    {block.title}
                  </p>
                  <p className="text-[11px] text-cc-secondary">
                    {block.categoryName} · {formatDuration(block.durationMinutes)} ·{' '}
                    {formatTimeFrequency(block.frequency)}
                  </p>
                  <p className="text-[10px] text-cc-muted flex items-center gap-1 mt-0.5">
                    <CalendarClock className="w-3 h-3" />
                    {formatTimeRange(block.startTime, block.endTime) || 'Sin horario'}
                    {block.assigneeName && <> · {block.assigneeName}</>}
                  </p>
                </div>
                <Pencil className="w-4 h-4 text-[#6366F1] shrink-0" />
              </button>
              <button
                type="button"
                disabled={removingId === block.id}
                onClick={() => handleRemove(block.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-cc-muted hover:text-red-500 disabled:opacity-50 shrink-0"
                aria-label="Eliminar bloque"
              >
                {removingId === block.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {editingBlock && (
        <EditTimeBlockSheet
          block={editingBlock}
          categories={categories}
          members={members}
          householdId={householdId}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  )
}
