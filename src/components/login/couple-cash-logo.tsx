export function CoupleCashLogo({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path d="M40 8 L52 24 L46 24 L46 34 L34 34 L34 24 L28 24 Z" fill="#4CAF50" transform="rotate(15 40 22)" />
      <circle cx="30" cy="52" r="18" fill="#FFD54F" stroke="#E6A800" strokeWidth="1.5" />
      <circle cx="50" cy="52" r="18" fill="#FFD54F" stroke="#E6A800" strokeWidth="1.5" />
      <path d="M40 48 C40 44 36 42 36 46 C36 42 32 44 32 48 C32 54 40 58 40 58 C40 58 48 54 48 48 C48 44 44 42 44 46 C44 42 40 44 40 48Z" fill="#E91E63" />
    </svg>
  )
}
