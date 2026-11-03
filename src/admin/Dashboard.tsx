import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  FlaskConical,
  Globe,
  Image as ImageIcon,
  Mail,
  MapPin,
  NotebookPen,
  Plus,
  Upload,
  Users,
} from 'lucide-react'
import { adminApi } from '../services/admin'
import type { AdminStats } from '../services/admin'
import { Badge, EmptyState, Spinner } from './components'

const fmtDate = (value: string | null) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [messages, setMessages] = useState<Array<{ id: number; name: string; topic: string; created_at: string; status: string }>>([])

  const load = useCallback(async () => {
    const [statsData, messageData] = await Promise.all([
      adminApi.stats(),
      adminApi.messages(),
    ])
    setStats(statsData)
    setMessages(messageData.slice(0, 5))
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch is the external system this effect syncs with
    load().catch(() => {})
  }, [load])

  if (!stats) {
    return (
      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: 60 }}>
          <Spinner label="Loading dashboard" />
        </div>
      </div>
    )
  }

  const cards: Array<{ label: string; value: number; to: string; icon: typeof Globe }> = [
    { label: 'Programs', value: stats.counts.programs ?? 0, to: '/admin/programs', icon: Briefcase },
    { label: 'Field notes', value: stats.counts.insights ?? 0, to: '/admin/field-notes', icon: NotebookPen },
    { label: 'Nutrition entries', value: stats.counts.nutrition ?? 0, to: '/admin/nutrition', icon: FlaskConical },
    { label: 'Impact stories', value: stats.counts.stories ?? 0, to: '/admin/impact', icon: MapPin },
    { label: 'Regions', value: stats.counts.locations ?? 0, to: '/admin/regions', icon: MapPin },
    { label: 'Events', value: stats.counts.events ?? 0, to: '/admin/events', icon: CalendarDays },
    { label: 'New messages', value: stats.newMessages, to: '/admin/messages', icon: Mail },
    { label: 'Subscribers', value: stats.newsletterSubscribers, to: '/admin/newsletter', icon: Users },
  ]

  return (
    <div className="admin-page">
      <div className="admin-stats">
        {cards.map((card) => (
          <div className="admin-stat" key={card.label}>
            <div className="admin-stat-value">{card.value}</div>
            <div className="admin-stat-label">
              <card.icon size={12} style={{ verticalAlign: -2, marginRight: 5 }} />
              {card.label}
            </div>
            <Link className="admin-stat-link" to={card.to}>
              Open <ArrowUpRight size={11} />
            </Link>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2 className="admin-card-title">Quick actions</h2>
        </div>
        <div className="admin-card-body">
          <div className="admin-quick-actions">
            <Link className="admin-quick-action" to="/admin/programs">
              <Plus size={19} /> New program
            </Link>
            <Link className="admin-quick-action" to="/admin/homepage">
              <Globe size={19} /> Edit homepage
            </Link>
            <Link className="admin-quick-action" to="/admin/media">
              <Upload size={19} /> Upload image
            </Link>
            <Link className="admin-quick-action" to="/admin/events">
              <CalendarDays size={19} /> Add event
            </Link>
            <Link className="admin-quick-action" to="/">
              <ArrowUpRight size={19} /> View live site
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Recent updates</h2>
          </div>
          {stats.recentUpdates.length === 0 ? (
            <EmptyState title="Nothing published yet" hint="Create your first program, story or event." />
          ) : (
            <ul className="admin-list">
              {stats.recentUpdates.map((item) => (
                <li className="admin-list-item" key={`${item.collection}-${item.id}`}>
                  <span className="admin-list-main">{item.title}</span>
                  <Badge tone="muted">{item.collection}</Badge>
                  <span className="admin-list-meta">{fmtDate(item.updated_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Latest messages</h2>
            <Link className="admin-stat-link" to="/admin/messages">
              All messages <ArrowUpRight size={11} />
            </Link>
          </div>
          {messages.length === 0 ? (
            <EmptyState title="No messages yet" hint="Messages from the contact form land here." />
          ) : (
            <ul className="admin-list">
              {messages.map((message) => (
                <li className="admin-list-item" key={message.id}>
                  <span className="admin-list-main">{message.name}</span>
                  <Badge tone={message.status === 'new' ? 'warn' : 'muted'}>{message.status}</Badge>
                  <span className="admin-list-meta">{fmtDate(message.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2 className="admin-card-title">Media library</h2>
          <Link className="admin-stat-link" to="/admin/media">
            {stats.mediaCount} files <ArrowUpRight size={11} />
          </Link>
        </div>
        <div className="admin-card-body">
          <Link className="admin-quick-action" to="/admin/media" style={{ maxWidth: 220 }}>
            <ImageIcon size={19} /> Manage media
          </Link>
        </div>
      </div>
    </div>
  )
}
