'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckSquare, Plus, Repeat, Search, Target } from 'lucide-react'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { TiempoFijosClient } from '@/app/(main)/tiempo/fijos/tiempo-fijos-client'
import { formatShortDate } from '@/lib/time/format'
import type { HouseholdMember } from '@/lib/household/types'
import {
  TASK_DIFFICULTY_COLORS,
  TASK_DIFFICULTY_LABELS,
  type HouseholdTask,
  type ProductivityGoal,
  type TimeBlock,
  type TimeCategory,
} from '@/lib/time/types'

type Tab = 'all' | 'tasks' | 'goals' | 'blocks'

export function TiempoBuscarClient({
  tasks,
  goals,
  blocks,
  categories,
  members,
  householdId,
  initialTab = 'all',
}: {
  tasks: HouseholdTask[]
  goals: ProductivityGoal[]
  blocks: TimeBlock[]
  categories: TimeCategory[]
  members: HouseholdMember[]
  householdId: string
  initialTab?: Tab
}) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>(initialTab)

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  const q = query.trim().toLowerCase()

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (tab === 'goals' || tab === 'blocks') return false
      if (!q) return true
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        (t.assigneeName?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [tasks, tab, q])

  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      if (tab === 'tasks' || tab === 'blocks') return false
      if (!q) return true
      return (
        g.title.toLowerCase().includes(q) ||
        (g.vision?.toLowerCase().includes(q) ?? false) ||
        (g.creatorName?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [goals, tab, q])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'Todo' },
    { id: 'tasks', label: 'Tareas' },
    { id: 'goals', label: 'Metas' },
    { id: 'blocks', label: 'Bloques fijos' },
  ]

  const showTaskGoalResults = tab !== 'blocks'
  const emptyResults =
    showTaskGoalResults && filteredTasks.length === 0 && filteredGoals.length === 0

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-cc-primary flex items-center gap-2">
          <Search className="w-5 h-5 text-[#6366F1]" />
          Buscar
        </h1>
        <p className="text-[12px] text-cc-secondary mt-0.5">
          Tareas, metas y bloques fijos del hogar. Crea nuevos desde el botón central +.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cc-muted" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={
            tab === 'blocks'
              ? 'Buscar bloques fijos…'
              : 'Buscar tareas, metas o bloques…'
          }
          className="w-full pl-10 pr-4 py-3 rounded-2xl cc-input text-[14px] outline-none ring-2 ring-transparent focus:ring-[#6366F1]/30"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold ${
              tab === t.id ? 'bg-[#6366F1] text-white' : 'cc-surface-muted text-cc-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'blocks' ? (
        <TiempoFijosClient
          blocks={
            q
              ? blocks.filter(
                  b =>
                    b.title.toLowerCase().includes(q) ||
                    b.categoryName.toLowerCase().includes(q) ||
                    (b.assigneeName?.toLowerCase().includes(q) ?? false)
                )
              : blocks
          }
          categories={categories}
          members={members}
          householdId={householdId}
          embedded
        />
      ) : (
        <>
          {filteredTasks.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-cc-primary flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-[#6366F1]" />
                  Tareas
                </h2>
                <Link href="/tiempo/tareas" className="text-[11px] font-semibold text-[#6366F1]">
                  Ver todas →
                </Link>
              </div>
              <ul className="space-y-2">
                {filteredTasks.slice(0, 12).map(task => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-2xl cc-surface-muted"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${task.color}22`, color: task.color }}
                    >
                      <CategoryIcon icon={task.icon} className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-cc-primary truncate">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-cc-secondary">
                        <span
                          className="font-bold px-1 rounded text-white mr-1"
                          style={{ backgroundColor: TASK_DIFFICULTY_COLORS[task.difficulty] }}
                        >
                          {TASK_DIFFICULTY_LABELS[task.difficulty]}
                        </span>
                        {task.dueDate && `vence ${formatShortDate(task.dueDate)}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {filteredGoals.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-cc-primary flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#6366F1]" />
                  Metas
                </h2>
                <Link href="/tiempo/metas" className="text-[11px] font-semibold text-[#6366F1]">
                  Ver todas →
                </Link>
              </div>
              <ul className="space-y-2">
                {filteredGoals.slice(0, 8).map(goal => (
                  <li key={goal.id} className="p-3 rounded-2xl cc-surface-muted">
                    <p className="text-[13px] font-semibold text-cc-primary">{goal.title}</p>
                    <p className="text-[10px] text-cc-secondary mt-0.5">
                      {goal.percent}% · {goal.doneSteps}/{goal.totalSteps} pasos
                      {goal.creatorName && ` · ${goal.creatorName}`}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === 'all' && !q && blocks.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-cc-primary flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-[#6366F1]" />
                  Bloques fijos
                </h2>
                <button
                  type="button"
                  onClick={() => setTab('blocks')}
                  className="text-[11px] font-semibold text-[#6366F1]"
                >
                  Ver todos →
                </button>
              </div>
              <ul className="space-y-2">
                {blocks.slice(0, 4).map(block => (
                  <li
                    key={block.id}
                    className="flex items-center gap-3 p-3 rounded-2xl cc-surface-muted"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
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
                      <p className="text-[10px] text-cc-secondary">{block.categoryName}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {emptyResults && (
            <section className="cc-surface rounded-[24px] p-6 text-center">
              <p className="text-[13px] text-cc-secondary">Sin resultados para tu búsqueda.</p>
            </section>
          )}
        </>
      )}

      {tab === 'blocks' && (
        <Link
          href="/tiempo/nuevo"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[13px] font-bold"
        >
          <Plus className="w-4 h-4" />
          Añadir bloque fijo
        </Link>
      )}
    </div>
  )
}
