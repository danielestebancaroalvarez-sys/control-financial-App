export type TxType = 'income' | 'expense'

export const TX_TYPE_THEME = {
  income: {
    label: 'Ingreso',
    fixedLabel: 'Ingreso fijo',
    variableLabel: 'Ingreso puntual',
    gradient: 'from-[#00BFA5] to-[#2DD4BF]',
    solid: 'bg-[#00BFA5]',
    text: 'text-[#00796B]',
    ring: 'ring-[#00BFA5]/40',
    chipActive: 'bg-[#00BFA5] text-white shadow-md',
    chipIdle: 'bg-[#E0F2F2] text-[#00796B] border border-[#B2DFDB]',
    cardActive: 'border-[#00BFA5] bg-[#E0F2F1] ring-2 ring-[#00BFA5]/30',
    cardIdle: 'border-[var(--cc-border)] cc-surface-muted',
    submit: 'bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF] shadow-[#00BFA5]/25',
    focus: 'focus:ring-[#00BFA5]/30',
  },
  expense: {
    label: 'Gasto',
    fixedLabel: 'Gasto fijo',
    variableLabel: 'Gasto puntual',
    gradient: 'from-[#E8A8B5] to-[#F5CED6]',
    solid: 'bg-[#E8A8B5]',
    text: 'text-[#9B6B78]',
    ring: 'ring-[#E8A8B5]/40',
    chipActive: 'bg-[#E8A8B5] text-white shadow-md',
    chipIdle: 'bg-[#FCEEF2] text-[#9B6B78] border border-[#F5DDE4]',
    cardActive: 'border-[#EBBEC8] bg-[#FFF9FA] ring-2 ring-[#E8A8B5]/25',
    cardIdle: 'border-[var(--cc-border)] cc-surface-muted',
    submit: 'bg-gradient-to-r from-[#E8A8B5] to-[#F5CED6] shadow-[#E8A8B5]/15',
    focus: 'focus:ring-[#E8A8B5]/30',
  },
} as const
