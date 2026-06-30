export type TxType = 'income' | 'expense'

export const TX_TYPE_THEME = {
  income: {
    label: 'Ingreso',
    fixedLabel: 'Ingreso fijo',
    variableLabel: 'Ingreso puntual',
    variableHint:
      'Ya ingresó hoy o antes: salario extra, freelance, venta, reembolso, propina…',
    fixedHint:
      'Se repite cada periodo: salario, rentas, pensión, dividendos, cuotas…',
    fixedFormHint:
      'No crea un movimiento hoy: programa el ingreso para el radar y el presupuesto (salario, rentas, pensiones…).',
    gradient: 'from-[#00BFA5] to-[#2DD4BF]',
    solid: 'bg-[#00BFA5]',
    text: 'text-[#00796B] dark:text-[#4db6ac]',
    ring: 'ring-[#00BFA5]/40',
    chipActive: 'bg-[#00BFA5] text-white shadow-md',
    chipIdle:
      'bg-[#E0F2F2] text-[#00796B] border border-[#B2DFDB] dark:bg-[#1a3330] dark:text-[#4db6ac] dark:border-[#2a5a52]',
    cardActive:
      'border-[#00BFA5] bg-[#E0F2F1] dark:bg-[#1a3330] dark:border-[#4db6ac] ring-2 ring-[#00BFA5]/30',
    cardIdle: 'border-[var(--cc-border)] cc-surface-muted',
    submit:
      'bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF] shadow-lg shadow-[#00BFA5]/30',
    focus: 'focus:ring-[#00BFA5]/30',
    savedMessage: 'Ingreso guardado',
    savedFixedMessage: 'Ingreso fijo programado',
  },
  expense: {
    label: 'Gasto',
    fixedLabel: 'Gasto fijo',
    variableLabel: 'Gasto puntual',
    variableHint:
      'Ya ocurrió hoy o antes: mercado, cena, taxi, farmacia, pago puntual…',
    fixedHint:
      'Se repite cada periodo: arriendo, servicios, suscripciones, cuotas, seguros…',
    fixedFormHint:
      'No crea un movimiento hoy: programa el gasto para el radar y el presupuesto (arriendo, servicios, suscripciones…).',
    gradient: 'from-[#D4737E] to-[#E8A8B5]',
    solid: 'bg-[#D4737E]',
    text: 'text-[#9B6B78] dark:text-[#f9a8c4]',
    ring: 'ring-[#EC4899]/40',
    chipActive: 'bg-[#D4737E] text-white shadow-md',
    chipIdle:
      'bg-[#FCEEF2] text-[#9B6B78] border border-[#F5DDE4] dark:bg-[#243034] dark:text-[#f9a8c4] dark:border-[#EC4899]/25',
    cardActive:
      'border-[#D4737E] bg-[#FFF5F7] dark:bg-[#1e2830] dark:border-[#EC4899]/50 ring-2 ring-[#EC4899]/25',
    cardIdle: 'border-[var(--cc-border)] cc-surface-muted',
    submit:
      'bg-gradient-to-r from-[#D4737E] to-[#E8A8B5] shadow-lg shadow-[#EC4899]/25',
    focus: 'focus:ring-[#EC4899]/30',
    savedMessage: 'Gasto guardado',
    savedFixedMessage: 'Gasto fijo programado',
  },
  subscription: {
    label: 'Suscripción',
    fixedLabel: 'Suscripción recurrente',
    variableLabel: 'Suscripción puntual',
    variableHint: 'Pago único de una suscripción o servicio digital.',
    fixedHint:
      'Se repite cada periodo: Netflix, Spotify, gym, software…',
    fixedFormHint:
      'Programa el débito automático para el radar y el presupuesto.',
    gradient: 'from-[#7E57C2] to-[#9575CD]',
    solid: 'bg-[#7E57C2]',
    text: 'text-[#5E35B1] dark:text-[#B39DDB]',
    ring: 'ring-[#7E57C2]/40',
    chipActive: 'bg-[#7E57C2] text-white shadow-md',
    chipIdle:
      'bg-[#EDE7F6] text-[#5E35B1] border border-[#D1C4E9] dark:bg-[#2d2640] dark:text-[#B39DDB] dark:border-[#7E57C2]/30',
    cardActive:
      'border-[#7E57C2] bg-[#EDE7F6] dark:bg-[#2d2640] dark:border-[#9575CD] ring-2 ring-[#7E57C2]/30',
    cardIdle: 'border-[var(--cc-border)] cc-surface-muted',
    submit:
      'bg-gradient-to-r from-[#7E57C2] to-[#9575CD] shadow-lg shadow-[#7E57C2]/30',
    focus: 'focus:ring-[#7E57C2]/30',
    savedMessage: 'Suscripción guardada',
    savedFixedMessage: 'Suscripción programada',
  },
} as const
