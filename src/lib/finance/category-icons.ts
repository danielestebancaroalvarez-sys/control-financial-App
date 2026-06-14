import type { ComponentType } from 'react'
import {
  Banknote,
  PlusCircle,
  ShoppingCart,
  Utensils,
  Wrench,
  Home,
  Zap,
  Wifi,
  Car,
  MoreHorizontal,
  Tag,
  Tv,
  Coffee,
  Plane,
  Gift,
  Heart,
  Baby,
  Dog,
  Gamepad2,
  Smartphone,
  CreditCard,
  Wallet,
  Music,
  Shirt,
  Dumbbell,
  BookOpen,
  Building2,
  PiggyBank,
  Bus,
  Fuel,
  Stethoscope,
} from 'lucide-react'

export type CategoryIconId =
  | 'tag'
  | 'banknote'
  | 'wallet'
  | 'credit-card'
  | 'shopping-cart'
  | 'utensils'
  | 'coffee'
  | 'car'
  | 'bus'
  | 'fuel'
  | 'plane'
  | 'home'
  | 'zap'
  | 'wifi'
  | 'wrench'
  | 'tv'
  | 'music'
  | 'gamepad-2'
  | 'heart'
  | 'stethoscope'
  | 'baby'
  | 'dog'
  | 'gift'
  | 'shirt'
  | 'dumbbell'
  | 'book-open'
  | 'building-2'
  | 'piggy-bank'
  | 'plus-circle'
  | 'more-horizontal'
  | 'smartphone'

export const CATEGORY_ICON_COMPONENTS: Record<
  CategoryIconId,
  ComponentType<{ className?: string }>
> = {
  tag: Tag,
  banknote: Banknote,
  wallet: Wallet,
  'credit-card': CreditCard,
  'shopping-cart': ShoppingCart,
  utensils: Utensils,
  coffee: Coffee,
  car: Car,
  bus: Bus,
  fuel: Fuel,
  plane: Plane,
  home: Home,
  zap: Zap,
  wifi: Wifi,
  wrench: Wrench,
  tv: Tv,
  music: Music,
  'gamepad-2': Gamepad2,
  heart: Heart,
  stethoscope: Stethoscope,
  baby: Baby,
  dog: Dog,
  gift: Gift,
  shirt: Shirt,
  dumbbell: Dumbbell,
  'book-open': BookOpen,
  'building-2': Building2,
  'piggy-bank': PiggyBank,
  'plus-circle': PlusCircle,
  'more-horizontal': MoreHorizontal,
  smartphone: Smartphone,
}

export const CATEGORY_ICON_OPTIONS: {
  id: CategoryIconId
  label: string
}[] = [
  { id: 'tag', label: 'Etiqueta' },
  { id: 'banknote', label: 'Dinero' },
  { id: 'wallet', label: 'Billetera' },
  { id: 'credit-card', label: 'Tarjeta' },
  { id: 'shopping-cart', label: 'Compras' },
  { id: 'utensils', label: 'Comida' },
  { id: 'coffee', label: 'Café' },
  { id: 'car', label: 'Auto' },
  { id: 'bus', label: 'Bus' },
  { id: 'fuel', label: 'Gasolina' },
  { id: 'plane', label: 'Viajes' },
  { id: 'home', label: 'Hogar' },
  { id: 'zap', label: 'Servicios' },
  { id: 'wifi', label: 'Internet' },
  { id: 'wrench', label: 'Reparación' },
  { id: 'tv', label: 'Streaming' },
  { id: 'music', label: 'Música' },
  { id: 'gamepad-2', label: 'Juegos' },
  { id: 'smartphone', label: 'Celular' },
  { id: 'heart', label: 'Bienestar' },
  { id: 'stethoscope', label: 'Salud' },
  { id: 'baby', label: 'Bebé' },
  { id: 'dog', label: 'Mascotas' },
  { id: 'gift', label: 'Regalos' },
  { id: 'shirt', label: 'Ropa' },
  { id: 'dumbbell', label: 'Deporte' },
  { id: 'book-open', label: 'Educación' },
  { id: 'building-2', label: 'Oficina' },
  { id: 'piggy-bank', label: 'Ahorro' },
  { id: 'plus-circle', label: 'Ingreso' },
  { id: 'more-horizontal', label: 'Otros' },
]

export const DEFAULT_CATEGORY_ICON: CategoryIconId = 'tag'

export function isValidCategoryIcon(icon: string | null | undefined): icon is CategoryIconId {
  return !!icon && icon in CATEGORY_ICON_COMPONENTS
}

export function getCategoryIconComponent(icon: string | null | undefined) {
  if (isValidCategoryIcon(icon)) return CATEGORY_ICON_COMPONENTS[icon]
  return Tag
}
