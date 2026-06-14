'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Mail, Lock, Eye, EyeOff, TrendingUp, Heart,
  MessageCircle, PiggyBank, DollarSign, BarChart2, Home, User,
} from 'lucide-react'

type AuthMode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<AuthMode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get('error')
    if (urlError) setError(decodeURIComponent(urlError))
  }, [])

  function switchMode(next: AuthMode) {
    setMode(next)
    setError(null)
    setSuccess(null)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos. Inténtalo de nuevo.'
          : error.message
      )
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim() || undefined,
          name: fullName.trim() || undefined,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(
        error.message === 'User already registered'
          ? 'Este correo ya está registrado. Inicia sesión.'
          : error.message
      )
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/onboarding')
      router.refresh()
      return
    }

    setSuccess(
      'Cuenta creada. Revisa tu correo y confirma el enlace para activar tu cuenta.'
    )
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError(null)
    setSuccess(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError('No se pudo conectar con Google. Inténtalo de nuevo.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-[#A8EDEA] via-[#CBF5D3] to-[#FFD6A5]">

      <div className="pointer-events-none select-none absolute inset-0 overflow-hidden">
        <PiggyBank  className="absolute top-[7%]  left-[5%]  w-9 h-9  -rotate-[15deg] opacity-20 text-teal-400" />
        <TrendingUp className="absolute top-[12%] right-[7%] w-10 h-10 rotate-[10deg]  opacity-20 text-amber-400" />
        <DollarSign className="absolute top-[32%] left-[4%]  w-8 h-8  rotate-[5deg]   opacity-20 text-emerald-500" />
        <BarChart2  className="absolute top-[56%] left-[4%]  w-9 h-9  -rotate-[8deg]  opacity-15 text-indigo-400" />
        <Home       className="absolute bottom-[15%] right-[5%] w-9 h-9 rotate-[12deg] opacity-20 text-amber-400" />
        <PiggyBank  className="absolute bottom-[7%] left-[7%]  w-8 h-8  rotate-[20deg]  opacity-15 text-emerald-500" />
        <DollarSign className="absolute top-[72%] right-[4%] w-7 h-7  -rotate-[5deg]  opacity-20 text-teal-400" />
      </div>

      <div className="relative z-10 w-full max-w-[380px]">
        <div className="rounded-[32px] overflow-hidden bg-white shadow-[0_24px_64px_rgba(0,0,0,0.13),0_4px_16px_rgba(0,0,0,0.07)]">

          <div className="px-7 pt-7 pb-5 bg-gradient-to-br from-[#A8EDEA]/55 via-[#CBF5D3]/40 to-[#FFD6A5]/40">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="relative shrink-0">
                <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-[3px] -right-[3px] w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
                  <Heart className="w-[9px] h-[9px] text-white fill-white" />
                </div>
              </div>
              <div className="leading-tight">
                <p className="text-[22px] font-bold text-gray-900 tracking-tight">CoupleCash</p>
                <p className="text-[11.5px] text-gray-500 font-medium">Finanzas en pareja, fácil y feliz</p>
              </div>
            </div>

            <div className="relative h-[148px] flex items-end justify-center">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[210px] h-[58px] rounded-[30px] bg-[#60C5C0]/28" />
              <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-[190px] h-[50px] rounded-[22px] bg-[#60C5C0]/38" />
              <div className="absolute bottom-3 left-[calc(50%-108px)] rounded-t-[10px] rounded-b-[8px] w-[22px] h-[42px] bg-[#60C5C0]/45" />
              <div className="absolute bottom-3 left-[calc(50%+86px)] rounded-t-[10px] rounded-b-[8px] w-[22px] h-[42px] bg-[#60C5C0]/45" />

              <div className="absolute bottom-9 left-[calc(50%-68px)] flex flex-col items-center">
                <div className="w-8 h-8 rounded-full mb-[3px] shadow bg-gradient-to-br from-[#FBBF24] to-[#F59E0B]" />
                <div className="w-[30px] h-11 rounded-t-[12px] rounded-b-[6px] bg-orange-400" />
              </div>

              <div className="absolute bottom-9 left-[calc(50%+36px)] flex flex-col items-center">
                <div className="w-8 h-8 rounded-full mb-[3px] shadow bg-gradient-to-br from-[#FCA5A5] to-[#F87171]" />
                <div className="w-[30px] h-11 rounded-t-[12px] rounded-b-[6px] bg-emerald-400" />
              </div>

              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-10 h-8 bg-white rounded-[10px] shadow border border-gray-200 flex items-center justify-center">
                <BarChart2 className="w-[18px] h-[18px] text-teal-400" />
              </div>

              <div className="absolute top-2.5 left-1/2 ml-3.5 w-[30px] h-[30px] rounded-full bg-white shadow-md flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-indigo-400 fill-indigo-50" />
              </div>

              <span className="absolute top-2 left-[calc(50%-54px)] text-amber-400 text-sm font-bold">✦</span>
              <span className="absolute top-6 left-[calc(50%-40px)] text-pink-400 text-[8px]">✦</span>
              <span className="absolute top-1.5 left-[calc(50%+52px)] text-emerald-400 text-[10px] font-bold">✦</span>
            </div>
          </div>

          <div className="px-7 pb-7 pt-1">
            <h1 className="text-[22px] font-bold text-gray-900 text-center mt-[18px] mb-5">
              {mode === 'login' ? '¡Bienvenido de Nuevo!' : 'Crea tu cuenta'}
            </h1>

            <form
              onSubmit={mode === 'login' ? handleLogin : handleSignUp}
              className="flex flex-col gap-3"
            >
              {mode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-3.5 rounded-[14px] text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all bg-[#F3F4F6] border-[1.5px] border-[#F3F4F6] focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/30"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3.5 rounded-[14px] text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all bg-[#F3F4F6] border-[1.5px] border-[#F3F4F6] focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/30"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full pl-10 pr-11 py-3.5 rounded-[14px] text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all bg-[#F3F4F6] border-[1.5px] border-[#F3F4F6] focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {mode === 'login' && (
                <div className="flex justify-end -mt-1">
                  <button type="button" className="text-[13px] font-medium text-[#2DD4BF] hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {mode === 'signup' && (
                <p className="text-[11px] text-gray-400 -mt-1">
                  Mínimo 6 caracteres. Si tu proyecto requiere confirmación, te llegará un correo de activación.
                </p>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600 text-center">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-[13px] text-emerald-700 text-center">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-[15px] rounded-[14px] text-white text-[15px] font-bold tracking-[0.1px] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1 bg-gradient-to-r from-[#1ABC9C] to-[#2DD4BF] shadow-[0_6px_20px_rgba(26,188,156,0.38)] hover:shadow-[0_8px_24px_rgba(26,188,156,0.45)]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> {mode === 'login' ? 'Iniciando...' : 'Creando cuenta...'}
                  </span>
                ) : mode === 'login' ? (
                  'Iniciar Sesión'
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </form>

            <div className="flex items-center gap-3 my-[18px]">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[13px] text-gray-400">O continúa con</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full py-[13px] rounded-[14px] bg-white border border-gray-200 text-gray-900 text-[14px] font-semibold flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? <Spinner dark /> : <GoogleIcon />}
              Continuar con Google
            </button>

            <p className="text-center text-[13px] text-gray-500 mt-5">
              {mode === 'login' ? (
                <>
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-gray-900 font-bold hover:text-[#2DD4BF] transition-colors"
                  >
                    Regístrate gratis
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-gray-900 font-bold hover:text-[#2DD4BF] transition-colors"
                  >
                    Inicia sesión
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={dark ? '#D1D5DB' : 'rgba(255,255,255,0.3)'} strokeWidth="3" />
      <path d="M4 12a8 8 0 018-8" stroke={dark ? '#374151' : '#fff'} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
    </svg>
  )
}
