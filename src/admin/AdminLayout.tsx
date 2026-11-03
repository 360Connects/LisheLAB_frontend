import { useCallback, useEffect, useState } from 'react'
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import {
  Apple,
  BookOpen,
  Briefcase,
  CalendarDays,
  CircleHelp,
  FlaskConical,
  Globe,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { SITE_SETTINGS, mergeSection } from '../homeContent'
import { adminApi } from '../services/admin'
import { useAuth } from './auth'
import './admin.css'

const NAV: Array<{
  group: string
  items: Array<{ to: string; label: string; icon: typeof Globe; end?: boolean }>
}> = [
  {
    group: 'Content',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/homepage', label: 'Homepage', icon: Globe },
      { to: '/admin/programs', label: 'Programs', icon: Briefcase },
      { to: '/admin/research', label: 'Research', icon: FlaskConical },
      { to: '/admin/nutrition', label: 'Nutrition', icon: Apple },
      { to: '/admin/impact', label: 'Impact stories', icon: BookOpen },
      { to: '/admin/regions', label: 'Regions', icon: MapPin },
      { to: '/admin/field-notes', label: 'Field notes', icon: NotebookPen },
      { to: '/admin/hero', label: 'Hero slides', icon: Layers },
      { to: '/admin/events', label: 'Events', icon: CalendarDays },
      { to: '/admin/faq', label: 'FAQ', icon: CircleHelp },
    ],
  },
  {
    group: 'Engagement',
    items: [
      { to: '/admin/messages', label: 'Messages', icon: Mail },
      { to: '/admin/newsletter', label: 'Newsletter', icon: Users },
      { to: '/admin/media', label: 'Media library', icon: ImageIcon },
    ],
  },
]

const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/homepage': 'Homepage',
  '/admin/programs': 'Programs & projects',
  '/admin/research': 'Research',
  '/admin/nutrition': 'Nutrition explorer',
  '/admin/impact': 'Impact stories',
  '/admin/regions': 'Where we work',
  '/admin/field-notes': 'Field notes',
  '/admin/hero': 'Hero slides',
  '/admin/events': 'Events',
  '/admin/faq': 'FAQ',
  '/admin/messages': 'Messages',
  '/admin/newsletter': 'Newsletter subscribers',
  '/admin/media': 'Media library',
  '/admin/settings': 'Settings',
}

const collapsedKey = 'lishelab-admin-collapsed'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(
    () => window.localStorage.getItem(collapsedKey) === 'true',
  )
  const [siteBrand, setSiteBrand] = useState<string>(SITE_SETTINGS.brandName)
  const [siteLogo, setSiteLogo] = useState<string>(SITE_SETTINGS.logo)

  useEffect(() => {
    let active = true
    void adminApi.homepage().then((data) => {
      if (!active) return
      const settings = mergeSection(
        SITE_SETTINGS as Record<string, unknown>,
        data.sections?.site_settings as Record<string, unknown> | undefined,
      )
      if (typeof settings.brandName === 'string' && settings.brandName.trim()) {
        setSiteBrand(settings.brandName)
      }
      if (typeof settings.logo === 'string' && settings.logo.trim()) {
        setSiteLogo(settings.logo)
      }
    }).catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const title = TITLES[location.pathname] ?? 'Dashboard'

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value
      window.localStorage.setItem(collapsedKey, String(next))
      return next
    })
  }, [])

  return (
    <div className={`admin-shell${collapsed ? ' collapsed' : ''}`}>
      <aside className={`admin-sidebar${mobileOpen ? ' open' : ''}`}>
        <div className="admin-brand">
          <img src={siteLogo} alt={siteBrand} />
          <div className="admin-brand-name">
            {siteBrand}
            <span>Content studio</span>
          </div>
          <button
            type="button"
            className="admin-collapse-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className="admin-nav">
          {NAV.map((section) => (
            <div key={section.group}>
              <div className="admin-nav-group">{section.group}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `admin-nav-link${isActive ? ' active' : ''}`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}

          <div className="admin-nav-group">System</div>
          <NavLink
            to="/admin/settings"
            title={collapsed ? 'Settings' : undefined}
            className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Settings size={17} />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-foot">
          <Link
            to="/"
            title={collapsed ? 'View live site' : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <Globe size={17} />
            <span>View live site</span>
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-btn"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            <span>Menu</span>
          </button>
          <h1 className="admin-topbar-title">{title}</h1>
          <div className="admin-user">
            <span className="admin-user-email">{user?.email}</span>
            <button className="admin-btn admin-btn--ghost admin-btn--small" onClick={logout}>
              <LogOut size={15} /> Log out
            </button>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>

      {mobileOpen ? <div className="admin-backdrop" onClick={() => setMobileOpen(false)} style={{ zIndex: 35 }} /> : null}
    </div>
  )
}
