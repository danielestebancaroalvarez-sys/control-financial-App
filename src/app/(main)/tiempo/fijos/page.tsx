import { redirect } from 'next/navigation'

export default function TiempoFijosRedirectPage() {
  redirect('/tiempo/buscar?tab=fijos')
}
