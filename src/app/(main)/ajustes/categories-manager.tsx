'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, Tag } from 'lucide-react'
import { createCategory, deleteCategory } from '@/lib/finance/actions'
import { CategoryIconPicker } from '@/components/categories/category-icon-picker'
import { CategoryIcon } from '@/components/transactions/category-icon'
import { DEFAULT_CATEGORY_ICON, type CategoryIconId } from '@/lib/finance/category-icons'
import type { Category } from '@/lib/finance/types'

const COLORS = ['#00BFA5', '#EC4899', '#F59E0B', '#7E57C2', '#636E72', '#FF8A65']

export function CategoriesManager({
  householdId,
  categories: initial,
}: {
  householdId: string
  categories: Category[]
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [color, setColor] = useState(COLORS[0])
  const [icon, setIcon] = useState<CategoryIconId>(DEFAULT_CATEGORY_ICON)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubscription, setIsSubscription] = useState(false)

  const userCustom = initial.filter(c => !c.is_system)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createCategory({
      householdId,
      name,
      type,
      color,
      icon,
      isSubscription: type === 'expense' && isSubscription,
    })
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setName('')
    setIcon(DEFAULT_CATEGORY_ICON)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return
    await deleteCategory(id, householdId)
    router.refresh()
  }

  return (
    <section className="rounded-[24px] bg-white/90 backdrop-blur-md shadow-sm border border-white/60 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-[#00BFA5]" />
        <h2 className="text-[15px] font-bold text-[#2D3436]">Categorías personalizadas</h2>
      </div>

      <form onSubmit={handleCreate} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre de la categoría"
          required
          className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
        />
        <div className="flex gap-2">
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl text-[12px] font-bold ${
                type === t ? 'bg-[#00BFA5] text-white' : 'bg-[#F5F5F5] text-[#636E72]'
              }`}
            >
              {t === 'expense' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>
        {type === 'expense' && (
          <label className="flex items-center gap-2 text-[12px] text-[#636E72] cursor-pointer">
            <input
              type="checkbox"
              checked={isSubscription}
              onChange={e => setIsSubscription(e.target.checked)}
              className="rounded accent-[#7E57C2]"
            />
            Es suscripción (Netflix, Spotify, etc.)
          </label>
        )}
        <CategoryIconPicker value={icon} onChange={setIcon} accentColor={color} />
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-[#2D3436]' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        {error && <p className="text-[12px] text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#00BFA5] text-white font-bold text-[13px] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Crear categoría</>}
        </button>
      </form>

      {userCustom.length > 0 && (
        <ul className="space-y-2 pt-2 border-t border-[#F0F0F0]">
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
