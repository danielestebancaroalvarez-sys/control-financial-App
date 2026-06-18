import { getFirstName } from '@/lib/utils/name'

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-[12px]',
  lg: 'w-12 h-12 text-[14px]',
} as const

export function UserAvatar({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}: {
  name: string
  avatarUrl?: string | null
  size?: keyof typeof SIZE_CLASSES
  className?: string
}) {
  const displayName = name.trim() || 'Usuario'
  const initial = getFirstName(displayName).charAt(0).toUpperCase()
  const sizeClass = SIZE_CLASSES[size]

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
        className={`rounded-full object-cover shrink-0 ring-2 ring-white/80 dark:ring-[var(--cc-border)] ${sizeClass} ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-white/80 dark:ring-[var(--cc-border)] ${sizeClass} ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  )
}
