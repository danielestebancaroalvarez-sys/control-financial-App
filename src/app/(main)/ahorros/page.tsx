import { PiggyBank } from 'lucide-react'

export default function AhorrosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-[#2D3436]">Ahorros</h1>
        <p className="text-[13px] text-[#636E72]">Metas y proyección de riqueza</p>
      </div>

      <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#F59E0B]/15 mb-4">
          <PiggyBank className="w-7 h-7 text-[#F59E0B]" />
        </div>
        <p className="text-[15px] font-semibold text-[#2D3436] mb-2">
          Próximamente
        </p>
        <p className="text-[13px] text-[#636E72]">
          Crea metas, define aportes y visualiza proyecciones con interés compuesto.
        </p>
      </div>
    </div>
  )
}
