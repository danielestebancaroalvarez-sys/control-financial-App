export type UserProfile = {
  id: string
  fullName: string | null
  avatarUrl: string | null
  email: string | null
}

export function isProfileComplete(profile: Pick<UserProfile, 'fullName'>): boolean {
  return !!(profile.fullName?.trim() && profile.fullName.trim().length >= 2)
}
