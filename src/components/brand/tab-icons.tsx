type TabIconProps = {
  className?: string
  active?: boolean
}

const stroke = (active?: boolean) => (active ? '#00BFA5' : '#B2BEC3')

export function TabHomeIcon({ className = 'w-6 h-6', active }: TabIconProps) {
  const c = stroke(active)
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={c}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="7" r="3" fill="#FFD54F" stroke="#E6A800" strokeWidth="1" />
    </svg>
  )
}

export function TabSearchIcon({ className = 'w-6 h-6', active }: TabIconProps) {
  const c = stroke(active)
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke={c} strokeWidth="2" />
      <path d="M15.5 15.5 21 21" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 10.5h5M10.5 8v5"
        stroke={active ? '#E91E63' : '#D1D5DB'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function TabAddIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function TabSavingsIcon({ className = 'w-6 h-6', active }: TabIconProps) {
  const c = stroke(active)
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="14" rx="8" ry="6" stroke={c} strokeWidth="2" />
      <circle cx="9" cy="11" r="1.5" fill={active ? '#FFD54F' : '#D1D5DB'} />
      <circle cx="15" cy="11" r="1.5" fill={active ? '#FFD54F' : '#D1D5DB'} />
      <path d="M8 8c1-2 3-3 4-3s3 1 4 3" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function TabRadarIcon({ className = 'w-6 h-6', active }: TabIconProps) {
  const c = stroke(active)
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 18V6M8 18v-4M12 18V9M16 18v-7M20 18V4" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 7c0 0 1.5-2 3-2s2 1.5 2 2.5-1.5 2.5-3 2.5"
        fill={active ? '#E91E63' : 'none'}
        stroke={active ? '#E91E63' : '#D1D5DB'}
        strokeWidth="1.2"
      />
    </svg>
  )
}
