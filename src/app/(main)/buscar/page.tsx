import { Search } from 'lucide-react'

export default function BuscarPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-[#2D3436]">Búsqueda</h1>
        <p className="text-[13px] text-[#636E72]">Auditoría y análisis de movimientos</p>
      </div>

      <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#00BFA5]/15 mb-4">
          <Search className="w-7 h-7 text-[#00BFA5]" />
        </div>
        <p className="text-[15px] font-semibold text-[#2D3436] mb-2">
          Próximamente
        </p>
        <p className="text-[13px] text-[#636E72]">
          Buscador universal, filtros avanzados y exportación a CSV.
        </p>
      </div>
    </div>
  )
}
