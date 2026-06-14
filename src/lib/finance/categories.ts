const CATEGORY_COLORS: Record<string, string> = {
  Salario: '#00BFA5',
  'Otros ingresos': '#2DD4BF',
  Mercado: '#00BFA5',
  Restaurantes: '#EC4899',
  Servicios: '#636E72',
  Arriendo: '#F59E0B',
  Luz: '#FFE082',
  Internet: '#81D4FA',
  Transporte: '#7E57C2',
  Suscripciones: '#7E57C2',
  'Otros gastos': '#B2BEC3',
  Ocio: '#FF8A65',
}

export function getCategoryColor(name: string, dbColor: string | null): string {
  return dbColor ?? CATEGORY_COLORS[name] ?? '#636E72'
}
