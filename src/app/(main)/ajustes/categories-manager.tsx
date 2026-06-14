'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, Tag } from 'lucide-react'
import { deleteCategory } from '@/lib/finance/actions'
import { CategoryIcon } from '@/components/transactions/category-icon'
import type { Category } from '@/lib/finance/types'

export function CategoriesManager({
  householdId,
  categories: initial,
}: {
  householdId: string
  categories: Category[]
}) {
  const router = useRouter()
  const userCustom = initial.filter(c => !c.is_system)

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return
    await deleteCategory(id, householdId)
    router.refresh()
  }

  return (
    <section className="rounded-[24px] bg-white/90 backdrop-blur-md shadow-sm border border-white/60 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#00BFA5]" />
          <h2 className="text-[15px] font-bold text-[#2D3436]">Categorías personalizadas</h2>
        </div>
        <Link
          href="/ajustes/categorias/nueva"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00BFA5] text-white text-[12px] font-bold shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva
        </Link>
      </div>

      {userCustom.length === 0 ? (
        <p className="text-[13px] text-[#636E72]">
          Crea categorías propias para gastos e ingresos que no vienen por defecto.
        </p>
      ) : (
        <ul className="space-y-2">
          {userCustom.map(cat => (
            <li
              key={cat.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F5]"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${cat.color}20`, color: cat.color ?? '#636E72' }}
              >
                <CategoryIcon icon={cat.icon} className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#2D3436] truncate">{cat.name}</p>
                <p className="text-[11px] text-[#636E72] capitalize">
                  {cat.type === 'income' ? 'Ingreso' : 'Gasto'}
                  {cat.is_subscription ? ' · Suscripción' : ''}
                  {cat.is_fixed ? ' · Servicio' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#B2BEC3] hover:text-red-500 hover:bg-red-50"
                aria-label={`Eliminar ${cat.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
