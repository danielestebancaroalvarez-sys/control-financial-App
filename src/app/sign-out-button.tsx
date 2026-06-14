'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

export default function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full py-3.5 rounded-[14px] border-2 border-[#E5E7EB] text-[#6B7280] font-semibold text-[14px] flex items-center justify-center gap-2 hover:border-red-300 hover:text-red-500 hover:bg-red-50 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      Cerrar Sesión
    </button>
  )
}
