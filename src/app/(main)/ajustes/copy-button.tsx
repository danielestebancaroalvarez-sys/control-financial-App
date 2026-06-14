'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E0E0E0] text-[12px] font-semibold text-cc-secondary hover:bg-[#F5F5F5] transition-all shrink-0"
    >
      {copied ? (
        <><Check className="w-3.5 h-3.5 text-[#00BFA5]" /> Copiado</>
      ) : (
        <><Copy className="w-3.5 h-3.5" /> Copiar</>
      )}
    </button>
  )
}
