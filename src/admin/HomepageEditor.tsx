import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { adminApi } from '../services/admin'
import type { HomepageSections } from '../services/admin'
import { Field, Notice } from './components'

type SectionField = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'heading' | 'paragraphs' | 'pairs' | 'socials'
  rows?: number
  help?: string
  span?: boolean
  itemLabel?: string
}

type SectionConfig = { title: string; fields: SectionField[] }

const SECTION_CONFIG: Record<string, SectionConfig> = {
  hero: {
    title: 'Hero',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      {
        key: 'heading',
        label: 'Headline',
        type: 'heading',
        help: 'One line per row. Wrap a phrase in *asterisks* to highlight it.',
      },
      { key: 'paragraph', label: 'Paragraph', type: 'textarea', rows: 4, span: true },
      { key: 'primary', label: 'Primary button', type: 'text' },
      { key: 'secondary', label: 'Secondary button', type: 'text' },
      { key: 'note', label: 'Footnote', type: 'text', span: true },
    ],
  },
  introduction: {
    title: 'Introduction',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      {
        key: 'heading',
        label: 'Headline',
        type: 'heading',
        help: 'One line per row. Wrap a phrase in *asterisks* to highlight it.',
      },
      { key: 'paragraphs', label: 'Paragraphs', type: 'paragraphs' },
      { key: 'link', label: 'Link label', type: 'text' },
    ],
  },
  reach: {
    title: 'Our reach',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      {
        key: 'heading',
        label: 'Headline',
        type: 'heading',
        help: 'One line per row. Wrap a phrase in *asterisks* to highlight it.',
      },
      { key: 'description', label: 'Description', type: 'textarea', rows: 3, span: true },
    ],
  },
  about: {
    title: 'About',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      {
        key: 'heading',
        label: 'Headline',
        type: 'heading',
        help: 'One line per row. Wrap a phrase in *asterisks* to highlight it.',
      },
      { key: 'paragraphs', label: 'Paragraphs', type: 'paragraphs' },
      { key: 'features', label: 'Features', type: 'pairs', itemLabel: 'Feature' },
    ],
  },
  approach: {
    title: 'Our approach',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      {
        key: 'heading',
        label: 'Headline',
        type: 'heading',
        help: 'One line per row. Wrap a phrase in *asterisks* to highlight it.',
      },
      { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
      { key: 'second', label: 'Second paragraph', type: 'textarea', rows: 3 },
      { key: 'areas', label: 'Areas', type: 'pairs', itemLabel: 'Area' },
    ],
  },
  cta: {
    title: 'Final call to action',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      {
        key: 'heading',
        label: 'Headline',
        type: 'heading',
        help: 'One line per row. Wrap a phrase in *asterisks* to highlight it.',
      },
      { key: 'description', label: 'Description', type: 'textarea', rows: 3, span: true },
      { key: 'primary', label: 'Primary button', type: 'text' },
      { key: 'secondary', label: 'Secondary button', type: 'text' },
      { key: 'note', label: 'Footnote', type: 'text' },
      { key: 'ways', label: 'Ways to help', type: 'pairs', itemLabel: 'Way' },
    ],
  },
  footer: {
    title: 'Footer',
    fields: [
      { key: 'logo', label: 'Logo image URL', type: 'text' },
      { key: 'brandName', label: 'Brand name', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'textarea', rows: 2, span: true },
      { key: 'email', label: 'Contact email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      {
        key: 'socials',
        label: 'Social links',
        type: 'socials',
        itemLabel: 'Social',
        help: 'Set the account name and full profile URL for each social link.',
      },
      { key: 'manageLabel', label: 'Manage content label', type: 'text' },
      {
        key: 'explore',
        label: 'Explore links',
        type: 'paragraphs',
        help: 'One label per line, in display order.',
      },
      {
        key: 'connect',
        label: 'Connect links',
        type: 'paragraphs',
        help: 'One label per line, in display order.',
      },
      { key: 'copyright', label: 'Copyright line', type: 'text', span: true },
      { key: 'legal', label: 'Legal links', type: 'text' },
    ],
  },
  newsletter: {
    title: 'Newsletter',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      {
        key: 'heading',
        label: 'Headline',
        type: 'heading',
        help: 'One line per row. Wrap a phrase in *asterisks* to highlight it.',
      },
      { key: 'description', label: 'Description', type: 'textarea', rows: 3, span: true },
      { key: 'placeholder', label: 'Email placeholder', type: 'text' },
      {
        key: 'buttonLabel',
        label: 'Button label',
        type: 'text',
        help: 'The button shows an arrow icon; this label is used for accessibility.',
      },
      { key: 'success', label: 'Success message', type: 'textarea', rows: 2, span: true },
    ],
  },
}

