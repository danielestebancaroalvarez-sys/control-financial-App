export type CurrencyCode = 'AUD' | 'COP'

export type Household = {
  id: string
  name: string
  base_currency: CurrencyCode
  invite_code: string
  created_at: string
}

export type HouseholdMember = {
  id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  full_name: string | null
  avatar_url: string | null
}
