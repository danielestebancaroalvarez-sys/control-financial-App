/** Muestra el modal de guía al instante, sin esperar la navegación RSC. */

type Listener = () => void

let pendingGuideId: string | null = null
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach(l => l())
}

export function openGuideOverlay(guideId: string) {
  pendingGuideId = guideId
  emit()
}

export function clearPendingGuideOverlay() {
  if (pendingGuideId === null) return
  pendingGuideId = null
  emit()
}

export function getPendingGuideOverlay(): string | null {
  return pendingGuideId
}

export function subscribeGuideOverlay(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function extractGuideFromHref(href: string): string | null {
  const q = href.indexOf('?')
  if (q === -1) return null
  return new URLSearchParams(href.slice(q + 1)).get('guide')
}
