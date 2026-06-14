'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createCategory } from '@/lib/finance/actions'
import { CategoryIconPicker } from '@/components/categories/category-icon-picker'
import { DEFAULT_CATEGORY_ICON, type CategoryIconId } from '@/lib/finance/category-icons'

const COLORS = [
  '#00BFA5',
  '#EC4899',
  '#F59E0B',
  '#7E57C2',
  '#636E72',
  '#FF8A65',
  '#42A5F5',
  '#66BB6A',
  '#EF5350',
  '#8D6E63',
]

export function CategoryForm({
  householdId,
  onSuccess,
  compact = false,
}: {
  householdId: string
  onSuccess?: () => void
  compact?: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [color, setColor] = useState(COLORS[0])
  const [icon, setIcon] = useState<CategoryIconId>(DEFAULT_CATEGORY_ICON)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubscription, setIsSubscription] = useState(false)

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
    onSuccess?.()
    router.refresh()
  }

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <div>
        <label className="text-[12px] font-semibold text-[#636E72] mb-1.5 block">
          Nombre
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej. Gym, Mascotas, Freelance..."
          required
          className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
        />
      </div>

      <div>
        <p className="text-[12px] font-semibold text-[#636E72] mb-1.5">Tipo</p>
        <div className="flex gap-2">
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${
                type === t ? 'bg-[#00BFA5] text-white' : 'bg-[#F5F5F5] text-[#636E72]'
              }`}
            >
              {t === 'expense' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>
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

      <div>
        <p className="text-[12px] font-semibold text-[#636E72] mb-1.5">Color</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-[#2D3436]' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      <CategoryIconPicker
        value={icon}
        onChange={setIcon}
        accentColor={color}
        expanded={!compact}
      />

      {error && <p className="text-[12px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-[#00BFA5] text-white font-bold text-[14px] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear categoría'}
      </button>
    </form>
  )
}
