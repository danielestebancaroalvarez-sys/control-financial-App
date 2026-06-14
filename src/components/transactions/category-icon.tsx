import { getCategoryIconComponent } from '@/lib/finance/category-icons'

export function CategoryIcon({
  icon,
  className = 'w-5 h-5',
}: {
  icon: string | null
  className?: string
}) {
  const Icon = getCategoryIconComponent(icon)
  return <Icon className={className} />
}
