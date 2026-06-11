import { useState, type ReactNode } from 'react'
import { useAuth } from '../../../lib/AuthProvider'

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth()

  if (!configured) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-white/80">
        Auth is not configured. Set <code>VITE_SUPABASE_URL</code> and
        <code> VITE_SUPABASE_ANON_KEY</code> in your environment.
      </div>
    )
  }
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-white/70 text-sm">
        Loading…
      </div>
    )
  }
  if (!user) return <AuthScreen />
  return <>{children}</>
}

function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    const fn = mode === 'signin' ? signIn : signUp
    const { error } = await fn(email, password)
    setBusy(false)
    if (error) setError(error)
    else if (mode === 'signup') setInfo('Check your email to confirm your account, then sign in.')
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-3xl border border-white/15 bg-black/30 p-6 backdrop-blur-xl"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-white">IZ Mangystau</h1>
          <p className="text-xs text-white/60">
            {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-white/70">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-white/70">Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
          />
        </label>

        {error && <p className="text-xs text-red-300">{error}</p>}
        {info && <p className="text-xs text-emerald-300">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setInfo(null)
          }}
          className="block w-full text-center text-xs text-white/60 hover:text-white/90"
        >
          {mode === 'signin' ? "No account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
