/** Paleta contrastada para gráficas (no usar el púrpura de marca en todas las porciones). */
export const TIME_CHART_COLORS: Record<string, string> = {
  Trabajo: '#2563EB',
  Universidad: '#7C3AED',
  Sueño: '#64748B',
  Hogar: '#059669',
  Ocio: '#F59E0B',
  Tránsito: '#0891B2',
  Ejercicio: '#DC2626',
  Otros: '#94A3B8',
  'Sin registrar': '#CBD5E1',
}

const FALLBACK_PALETTE = [
  '#2563EB',
  '#059669',
  '#F59E0B',
  '#DC2626',
  '#0891B2',
  '#7C3AED',
  '#64748B',
  '#EC4899',
]

export function getTimeChartColor(categoryName: string, index = 0): string {
  return (
    TIME_CHART_COLORS[categoryName] ??
    FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]
  )
}
