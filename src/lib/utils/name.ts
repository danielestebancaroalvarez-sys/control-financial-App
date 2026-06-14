export function getFirstName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'Usuario'
  return trimmed.split(/\s+/)[0]
}
