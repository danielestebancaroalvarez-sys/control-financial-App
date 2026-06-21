'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Moon, Sun } from 'lucide-react'
import { updateTheme } from '@/lib/profile/actions'
import type { ThemePreference } from '@/components/theme/apply-theme'
import { MODULE_ACCENT, type AppAccent } from '@/lib/app/module-accent'

export function ThemeSetting({
  current,
  accent = 'finance',
  embedded = false,
}: {
  current: ThemePreference
  accent?: AppAccent
  embedded?: boolean
}) {
  const router = useRouter()
  const [preference, setPreference] = useState(current)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const accentTheme = MODULE_ACCENT[accent]

  useEffect(() => {
    setPreference(current)
  }, [current])

  function handleChange(value: ThemePreference) {
    setPreference(value)
    setError(null)
    startTransition(async () => {
      const result = await updateTheme(value)
      if (result.error) {
        setError(result.error)
        setPreference(current)
        return
      }
      router.refresh()
    })
  }

  const content = (
    <>
      <h2 className="text-[15px] font-bold text-cc-primary mb-1 flex items-center gap-2">
        <Moon className={`w-4 h-4 ${accentTheme.icon}`} />
        Tema de la app
      </h2>
      <p className="text-[12px] text-cc-secondary mb-4">
        Claro u oscuro en toda la interfaz.
      </p>
      <div className="flex rounded-2xl cc-surface-muted p-1">
        {(['light', 'dark'] as const).map(value => (
          <button
            key={value}
            type="button"
            disabled={pending}
            onClick={() => handleChange(value)}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-1.5 ${
              preference === value
                ? `${accentTheme.gradient} text-white shadow-sm`
                : 'text-cc-secondary'
            }`}
          >
            {value === 'light' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {value === 'light' ? 'Claro' : 'Oscuro'}
          </button>
        ))}
      </div>
      {error && <p className="text-[11px] text-red-600 mt-2">{error}</p>}
    </>
  )

  if (embedded) return content

  return <section className="cc-surface rounded-[24px] p-5">{content}</section>
}
