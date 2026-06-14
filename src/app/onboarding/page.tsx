'use client'

import { useState } from 'react'
import { Home, Users, ArrowRight, Loader2 } from 'lucide-react'
import { createHousehold, joinHouseholdByCode } from '@/lib/household/actions'
import type { CurrencyCode } from '@/lib/household/types'
import { CoupleCashLogo } from '@/components/login/couple-cash-logo'

type Step = 'choose' | 'create' | 'join'

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('choose')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [householdName, setHouseholdName] = useState('')
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('AUD')
  const [inviteCode, setInviteCode] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await createHousehold(householdName, baseCurrency)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await joinHouseholdByCode(inviteCode)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B2EBF2] via-[#C8F0DC] to-[#FFE0B2] flex flex-col items-center justify-center px-5 py-10">
      <div className="flex flex-col items-center mb-6">
        <CoupleCashLogo className="w-16 h-16 mb-3" />
        <h1 className="text-[26px] font-bold text-[#2D3436]">CoupleCash</h1>
        <p className="text-[13px] text-[#636E72] mt-1">Configura tu hogar financiero</p>
      </div>

      <div className="w-full max-w-[380px] rounded-[40px] bg-white/90 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.10)] border border-white/60 px-7 py-8">

        {step === 'choose' && (
          <>
            <h2 className="text-[20px] font-bold text-[#2D3436] text-center mb-2">
              ¿Cómo quieres empezar?
            </h2>
            <p className="text-[13px] text-[#636E72] text-center mb-6">
              Crea un hogar nuevo o únete al de tu pareja con un código.
            </p>

            <button
              type="button"
              onClick={() => { setStep('create'); setError(null) }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#F5F5F5] hover:bg-[#E8F8F5] border border-transparent hover:border-[#00BFA5]/30 transition-all mb-3 text-left"
            >
              <div className="w-11 h-11 rounded-full bg-[#00BFA5]/15 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5 text-[#00BFA5]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#2D3436] text-[15px]">Crear un Hogar</p>
                <p className="text-[12px] text-[#636E72]">Serás el administrador y obtendrás un código para invitar</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#B2BEC3]" />
            </button>

            <button
              type="button"
              onClick={() => { setStep('join'); setError(null) }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#F5F5F5] hover:bg-[#E8F8F5] border border-transparent hover:border-[#00BFA5]/30 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-full bg-[#2196F3]/15 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#2196F3]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#2D3436] text-[15px]">Unirme a un Hogar</p>
                <p className="text-[12px] text-[#636E72]">Ingresa el código que te compartió tu pareja</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#B2BEC3]" />
            </button>
          </>
        )}

        {step === 'create' && (
          <form onSubmit={handleCreate}>
            <button
              type="button"
              onClick={() => { setStep('choose'); setError(null) }}
              className="text-[13px] text-[#00BFA5] font-medium mb-4 hover:underline"
            >
              ← Volver
            </button>
            <h2 className="text-[20px] font-bold text-[#2D3436] mb-1">Crear tu Hogar</h2>
            <p className="text-[13px] text-[#636E72] mb-5">Dale un nombre y elige la divisa principal.</p>

            <label className="block text-[12px] font-medium text-[#636E72] mb-1.5">
              Nombre del hogar
            </label>
            <input
              type="text"
              value={householdName}
              onChange={e => setHouseholdName(e.target.value)}
              placeholder="Ej: Hogar Familia Pérez"
              required
              className="w-full px-4 py-3.5 rounded-2xl bg-[#F5F5F5] text-[14px] text-[#2D3436] placeholder:text-[#BDBDBD] outline-none focus:ring-2 focus:ring-[#00BFA5]/30 mb-4"
            />

            <label className="block text-[12px] font-medium text-[#636E72] mb-1.5">
              Divisa base
            </label>
            <div className="flex gap-3 mb-5">
              {(['AUD', 'COP'] as CurrencyCode[]).map(cur => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setBaseCurrency(cur)}
                  className={`flex-1 py-3 rounded-2xl text-[14px] font-semibold transition-all ${
                    baseCurrency === cur
                      ? 'bg-[#00BFA5] text-white shadow-[0_4px_12px_rgba(0,191,165,0.3)]'
                      : 'bg-[#F5F5F5] text-[#636E72] hover:bg-[#EEEEEE]'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600 text-center mb-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#00BFA5] text-white font-bold text-[15px] shadow-[0_6px_20px_rgba(0,191,165,0.35)] hover:bg-[#00A896] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : 'Crear Hogar'}
            </button>
          </form>
        )}

        {step === 'join' && (
          <form onSubmit={handleJoin}>
            <button
              type="button"
              onClick={() => { setStep('choose'); setError(null) }}
              className="text-[13px] text-[#00BFA5] font-medium mb-4 hover:underline"
            >
              ← Volver
            </button>
            <h2 className="text-[20px] font-bold text-[#2D3436] mb-1">Unirse a un Hogar</h2>
            <p className="text-[13px] text-[#636E72] mb-5">
              Pide el código de invitación a quien creó el hogar.
            </p>

            <label className="block text-[12px] font-medium text-[#636E72] mb-1.5">
              Código de invitación
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Ej: A1B2C3D4"
              required
              maxLength={8}
              className="w-full px-4 py-3.5 rounded-2xl bg-[#F5F5F5] text-[18px] text-[#2D3436] placeholder:text-[#BDBDBD] outline-none focus:ring-2 focus:ring-[#00BFA5]/30 tracking-[0.2em] text-center font-bold uppercase mb-5"
            />

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600 text-center mb-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#00BFA5] text-white font-bold text-[15px] shadow-[0_6px_20px_rgba(0,191,165,0.35)] hover:bg-[#00A896] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uniéndose...</> : 'Unirme al Hogar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
