type Item = { name: string; amount: number; color: string | null }

export function CategoryBarChart({
  items,
  formatValue,
}: {
  items: Item[]
  formatValue: (n: number) => string
}) {
  const max = Math.max(...items.map(i => i.amount), 1)

  if (items.length === 0) {
    return (
      <p className="text-[12px] text-[#636E72] text-center py-4">
        Sin gastos en este periodo
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(item => {
        const pct = Math.round((item.amount / max) * 100)
        return (
          <div key={item.name}>
            <div className="flex justify-between items-center mb-1 gap-2">
              <span className="text-[12px] font-semibold text-[#2D3436] truncate">
                {item.name}
              </span>
              <span className="text-[11px] font-bold text-[#2D3436] shrink-0">
                {formatValue(item.amount)}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${item.color ?? '#636E72'}cc, ${item.color ?? '#636E72'})`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
