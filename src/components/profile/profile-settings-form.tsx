'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Check, Loader2, User } from 'lucide-react'
import { UserAvatar } from '@/components/profile/user-avatar'
import { updateUserProfile } from '@/lib/profile/actions'
import { compressReceiptImage } from '@/lib/receipts/compress-image'
import { isProfileComplete } from '@/lib/profile/types'

export function ProfileSettingsForm({
  initialFullName,
  initialAvatarUrl,
  email,
  onSaved,
  variant = 'settings',
}: {
  initialFullName: string
  initialAvatarUrl: string | null
  email: string | null
  onSaved?: () => void
  variant?: 'settings' | 'wizard'
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fullName, setFullName] = useState(initialFullName)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatarUrl)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const complete = isProfileComplete({ fullName: initialFullName })

  async function handlePick(file: File | null) {
    if (!file) return
    setError(null)
    setSuccess(false)
    try {
      const compressed = await compressReceiptImage(file)
      const nextFile = new File([compressed], 'avatar.jpg', { type: 'image/jpeg' })
      setAvatarFile(nextFile)
      setPreviewUrl(URL.createObjectURL(compressed))
    } catch {
      setError('No se pudo procesar la imagen.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.set('fullName', fullName.trim())
    if (avatarFile) formData.set('avatar', avatarFile)

    const result = await updateUserProfile(formData)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setAvatarFile(null)
    router.refresh()
    onSaved?.()
  }

  const isWizard = variant === 'wizard'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isWizard && (
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-bold text-cc-primary flex items-center gap-2">
              <User className="w-4 h-4 text-[#00BFA5]" />
              Tu perfil
            </h2>
            <p className="text-[12px] text-cc-secondary mt-0.5">
              Tu foto y nombre aparecen cuando registras movimientos en el hogar.
            </p>
          </div>
          {complete && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#E8F5E9] text-[#2E7D32] shrink-0">
              Completo
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative shrink-0 group"
          aria-label="Cambiar foto de perfil"
        >
          <UserAvatar
            name={fullName || 'Usuario'}
            avatarUrl={previewUrl}
            size="lg"
          />
          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#00BFA5] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Camera className="w-3.5 h-3.5" />
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <label className="text-[11px] font-semibold text-cc-secondary">
            Nombre completo
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Ej: Daniel García"
            className="mt-1 w-full px-4 py-3 rounded-xl cc-input text-[14px] outline-none"
            required
            minLength={2}
          />
          {email && (
            <p className="text-[11px] text-cc-muted mt-1.5 truncate">{email}</p>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => handlePick(e.target.files?.[0] ?? null)}
      />

      {error && <p className="text-[12px] text-red-600">{error}</p>}
      {success && !isWizard && (
        <p className="text-[12px] text-[#2E7D32]">Perfil actualizado.</p>
      )}

      <button
        type="submit"
        disabled={loading || fullName.trim().length < 2}
        className={`w-full py-3.5 rounded-2xl text-white text-[14px] font-bold disabled:opacity-60 flex items-center justify-center gap-2 ${
          isWizard
            ? 'bg-[#00BFA5]'
            : 'bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF]'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4" />
            {isWizard ? 'Guardar y continuar' : 'Guardar perfil'}
          </>
        )}
      </button>
    </form>
  )
}
