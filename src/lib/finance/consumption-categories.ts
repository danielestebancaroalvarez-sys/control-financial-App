/** Categorías con predicción de ritmo de gasto al cierre del periodo */
export const CONSUMPTION_PREDICTION_CATEGORIES = [
  'Mercado',
  'Restaurantes',
  'Transporte',
] as const

export type ConsumptionPredictionCategory =
  (typeof CONSUMPTION_PREDICTION_CATEGORIES)[number]
