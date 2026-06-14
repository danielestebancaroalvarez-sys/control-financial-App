import { Plus, Sparkles } from 'lucide-react'

export default function NuevoPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-[#2D3436]">Añadir movimiento</h1>
        <p className="text-[13px] text-[#636E72]">Registra ingresos y gastos rápidamente</p>
      </div>

      <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#00BFA5]/15 mb-4">
          <Plus className="w-7 h-7 text-[#00BFA5]" />
        </div>
        <p className="text-[15px] font-semibold text-[#2D3436] mb-2">
          Próximamente
        </p>
        <p className="text-[13px] text-[#636E72] mb-4">
          Formulario de ingreso/gasto, recurrencia y detalle por producto.
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF8E1] text-[11px] font-medium text-[#F59E0B]">
          <Sparkles className="w-3 h-3" />
          Escáner con IA — en desarrollo
        </div>
      </div>
    </div>
  )
}
