import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Search, Trash2, Users } from 'lucide-react'
import { adminApi } from '../services/admin'
import type { SubscriberItem } from '../services/admin'
import { Badge, ConfirmDialog, EmptyState, RowButton, Toggle } from './components'

const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<SubscriberItem[] | null>(null)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<SubscriberItem | null>(null)

  const load = useCallback(async () => {
    const data = await adminApi.subscribers()
    setSubscribers(data)
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch is the external system this effect syncs with
    load().catch(() => {})
  }, [load])

  const filtered = useMemo(() => {
    if (!subscribers) return []
    const term = search.trim().toLowerCase()
    if (!term) return subscribers
    return subscribers.filter(
      (subscriber) =>
        subscriber.email.toLowerCase().includes(term) ||
        (subscriber.name ?? '').toLowerCase().includes(term),
    )
  }, [subscribers, search])

  const toggle = async (subscriber: SubscriberItem) => {
    try {
      await adminApi.updateSubscriber(subscriber.id, { subscribed: !subscriber.subscribed })
      await load()
    } catch {
      // keep the UI as-is on failure
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await adminApi.deleteSubscriber(deleting.id)
      await load()
    } catch {
      // ignore
    }
    setDeleting(null)
  }

  const exportCsv = () => {
    if (!subscribers) return
    const escape = (value: string | null) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['email', 'name', 'subscribed', 'subscribed_at'],
      ...subscribers.map((subscriber) => [
        escape(subscriber.email),
        escape(subscriber.name),
        subscriber.subscribed ? 'yes' : 'no',
        escape(subscriber.created_at),
      ]),
    ]
    const csv = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lishelab-newsletter-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (subscribers === null) {
    return (
      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: 60 }}>
          <div className="admin-spinner" />
        </div>
      </div>
    )
  }

  const active = subscribers.filter((subscriber) => subscriber.subscribed).length

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-head">
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={15} />
              <input
                className="admin-input"
                placeholder="Search subscribers…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Badge tone="success">
              <Users size={12} /> {active} active
            </Badge>
          </div>
          <button className="admin-btn" onClick={exportCsv} disabled={subscribers.length === 0}>
            <Download size={15} /> Export CSV
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No subscribers"
            hint={subscribers.length === 0 ? 'Newsletter signups from the site land here.' : 'No subscribers match this search.'}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Subscribed</th>
                  <th>Joined</th>
                  <th style={{ width: 110 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td>
                      <div className="admin-cell-main">{subscriber.email}</div>
                    </td>
                    <td>{subscriber.name || '—'}</td>
                    <td>
                      <Toggle
                        checked={subscriber.subscribed}
                        onChange={() => void toggle(subscriber)}
                        label={subscriber.subscribed ? 'Active' : 'Unsubscribed'}
                      />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(subscriber.created_at)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <RowButton label="Delete subscriber" danger onClick={() => setDeleting(subscriber)}>
                          <Trash2 size={14} />
                        </RowButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleting ? (
        <ConfirmDialog
          title="Delete subscriber?"
          text={`${deleting.email} will be removed from the newsletter list.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  )
}
