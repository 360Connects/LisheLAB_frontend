import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

/* ------------------------------------------------------------------------ */

export function Field({
  label,
  help,
  required,
  children,
  className = '',
}: {
  label: string
  help?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`admin-field ${className}`}>
      <span className="admin-field-label">
        {label}
        {required ? <span className="req"> *</span> : null}
      </span>
      {children}
      {help ? <span className="admin-field-help">{help}</span> : null}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <label className="admin-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="admin-toggle-track" aria-hidden="true" />
      <span className="admin-toggle-label">{label}</span>
    </label>
  )
}

export function Badge({
  tone = 'muted',
  children,
}: {
  tone?: 'success' | 'muted' | 'warn' | 'danger'
  children: ReactNode
}) {
  return <span className={`admin-badge admin-badge--${tone}`}>{children}</span>
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="admin-empty">
      <b>{title}</b>
      {hint ? <span>{hint}</span> : null}
    </div>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="admin-spinner" role="status" aria-label={label} />
  )
}

/* ------------------------------------------------------------------------ */

export function Drawer({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="admin-backdrop" onClick={onClose} />
      <aside className="admin-drawer" role="dialog" aria-label={title}>
        <div className="admin-drawer-head">
          <h2 className="admin-drawer-title">{title}</h2>
          <button className="admin-btn admin-btn--ghost admin-btn--icon" onClick={onClose} aria-label="Close panel">
            <X size={17} />
          </button>
        </div>
        <div className="admin-drawer-body">{children}</div>
        {footer ? <div className="admin-drawer-foot">{footer}</div> : null}
      </aside>
    </>
  )
}

export function ConfirmDialog({
  title,
  text,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  title: string
  text: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <>
      <div className="admin-backdrop" onClick={onCancel} />
      <div className="admin-modal" role="alertdialog" aria-label={title}>
        <div className="admin-modal-card">
          <h2 className="admin-modal-title">{title}</h2>
          <p className="admin-modal-text">{text}</p>
          <div className="admin-form-actions">
            <button className="admin-btn admin-btn--danger" onClick={onConfirm}>
              <AlertTriangle size={15} /> {confirmLabel}
            </button>
            <button className="admin-btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="admin-notice">
      <AlertTriangle size={16} />
      <span>{children}</span>
    </div>
  )
}

/** Small inline icon button used inside table rows. */
export function RowButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={`admin-btn admin-btn--ghost admin-btn--icon${danger ? ' admin-btn--danger' : ''}`}
      style={danger ? { borderColor: 'var(--adm-danger)', color: 'var(--adm-danger)', background: 'transparent' } : undefined}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

export { Loader2 }
