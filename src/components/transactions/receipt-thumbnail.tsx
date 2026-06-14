'use client'

import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'

export function ReceiptThumbnail({
  path,
  householdId,
  className = 'w-10 h-10',
}: {
  path: string | null
  householdId: string
  className?: string
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }

    let cancelled = false
    fetch(
      `/api/receipts/url?path=${encodeURIComponent(path)}&householdId=${householdId}`
    )
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.url) setUrl(data.url)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })

    return () => {
      cancelled = true
    }
  }, [path, householdId])

  if (!path) return null

  if (!url) {
    return (
      <div
        className={`${className} rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0`}
      >
        <Receipt className="w-4 h-4 text-cc-muted" />
      </div>
    )
  }

  return (
    <img
      src={url}
      alt="Recibo adjunto"
      className={`${className} rounded-lg object-cover bg-[#F5F5F5] shrink-0`}
    />
  )
}
