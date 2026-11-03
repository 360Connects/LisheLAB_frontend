import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth'

/** Redirects unauthenticated visitors to the login page. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card">
          <div className="admin-spinner" aria-label="Loading" />
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}