const SECTION_ORDER = [
  'hero',
  'introduction',
  'reach',
  'about',
  'approach',
  'cta',
  'newsletter',
  'footer',
]

/** Splits a textarea into trimmed, non-empty lines. */
const lines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean)

const joinLines = (value: readonly string[]) => value.join('\n')

export function HomepageEditor() {
  const [sections, setSections] = useState<HomepageSections>({})
  const [active, setActive] = useState(SECTION_ORDER[0])
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    const data = await adminApi.homepage()
    setSections(data.sections)
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch is the external system this effect syncs with
    load().catch(() => {})
  }, [load])

  const activeSection = sections[active] ?? {}
  const config = SECTION_CONFIG[active]

  const updateField = (key: string, value: unknown) => {
    setSections((current) => ({
      ...current,
      [active]: { ...(current[active] ?? {}), [key]: value },
    }))
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      await adminApi.saveHomepage(sections)
      setNotice('Homepage updated. Changes are live on the website.')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save the homepage.')
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    setResetting(true)
    setNotice(null)
    try {
      const data = await adminApi.resetHomepage()
      setSections(data.sections)
      setNotice('Homepage reset to the editorial defaults.')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not reset the homepage.')
    } finally {
      setResetting(false)
    }
  }

  const headingValue = useMemo(() => {
    const value = sections[active]?.heading
    return Array.isArray(value) ? joinLines(value as string[]) : ''
  }, [sections, active])

  const pairsValue = useMemo(() => {
    const key = config.fields.find((field) => field.type === 'pairs')?.key ?? ''
    const value = sections[active]?.[key]
    return Array.isArray(value) ? (value as Array<{ title: string; text: string }>) : []
  }, [sections, active, config])

  const socialLinksValue = useMemo(() => {
    const value = sections[active]?.socials
    if (!Array.isArray(value)) return []
    return value.flatMap((item): Array<{ label?: string; url?: string }> => {
      if (typeof item === 'string') return [{ label: item, url: '' }]
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const record = item as Record<string, unknown>
        return [{
          label: typeof record.label === 'string' ? record.label : '',
          url: typeof record.url === 'string' ? record.url : '',
        }]
      }
      return []
    })
  }, [sections, active])

  const renderField = (field: SectionField) => {
    if (field.type === 'heading') {
      return (
        <Field key={field.key} label={field.label} help={field.help} className={field.span ? 'span-2' : ''}>
          <textarea
            className="admin-textarea"
            rows={3}
            value={headingValue}
            onChange={(event) => updateField(field.key, lines(event.target.value))}
          />
          <span className="admin-lines-hint">
            Use <code>*asterisks*</code> around the phrase you want highlighted.
          </span>
        </Field>
      )
    }
    if (field.type === 'paragraphs') {
      const value = sections[active]?.[field.key]
      const text = Array.isArray(value) ? joinLines(value as string[]) : ''
      return (
        <Field key={field.key} label={field.label} className="span-2">
          <textarea
            className="admin-textarea"
            rows={6}
            value={text}
            onChange={(event) => updateField(field.key, lines(event.target.value))}
          />
          <span className="admin-lines-hint">{field.help ?? 'One paragraph per line.'}</span>
        </Field>
      )
    }

  if (field.type === 'pairs') {
    const key = field.key
    const itemLabel = field.itemLabel ?? 'Item'
    return (
      <Field key={field.key} label={field.label} className="span-2">
        <div className="admin-pairs">
          {pairsValue.map((pair, index) => (
            <div className="admin-pair-row" key={index}>
              <input
                className="admin-input"
                value={pair.title ?? ''}
                placeholder="Title"
                onChange={(event) => {
                  const next = [...pairsValue]
                  next[index] = { ...pair, title: event.target.value }
                  updateField(key, next)
                }}
              />
              <textarea
                className="admin-textarea"
                value={pair.text ?? ''}
                placeholder="Text"
                onChange={(event) => {
                  const next = [...pairsValue]
                  next[index] = { ...pair, text: event.target.value }
                  updateField(key, next)
                }}
              />
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-btn--icon"
                aria-label={`Remove ${itemLabel}`}
                onClick={() => updateField(key, pairsValue.filter((_, i) => i !== index))}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin-btn admin-btn--small"
            onClick={() => updateField(key, [...pairsValue, { title: '', text: '' }])}
          >
            <Plus size={14} /> Add {itemLabel.toLowerCase()}
          </button>
        </div>
      </Field>
    )
  }

  if (field.type === 'socials') {
    const key = field.key
    const itemLabel = field.itemLabel ?? 'Social link'
    return (
      <Field key={field.key} label={field.label} help={field.help} className="span-2">
        <div className="admin-pairs">
          {socialLinksValue.map((social, index) => (
            <div className="admin-pair-row" key={index}>
              <input
                className="admin-input"
                value={social.label ?? ''}
                placeholder="Platform or account name"
                aria-label={`${itemLabel} ${index + 1} name`}
                onChange={(event) => {
                  const next = [...socialLinksValue]
                  next[index] = { ...social, label: event.target.value }
                  updateField(key, next)
                }}
              />
              <input
                className="admin-input"
                type="url"
                value={social.url ?? ''}
                placeholder="https://example.com/your-account"
                aria-label={`${itemLabel} ${index + 1} URL`}
                onChange={(event) => {
                  const next = [...socialLinksValue]
                  next[index] = { ...social, url: event.target.value }
                  updateField(key, next)
                }}
              />
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-btn--icon"
                aria-label={`Remove ${itemLabel}`}
                onClick={() => updateField(key, socialLinksValue.filter((_, i) => i !== index))}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin-btn admin-btn--small"
            onClick={() => updateField(key, [...socialLinksValue, { label: '', url: '' }])}
          >
            <Plus size={14} /> Add {itemLabel.toLowerCase()}
          </button>
        </div>
      </Field>
    )
  }

    const value = activeSection[field.key]
    return (
      <Field key={field.key} label={field.label} help={field.help} className={field.span ? 'span-2' : ''}>
        <textarea
          className="admin-textarea"
          rows={field.rows ?? 2}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => updateField(field.key, event.target.value)}
        />
      </Field>
    )
  }

  return (
    <div className="admin-page">
      <Notice>
        Edits go live as soon as you save. The homepage updates on the next
        visit — no deploy needed.
      </Notice>

      <div className="admin-card">
        <div className="admin-card-head">
          <div className="admin-section-tabs">
            {SECTION_ORDER.map((name) => (
              <button
                key={name}
                type="button"
                className={`admin-section-tab${active === name ? ' active' : ''}`}
                onClick={() => setActive(name)}
              >
                {SECTION_CONFIG[name].title}
              </button>
            ))}
          </div>
          <div className="admin-toolbar">
            <Link className="admin-btn admin-btn--small" to="/">
              <Globe size={14} /> Preview site
            </Link>
            <button className="admin-btn admin-btn--small" onClick={reset} disabled={resetting}>
              <RotateCcw size={14} /> {resetting ? 'Resetting…' : 'Reset defaults'}
            </button>
          </div>
        </div>

        <form onSubmit={save}>
          <div className="admin-card-body">
            <div className="admin-form-grid">{config.fields.map(renderField)}</div>
          </div>
          <div className="admin-drawer-foot" style={{ borderTop: '1px solid var(--adm-line)' }}>
            <span className="spacer" />
            {notice ? (
              <span style={{ fontSize: 12.5, color: 'var(--adm-green)', fontWeight: 600 }}>{notice}</span>
            ) : null}
            <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
              {saving ? <Loader2 size={15} /> : <Save size={15} />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
