export type CopAudRates = {
  audToCop: number
  copToAud: number
  updatedAt: string
  dateLabel: string
}

type ErApiResponse = {
  result?: string
  time_last_update_utc?: string
  rates?: { COP?: number }
}

export async function getCopAudRates(): Promise<CopAudRates | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/AUD', {
      next: { revalidate: 86_400 },
    })

    if (!res.ok) return null

    const data = (await res.json()) as ErApiResponse
    const copPerAud = data.rates?.COP

    if (!copPerAud || copPerAud <= 0) return null

    const updatedAt = data.time_last_update_utc ?? new Date().toISOString()
    const dateLabel = new Date(updatedAt).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    return {
      audToCop: copPerAud,
      copToAud: 1 / copPerAud,
      updatedAt,
      dateLabel,
    }
  } catch {
    return null
  }
}

export function formatFxRate(value: number, currency: 'AUD' | 'COP'): string {
  if (currency === 'COP') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value)
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value)
}
