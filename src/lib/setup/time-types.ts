export type TimeSetupContext = {
  householdId: string
  householdName: string
  profileFullName: string
  profileAvatarUrl: string | null
  email: string | null
  needsProfile: boolean
}

export type ActivityTemplateInput = {
  title: string
  description?: string
  estimatedMinutes: number
  difficulty?: 1 | 2 | 3
  color?: string
  icon?: string
}

export type TimeSetupInput = {
  householdId: string
  createSleepBlock: boolean
  sleepStartTime?: string
  sleepEndTime?: string
  enableReminders: boolean
  activityTemplates?: ActivityTemplateInput[]
}
