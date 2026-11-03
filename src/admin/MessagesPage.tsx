import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Mail, MailOpen, Search, Trash2 } from 'lucide-react'
import { adminApi } from '../services/admin'
import type { MessageItem } from '../services/admin'
import { Badge, ConfirmDialog, EmptyState, RowButton } from './components'

const STATUS_TABS = ['all', 'new', 'read', 'replied', 'archived'] as const

const STATUS_TONE: Record<string, 'warn' | 'success' | 'muted'> = {
  new: 'warn',
  read: 'muted',
  replied: 'success',
  archived: 'muted',
}

const fmtDate = (value: string) =>
  new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

function MessageRow({
  message,
  open,
  busy,
  onToggle,
  onStatus,
  onDelete,
}: {
  message: MessageItem
  open: boolean
  busy: boolean
  onToggle: () => void
  onStatus: (status: string) => void
  onDelete: () => void
}) {
  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer' }}>
        <td>
          <div className="admin-cell-main">{message.name}</div>
          <div className="admin-cell-sub">{message.email}</div>
        </td>
        <td>{message.topic}</td>
        <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(message.created_at)}</td>
        <td>
          <Badge tone={STATUS_TONE[message.status] ?? 'muted'}>{message.status}</Badge>
        </td>
        <td onClick={(event) => event.stopPropagation()}>
          <div className="admin-row-actions">
            {message.status === 'new' ? (
              <RowButton label="Mark read" onClick={() => onStatus('read')}>
                {busy ? <Check size={14} /> : <MailOpen size={14} />}
              </RowButton>
            ) : null}
            <RowButton label="Mark replied" onClick={() => onStatus('replied')}>
              <Mail size={14} />
            </RowButton>
            <RowButton label="Delete" danger onClick={onDelete}>
              <Trash2 size={14} />
            </RowButton>
          </div>
        </td>
      </tr>
      {open ? (
        <tr>
          <td colSpan={5} style={{ background: 'var(--adm-cream)' }}>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {message.message}
            </p>
            <div className="admin-form-actions" style={{ marginTop: 12 }}>
              <select
                className="admin-select"
                style={{ width: 'auto' }}
                value={message.status}
                onChange={(event) => onStatus(event.target.value)}
                aria-label="Message status"
              >
                {STATUS_TABS.slice(1).map((status) => (
                  <option key={status} value={status}>
                    {status[0].toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

export function MessagesPage() {
  const [messages, setMessages] = useState<MessageItem[] | null>(null)
  const [filter, setFilter] = useState<(typeof STATUS_TABS)[number]>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<MessageItem | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    const data = await adminApi.messages()
    setMessages(data)
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch is the external system this effect syncs with
    load().catch(() => {})
  }, [load])

  const filtered = useMemo(() => {
    if (!messages) return []
    const term = search.trim().toLowerCase()
    return messages.filter((message) => {
      if (filter !== 'all' && message.status !== filter) return false
      if (!term) return true
      return (
        message.name.toLowerCase().includes(term) ||
        message.email.toLowerCase().includes(term) ||
        message.message.toLowerCase().includes(term) ||
        message.topic.toLowerCase().includes(term)
      )
    })
  }, [messages, filter, search])

  const setStatus = async (message: MessageItem, status: string) => {
    setBusyId(message.id)
    try {
      await adminApi.setMessageStatus(message.id, status)
      await load()
    } catch {
      // keep the UI as-is on failure
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await adminApi.deleteMessage(deleting.id)
      await load()
    } catch {
      // ignore
    }
    setDeleting(null)
  }

  if (messages === null) {
    return (
      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: 60 }}>
          <div className="admin-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-head">
          <div className="admin-filter-tabs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`admin-filter-tab${filter === tab ? ' active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab === 'all' ? 'All' : tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="admin-search">
            <Search size={15} />
            <input
              className="admin-input"
              placeholder="Search messages…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No messages"
            hint={messages.length === 0 ? 'Messages from the contact form land here.' : 'No messages match this filter.'}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Topic</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((message) => (
                  <MessageRow
                    key={message.id}
                    message={message}
                    open={expanded === message.id}
                    busy={busyId === message.id}
                    onToggle={() => setExpanded(expanded === message.id ? null : message.id)}
                    onStatus={(status) => void setStatus(message, status)}
                    onDelete={() => setDeleting(message)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleting ? (
        <ConfirmDialog
          title="Delete message?"
          text={`The message from ${deleting.name} will be removed permanently.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  )
}
