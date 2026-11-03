import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { Field } from './components'
import { Loader2 } from 'lucide-react'
import './admin.css'

export function AdminLogin() {
  const { user, loading, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from || '/admin'
    return <Navigate to={from} replace />
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log you in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login-screen">
      <form className="admin-login-card" onSubmit={submit}>
        <div className="admin-login-logo">
          <img src="/images/logo.jpeg" alt="Lishe Lab" />
          <div>
            <b>Lishe Lab</b>
            <span>Content studio</span>
          </div>
        </div>

        <h1 className="admin-login-title">Sign in</h1>
        <p className="admin-login-sub">Manage the website from one place.</p>

        {error ? <div className="admin-login-error">{error}</div> : null}

        <Field label="Email" required>
          <input
            className="admin-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoFocus
          />
        </Field>

        <Field label="Password" required>
          <input
            className="admin-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>

        <button className="admin-btn admin-btn--primary" type="submit" disabled={busy}>
          {busy ? <Loader2 size={16} className="admin-spin" /> : null}
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={{ margin: '18px 0 0', fontSize: 12, color: 'var(--adm-muted)', textAlign: 'center' }}>
          Need access? Ask a site administrator for an invite.
        </p>
        <Link to="/" style={{ position: 'absolute', left: '-9999px' }}>
          back
        </Link>
      </form>
    </div>
  )
}
