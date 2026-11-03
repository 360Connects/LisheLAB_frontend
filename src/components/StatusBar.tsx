import { AlertTriangle, Loader2, RefreshCw, WifiOff } from 'lucide-react'

type Props = {
  status: 'loading' | 'ready' | 'error'
  error: string | null
  lastUpdated: number | null
  onRefresh: () => void
}

export function StatusBar({ status, error, lastUpdated, onRefresh }: Props) {
  const offline = status === 'error' && error?.includes('Cannot reach')
  const Icon = offline ? WifiOff : AlertTriangle

  if (status === 'error') {
    return (
      <div className="status-bar status-bar--error" role="alert">
        <Icon size={16} />
        <span>{error ?? 'We could not load the site content.'}</span>
        <button type="button" onClick={onRefresh}>
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    )
  }

  return (
    <div className="status-bar" aria-live="polite">
      {status === 'loading' ? (
        <>
          <Loader2 size={14} className="spin" />
          <span>Loading content from the Lishe Lab database…</span>
        </>
      ) : (
        <>
          <span className="status-dot" />
          <span>Live data</span>
          {lastUpdated ? <span className="status-time">updated {new Date(lastUpdated).toLocaleTimeString()}</span> : null}
          <button type="button" onClick={onRefresh} aria-label="Refresh content">
            <RefreshCw size={14} />
          </button>
        </>
      )}
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index} aria-hidden="true">
          <div className="skeleton-block skeleton-block--media" />
          <div className="skeleton-line" style={{ width: '40%' }} />
          <div className="skeleton-line" style={{ width: '85%' }} />
          <div className="skeleton-line" style={{ width: '65%' }} />
        </div>
      ))}
    </>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <p className="empty-state">{message}</p>
}
