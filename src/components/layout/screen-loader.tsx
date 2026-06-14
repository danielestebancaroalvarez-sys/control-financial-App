export function ScreenLoader({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div
        className="w-10 h-10 rounded-full border-[3px] border-[#00BFA5]/20 border-t-[#00BFA5] animate-spin"
        role="status"
        aria-label={label}
      />
      <p className="text-[12px] font-medium text-[#636E72]">{label}</p>
    </div>
  )
}
