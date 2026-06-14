'use client'

import { useRef } from 'react'
import { Camera, ImageIcon, X } from 'lucide-react'

export function ReceiptAttachment({
  previewUrl,
  onSelect,
  onClear,
}: {
  previewUrl: string | null
  onSelect: (file: File) => void
  onClear: () => void
}) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  function handleFile(list: FileList | null) {
    const file = list?.[0]
    if (file) onSelect(file)
  }

  return (
    <div className="rounded-2xl bg-[#F5F5F5] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-[#00BFA5]" />
        <span className="text-[13px] font-semibold text-cc-primary">Comprobante (opcional)</span>
      </div>
      <p className="text-[11px] text-cc-secondary">
        Guarda la foto del recibo con este gasto. No usa IA salvo que escanees en Mercado.
      </p>

      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden bg-white">
          <img
            src={previewUrl}
            alt="Vista previa del recibo"
            className="w-full max-h-48 object-contain"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
            aria-label="Quitar imagen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-[12px] font-bold text-cc-primary"
          >
            <Camera className="w-4 h-4 text-[#00BFA5]" />
            Tomar foto
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-[12px] font-bold text-cc-primary"
          >
            <ImageIcon className="w-4 h-4 text-[#00BFA5]" />
            Galería
          </button>
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFile(e.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => handleFile(e.target.files)}
      />
    </div>
  )
}
