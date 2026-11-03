import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Loader2, ShieldCheck } from 'lucide-react'
import { SITE_SETTINGS, mergeSection } from '../homeContent'
import { adminApi } from '../services/admin'
import { useAuth } from './auth'
import { Badge, Field, Notice } from './components'

export function SettingsPage() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [siteSettings, setSiteSettings] = useState<{
    logo: string
    brandName: string
    siteTitle: string
    tagline: string
  }>({
    logo: String(SITE_SETTINGS.logo),
    brandName: String(SITE_SETTINGS.brandName),
    siteTitle: String(SITE_SETTINGS.siteTitle),
    tagline: String(SITE_SETTINGS.tagline),
  })
  const [siteBusy, setSiteBusy] = useState(false)
  const [siteNotice, setSiteNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const loadSiteSettings = useCallback(async () => {
    try {
      const data = await adminApi.homepage()
      const next = mergeSection(SITE_SETTINGS as Record<string, unknown>, data.sections?.site_settings as Record<string, unknown> | undefined)
      setSiteSettings({
        logo: typeof next.logo === 'string' ? next.logo : SITE_SETTINGS.logo,
        brandName: typeof next.brandName === 'string' ? next.brandName : SITE_SETTINGS.brandName,
        siteTitle: typeof next.siteTitle === 'string' ? next.siteTitle : SITE_SETTINGS.siteTitle,
        tagline: typeof next.tagline === 'string' ? next.tagline : SITE_SETTINGS.tagline,
      })
    } catch {
      setSiteNotice('Could not load the site identity settings.')
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch is the external system this effect syncs with
    void loadSiteSettings()
  }, [loadSiteSettings])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaved(false)
    if (newPassword.length < 8) {
      setError('The new password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirm) {
      setError('The new passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await adminApi.changePassword(currentPassword, newPassword)
      setSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the password.')
    } finally {
      setBusy(false)
    }
  }

  const saveSiteSettings = async () => {
    setSiteBusy(true)
    setSiteNotice(null)
    try {
      const data = await adminApi.homepage()
      const sections = data.sections ?? {}
      await adminApi.saveHomepage({
        ...sections,
        site_settings: {
          ...(sections.site_settings ?? {}),
          ...siteSettings,
        },
      })
      setSiteNotice('Site identity updated.')
    } catch (err) {
      setSiteNotice(err instanceof Error ? err.message : 'Could not update the site identity.')
    } finally {
      setSiteBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-head">
          <h2 className="admin-card-title">Account</h2>
        </div>
        <div className="admin-card-body">
          <div className="admin-form-grid">
            <Field label="Name">
              <input className="admin-input" value={user?.username ?? ''} readOnly />
            </Field>
            <Field label="Email">
              <input className="admin-input" value={user?.email ?? ''} readOnly />
            </Field>
            <Field label="Role">
              <div style={{ paddingTop: 6 }}>
                <Badge tone="success">
                  <ShieldCheck size={12} /> {user?.role ?? 'admin'}
                </Badge>
              </div>
            </Field>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2 className="admin-card-title">Site identity</h2>
        </div>
        <div className="admin-card-body">
          <Notice>
            Update the brand values that appear across the website and admin area.
          </Notice>
          <div className="admin-form-grid" style={{ marginTop: 16 }}>
            <Field label="Logo image URL">
              <input
                className="admin-input"
                value={siteSettings.logo}
                onChange={(event) => setSiteSettings((current) => ({ ...current, logo: event.target.value }))}
              />
            </Field>
            <Field label="Brand name">
              <input
                className="admin-input"
                value={siteSettings.brandName}
                onChange={(event) => setSiteSettings((current) => ({ ...current, brandName: event.target.value }))}
              />
            </Field>
            <Field label="Browser title" className="span-2">
              <input
                className="admin-input"
                value={siteSettings.siteTitle}
                onChange={(event) => setSiteSettings((current) => ({ ...current, siteTitle: event.target.value }))}
              />
            </Field>
            <Field label="Tagline" className="span-2">
              <textarea
                className="admin-textarea"
                rows={3}
                value={siteSettings.tagline}
                onChange={(event) => setSiteSettings((current) => ({ ...current, tagline: event.target.value }))}
              />
            </Field>
          </div>
          <div className="admin-form-actions" style={{ marginTop: 16 }}>
            {siteNotice ? (
              <span style={{ fontSize: 12.5, color: siteNotice.includes('updated') ? 'var(--adm-green)' : 'var(--adm-danger)', fontWeight: 600 }}>
                {siteNotice}
              </span>
            ) : null}
            <span style={{ flex: 1 }} />
            <button className="admin-btn admin-btn--primary" type="button" onClick={saveSiteSettings} disabled={siteBusy}>
              {siteBusy ? <Loader2 size={15} /> : null}
              {siteBusy ? 'Saving…' : 'Save site identity'}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2 className="admin-card-title">Change password</h2>
        </div>
        <div className="admin-card-body">
          <Notice>
            Choose a strong password — the admin area controls every
            page on the public site.
          </Notice>
          <form onSubmit={submit} style={{ marginTop: 16 }}>
            <div className="admin-form-grid">
              <Field label="Current password" required>
                <input
                  className="admin-input"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
              </Field>
              <span />
              <Field label="New password" required help="At least 8 characters.">
                <input
                  className="admin-input"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </Field>
              <Field label="Confirm new password" required>
                <input
                  className="admin-input"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                />
              </Field>
            </div>
            <div className="admin-form-actions" style={{ marginTop: 16 }}>
              {error ? (
                <span style={{ fontSize: 12.5, color: 'var(--adm-danger)', fontWeight: 600 }}>
                  {error}
                </span>
              ) : null}
              {saved ? (
                <span style={{ fontSize: 12.5, color: 'var(--adm-green)', fontWeight: 600 }}>
                  <Check size={13} style={{ verticalAlign: -2 }} /> Password updated.
                </span>
              ) : null}
              <span style={{ flex: 1 }} />
              <button className="admin-btn admin-btn--primary" type="submit" disabled={busy}>
                {busy ? <Loader2 size={15} /> : null}
                {busy ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2 className="admin-card-title">How publishing works</h2>
        </div>
        <div className="admin-card-body">
          <p style={{ margin: 0, color: 'var(--adm-ink-soft)', lineHeight: 1.7 }}>
            Content edited here is stored in the Lishe Lab database and served to the
            website through the content API. Homepage sections, programs, stories,
            field notes, events and FAQ entries can be drafted (unpublished) and
            published when ready — unpublished items never appear on the public site.
            Images upload to the media library and can be reused anywhere.
          </p>
        </div>
      </div>
    </div>
  )
}
