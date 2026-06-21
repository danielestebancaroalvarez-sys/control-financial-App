type MarkProps = {
  className?: string
  variant?: 'full' | 'coins' | 'heart'
}

/** Marca CoupleCash: monedas + corazón (identidad visual unificada). */
export function CoupleCashMark({
  className = 'w-10 h-10',
  variant = 'full',
}: MarkProps) {
  if (variant === 'heart') {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M16 26 C16 26 6 20 6 13 C6 9 9 7 12 7 C14 7 15 8 16 10 C17 8 18 7 20 7 C23 7 26 9 26 13 C26 20 16 26 16 26Z"
          fill="#E91E63"
        />
      </svg>
    )
  }

  if (variant === 'coins') {
    return (
      <svg className={className} viewBox="0 0 48 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="13" fill="#FFD54F" stroke="#E6A800" strokeWidth="1.5" />
        <circle cx="32" cy="16" r="13" fill="#FFD54F" stroke="#E6A800" strokeWidth="1.5" />
        <text x="16" y="20" textAnchor="middle" fill="#B8860B" fontSize="11" fontWeight="700">
          $
        </text>
        <text x="32" y="20" textAnchor="middle" fill="#B8860B" fontSize="11" fontWeight="700">
          $
        </text>
      </svg>
    )
  }

  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="hubMarkBg" x1="8" y1="8" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00BFA5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="18" fill="url(#hubMarkBg)" />
      <circle cx="28" cy="40" r="14" fill="white" fillOpacity="0.95" />
      <circle cx="52" cy="40" r="14" fill="white" fillOpacity="0.95" />
      <rect x="36" y="36" width="8" height="8" rx="4" fill="#A78BFA" />
      <path
        d="M28 36 C28 33 25 31 25 34 C25 31 22 33 22 36 C22 41 28 44 28 44 C28 44 34 41 34 36 C34 33 31 31 31 34 C31 31 28 33 28 36Z"
        fill="#E91E63"
      />
      <path
        d="M52 36 C52 33 49 31 49 34 C49 31 46 33 46 36 C46 41 52 44 52 44 C52 44 58 41 58 36 C58 33 55 31 55 34 C55 31 52 33 52 36Z"
        fill="#E91E63"
      />
    </svg>
  )
}

/** Alias de marca para Couple Hub */
export const CoupleHubMark = CoupleCashMark
