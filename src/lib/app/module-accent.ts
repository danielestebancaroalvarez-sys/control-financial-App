export type AppAccent = 'finance' | 'time' | 'travel'

export const MODULE_ACCENT = {
  finance: {
    icon: 'text-[#00BFA5]',
    solid: 'bg-[#00BFA5]',
    gradient: 'bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF]',
    gradientHover: 'from-[#00BFA5] to-[#2DD4BF]',
    ring: 'focus:ring-[#00BFA5]/30',
    mutedBg: 'bg-[#6366F1]/10',
    text: 'text-[#00BFA5]',
    badgeBg: 'bg-[#E8F5E9] text-[#2E7D32]',
  },
  time: {
    icon: 'text-[#6366F1]',
    solid: 'bg-[#6366F1]',
    gradient: 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]',
    gradientHover: 'from-[#6366F1] to-[#8B5CF6]',
    ring: 'focus:ring-[#6366F1]/30',
    mutedBg: 'bg-[#6366F1]/10',
    text: 'text-[#6366F1]',
    badgeBg: 'bg-[#EEF2FF] text-[#4F46E5]',
  },
  travel: {
    icon: 'text-[#0EA5E9]',
    solid: 'bg-[#0EA5E9]',
    gradient: 'bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]',
    gradientHover: 'from-[#0EA5E9] to-[#38BDF8]',
    ring: 'focus:ring-[#0EA5E9]/30',
    mutedBg: 'bg-[#0EA5E9]/10',
    text: 'text-[#0EA5E9]',
    badgeBg: 'bg-[#E0F2FE] text-[#0369A1]',
  },
} as const
