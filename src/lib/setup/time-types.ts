export type TimeSetupContext = {
  householdId: string
  householdName: string
  profileFullName: string
  profileAvatarUrl: string | null
  email: string | null
  needsProfile: boolean
}

export type TimeSetupInput = {
  householdId: string
  createSleepBlock: boolean
  sleepStartTime?: string
  sleepEndTime?: string
  enableReminders: boolean
}
