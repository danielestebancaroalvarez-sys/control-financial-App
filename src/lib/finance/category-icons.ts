import type { ComponentType } from 'react'
import {
  Apple,
  Baby,
  Banknote,
  Bath,
  Beer,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Camera,
  Candy,
  Car,
  ChefHat,
  Coffee,
  Cookie,
  CreditCard,
  Dog,
  Drumstick,
  Dumbbell,
  Droplets,
  Egg,
  Fish,
  Flower2,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Hammer,
  Heart,
  Home,
  IceCream,
  Landmark,
  Leaf,
  Lightbulb,
  MapPin,
  Milk,
  Moon,
  MoreHorizontal,
  Music,
  Package,
  Paintbrush,
  Palette,
  PiggyBank,
  Pizza,
  Plane,
  PlusCircle,
  Receipt,
  Recycle,
  Sandwich,
  Scissors,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  Sparkles,
  SprayCan,
  Star,
  Stethoscope,
  Store,
  Sun,
  Tag,
  Trees,
  Trophy,
  Tv,
  Umbrella,
  Utensils,
  UtensilsCrossed,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react'

export type CategoryIconId =
  | 'tag'
  | 'banknote'
  | 'wallet'
  | 'credit-card'
  | 'receipt'
  | 'shopping-cart'
  | 'shopping-basket'
  | 'store'
  | 'package'
  | 'utensils'
  | 'utensils-crossed'
  | 'coffee'
  | 'chef-hat'
  | 'pizza'
  | 'sandwich'
  | 'ice-cream'
  | 'cookie'
  | 'candy'
  | 'apple'
  | 'egg'
  | 'fish'
  | 'drumstick'
  | 'milk'
  | 'car'
  | 'bus'
  | 'bike'
  | 'fuel'
  | 'plane'
  | 'map-pin'
  | 'home'
  | 'zap'
  | 'lightbulb'
  | 'wrench'
  | 'hammer'
  | 'tv'
  | 'music'
  | 'gamepad-2'
  | 'heart'
  | 'stethoscope'
  | 'baby'
  | 'dog'
  | 'gift'
  | 'dumbbell'
  | 'trophy'
  | 'book-open'
  | 'graduation-cap'
  | 'building-2'
  | 'landmark'
  | 'briefcase'
  | 'piggy-bank'
  | 'plus-circle'
  | 'more-horizontal'
  | 'smartphone'
  | 'camera'
  | 'paintbrush'
  | 'palette'
  | 'scissors'
  | 'flower-2'
  | 'leaf'
  | 'trees'
  | 'sun'
  | 'moon'
  | 'umbrella'
  | 'sparkles'
  | 'bath'
  | 'spray-can'
  | 'droplets'
  | 'recycle'
  | 'beer'
  | 'star'

export const CATEGORY_ICON_COMPONENTS: Record<
  CategoryIconId,
  ComponentType<{ className?: string }>
> = {
  tag: Tag,
  banknote: Banknote,
  wallet: Wallet,
  'credit-card': CreditCard,
  receipt: Receipt,
  'shopping-cart': ShoppingCart,
  'shopping-basket': ShoppingBasket,
  store: Store,
  package: Package,
  utensils: Utensils,
  'utensils-crossed': UtensilsCrossed,
  coffee: Coffee,
  'chef-hat': ChefHat,
  pizza: Pizza,
  sandwich: Sandwich,
  'ice-cream': IceCream,
  cookie: Cookie,
  candy: Candy,
  apple: Apple,
  egg: Egg,
  fish: Fish,
  drumstick: Drumstick,
  milk: Milk,
  car: Car,
  bus: Bus,
  bike: Bike,
  fuel: Fuel,
  plane: Plane,
  'map-pin': MapPin,
  home: Home,
  zap: Zap,
  lightbulb: Lightbulb,
  wrench: Wrench,
  hammer: Hammer,
  tv: Tv,
  music: Music,
  'gamepad-2': Gamepad2,
  heart: Heart,
  stethoscope: Stethoscope,
  baby: Baby,
  dog: Dog,
  gift: Gift,
  dumbbell: Dumbbell,
  trophy: Trophy,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  'building-2': Building2,
  landmark: Landmark,
  briefcase: Briefcase,
  'piggy-bank': PiggyBank,
  'plus-circle': PlusCircle,
  'more-horizontal': MoreHorizontal,
  smartphone: Smartphone,
  camera: Camera,
  paintbrush: Paintbrush,
  palette: Palette,
  scissors: Scissors,
  'flower-2': Flower2,
  leaf: Leaf,
  trees: Trees,
  sun: Sun,
  moon: Moon,
  umbrella: Umbrella,
  sparkles: Sparkles,
  bath: Bath,
  'spray-can': SprayCan,
  droplets: Droplets,
  recycle: Recycle,
  beer: Beer,
  star: Star,
}

export const CATEGORY_ICON_OPTIONS: {
  id: CategoryIconId
  label: string
}[] = [
  { id: 'tag', label: 'Etiqueta' },
  { id: 'banknote', label: 'Dinero' },
  { id: 'wallet', label: 'Billetera' },
  { id: 'credit-card', label: 'Tarjeta' },
  { id: 'receipt', label: 'Recibo' },
  { id: 'piggy-bank', label: 'Ahorro' },
  { id: 'plus-circle', label: 'Ingreso' },
  { id: 'shopping-cart', label: 'Compras' },
  { id: 'shopping-basket', label: 'Canasta' },
  { id: 'store', label: 'Tienda' },
  { id: 'package', label: 'Paquete' },
  { id: 'utensils', label: 'Comida' },
  { id: 'utensils-crossed', label: 'Restaurante' },
  { id: 'chef-hat', label: 'Cocina' },
  { id: 'coffee', label: 'Café' },
  { id: 'pizza', label: 'Pizza' },
  { id: 'sandwich', label: 'Sandwich' },
  { id: 'ice-cream', label: 'Postre' },
  { id: 'cookie', label: 'Galleta' },
  { id: 'candy', label: 'Dulces' },
  { id: 'apple', label: 'Frutas' },
  { id: 'egg', label: 'Huevos' },
  { id: 'fish', label: 'Pescado' },
  { id: 'drumstick', label: 'Carne' },
  { id: 'milk', label: 'Lácteos' },
  { id: 'beer', label: 'Bebidas' },
  { id: 'car', label: 'Auto' },
  { id: 'bus', label: 'Bus' },
  { id: 'bike', label: 'Bici' },
  { id: 'fuel', label: 'Gasolina' },
  { id: 'plane', label: 'Viajes' },
  { id: 'map-pin', label: 'Ubicación' },
  { id: 'home', label: 'Hogar' },
  { id: 'zap', label: 'Servicios' },
  { id: 'lightbulb', label: 'Luz' },
  { id: 'wrench', label: 'Reparación' },
  { id: 'hammer', label: 'Obra' },
  { id: 'bath', label: 'Aseo' },
  { id: 'spray-can', label: 'Limpieza' },
  { id: 'droplets', label: 'Agua' },
  { id: 'sparkles', label: 'Brillo' },
  { id: 'recycle', label: 'Reciclaje' },
  { id: 'tv', label: 'Streaming' },
  { id: 'music', label: 'Música' },
  { id: 'gamepad-2', label: 'Juegos' },
  { id: 'smartphone', label: 'Celular' },
  { id: 'camera', label: 'Fotos' },
  { id: 'heart', label: 'Bienestar' },
  { id: 'stethoscope', label: 'Salud' },
  { id: 'baby', label: 'Bebé' },
  { id: 'dog', label: 'Mascotas' },
  { id: 'gift', label: 'Regalos' },
  { id: 'dumbbell', label: 'Deporte' },
  { id: 'trophy', label: 'Logros' },
  { id: 'book-open', label: 'Educación' },
  { id: 'graduation-cap', label: 'Estudios' },
  { id: 'building-2', label: 'Oficina' },
  { id: 'landmark', label: 'Banco' },
  { id: 'briefcase', label: 'Trabajo' },
  { id: 'paintbrush', label: 'Arte' },
  { id: 'palette', label: 'Diseño' },
  { id: 'scissors', label: 'Belleza' },
  { id: 'flower-2', label: 'Flores' },
  { id: 'leaf', label: 'Naturaleza' },
  { id: 'trees', label: 'Campo' },
  { id: 'sun', label: 'Día' },
  { id: 'moon', label: 'Noche' },
  { id: 'umbrella', label: 'Clima' },
  { id: 'star', label: 'Favorito' },
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
