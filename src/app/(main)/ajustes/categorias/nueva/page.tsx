import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getMainAppContextWithPeriod } from '@/lib/app/context'
import { CategoryForm } from '@/components/categories/category-form'

export default async function NuevaCategoriaPage() {
  const ctx = await getMainAppContextWithPeriod()
  if (!ctx) redirect('/login')

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Link
          href="/ajustes"
          className="w-9 h-9 rounded-xl bg-white/90 border border-white/60 flex items-center justify-center shrink-0 text-[#636E72] hover:text-[#2D3436]"
          aria-label="Volver a ajustes"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-[22px] font-bold text-[#2D3436]">Nueva categoría</h1>
          <p className="text-[13px] text-[#636E72]">
            Elige nombre, color e icono para organizar tus movimientos
          </p>
        </div>
      </div>

      <section className="rounded-[24px] bg-white/90 backdrop-blur-md shadow-sm border border-white/60 p-5">
        <CategoryForm householdId={ctx.household.id} />
      </section>
    </div>
  )
}
