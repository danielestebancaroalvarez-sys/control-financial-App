import type { ComponentType } from 'react'
import {
  Banknote, PlusCircle, ShoppingCart, Utensils, Wrench,
  Home, Zap, Wifi, Car, MoreHorizontal, Tag,
} from 'lucide-react'

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  banknote: Banknote,
  'plus-circle': PlusCircle,
  'shopping-cart': ShoppingCart,
  utensils: Utensils,
  wrench: Wrench,
  home: Home,
  zap: Zap,
  wifi: Wifi,
  car: Car,
  'more-horizontal': MoreHorizontal,
}

export function CategoryIcon({
  icon,
  className = 'w-5 h-5',
}: {
  icon: string | null
  className?: string
}) {
  const Icon = (icon && ICONS[icon]) || Tag
  return <Icon className={className} />
}
