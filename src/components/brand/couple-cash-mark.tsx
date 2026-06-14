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
      <path
        d="M40 8 L52 24 L46 24 L46 34 L34 34 L34 24 L28 24 Z"
        fill="#4CAF50"
        transform="rotate(15 40 22)"
      />
      <circle cx="30" cy="52" r="18" fill="#FFD54F" stroke="#E6A800" strokeWidth="1.5" />
      <circle cx="50" cy="52" r="18" fill="#FFD54F" stroke="#E6A800" strokeWidth="1.5" />
      <path
        d="M40 48 C40 44 36 42 36 46 C36 42 32 44 32 48 C32 54 40 58 40 58 C40 58 48 54 48 48 C48 44 44 42 44 46 C44 42 40 44 40 48Z"
        fill="#E91E63"
      />
    </svg>
  )
}
