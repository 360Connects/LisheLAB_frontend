import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Check,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { adminApi } from '../services/admin'
import type { MediaItem } from '../services/admin'
import {
  Badge,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  RowButton,
  Toggle,
} from './components'

/* ---------------------------------------------------------------------------
   Field + collection configuration. Mirrors the backend collections
   in backend/src/services/content.mjs so the CMS form always matches
   the API contract.
--------------------------------------------------------------------------- */

type FieldConfig = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'list' | 'image' | 'boolean' | 'select'
  options?: string[]
  required?: boolean
  help?: string
  span?: boolean
  rows?: number
}

type ResourceConfig = {
  collection: string
  title: string
  singular: string
  fields: FieldConfig[]
  imageKey?: string
  titleKey: string
  subtitleKey?: string
  orderKey?: string
}

const IMAGE_FIELD: FieldConfig = {
  key: 'image_url',
  label: 'Image',
  type: 'image',
  help: 'Paste a URL or upload a new image.',
}

const PUBLISHED_FIELD: FieldConfig = {
  key: 'published',
  label: 'Published',
  type: 'boolean',
}

const ORDER_FIELD: FieldConfig = {
  key: 'display_order',
  label: 'Display order',
  type: 'number',
  help: 'Lower numbers appear first.',
}

const CONFIGS: Record<string, ResourceConfig> = {
  programs: {
    collection: 'programs',
    title: 'Programs & projects',
    singular: 'Program',
    titleKey: 'title',
    subtitleKey: 'category',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text', required: true },
      { key: 'text', label: 'Summary', type: 'textarea', rows: 3, required: true, span: true },
      { key: 'details', label: 'Details', type: 'list', help: 'One bullet per line.', span: true },
      IMAGE_FIELD,
      { key: 'slug', label: 'Slug', type: 'text', help: 'Leave blank to derive from the title.' },
      { key: 'featured', label: 'Featured', type: 'boolean' },
      PUBLISHED_FIELD,
      ORDER_FIELD,
    ],
  },
  stories: {
    collection: 'stories',
    title: 'Impact stories',
    singular: 'Story',
    titleKey: 'title',
    subtitleKey: 'location',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'location', label: 'Location', type: 'text', required: true },
      { key: 'stat', label: 'Highlight stat', type: 'text' },
      { key: 'text', label: 'Story', type: 'textarea', rows: 4, required: true, span: true },
      IMAGE_FIELD,
      { key: 'slug', label: 'Slug', type: 'text' },
      PUBLISHED_FIELD,
      ORDER_FIELD,
    ],
  },
  locations: {
    collection: 'locations',
    title: 'Regions',
    singular: 'Region',
    titleKey: 'name',
    subtitleKey: 'focus',
    fields: [
      { key: 'name', label: 'Region name', type: 'text', required: true },
      { key: 'focus', label: 'Focus', type: 'text', required: true, help: 'e.g. Nutrition education, School gardens' },
      { key: 'reached', label: 'Reached', type: 'textarea', rows: 2, span: true, help: 'Shown as the description. Starts with a number to count as initiatives.' },
      IMAGE_FIELD,
      { key: 'top_percent', label: 'Marker top', type: 'text', help: 'Map marker position, e.g. 45%' },
      { key: 'left_percent', label: 'Marker left', type: 'text', help: 'Map marker position, e.g. 35%' },
      { key: 'lat', label: 'Latitude', type: 'number', help: 'Company location latitude for the route.' },
      { key: 'lng', label: 'Longitude', type: 'number', help: 'Company location longitude for the route.' },
      PUBLISHED_FIELD,
      ORDER_FIELD,
    ],
  },
  insights: {
    collection: 'insights',
    title: 'Field notes & research',
    singular: 'Field note',
    titleKey: 'title',
    subtitleKey: 'category',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: ['NUTRITION', 'RESEARCH', 'FOOD SYSTEMS', 'COMMUNITY', 'INNOVATION'],
      },
      { key: 'date', label: 'Date label', type: 'text', required: true, help: 'Shown on the card, e.g. "FIELD NOTE" or "12 May 2026"' },
      { key: 'text', label: 'Excerpt', type: 'textarea', rows: 3, required: true, span: true },
      IMAGE_FIELD,
      { key: 'slug', label: 'Slug', type: 'text' },
      { key: 'featured', label: 'Featured', type: 'boolean' },
      PUBLISHED_FIELD,
      ORDER_FIELD,
    ],
  },
  'hero-slides': {
    collection: 'hero-slides',
    title: 'Hero slides',
    singular: 'Hero slide',
    titleKey: 'title',
    subtitleKey: 'label',
    fields: [
      { key: 'label', label: 'Label', type: 'text', required: true },
      { key: 'title', label: 'Headline', type: 'textarea', rows: 2, required: true },
      { key: 'text', label: 'Text', type: 'textarea', rows: 3, span: true },
      IMAGE_FIELD,
      ORDER_FIELD,
      PUBLISHED_FIELD,
    ],
  },
  nutrition: {
    collection: 'nutrition',
    title: 'Nutrition explorer',
    singular: 'Nutrition entry',
    titleKey: 'title',
    subtitleKey: 'tab_name',
    fields: [
      { key: 'tab_name', label: 'Tab name', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'text', label: 'Guidance', type: 'textarea', rows: 3, required: true, span: true },
      { key: 'foods', label: 'Foods', type: 'list', help: 'One food per line.', span: true },
      PUBLISHED_FIELD,
      ORDER_FIELD,
    ],
  },
  events: {
    collection: 'events',
    title: 'Events',
    singular: 'Event',
    titleKey: 'title',
    subtitleKey: 'date',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'text', required: true },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'text', label: 'Description', type: 'textarea', rows: 3, required: true, span: true },
      IMAGE_FIELD,
      { key: 'slug', label: 'Slug', type: 'text' },
      PUBLISHED_FIELD,
      ORDER_FIELD,
    ],
  },
  faq: {
    collection: 'faq',
    title: 'Frequently asked questions',
    singular: 'Question',
    titleKey: 'question',
    subtitleKey: undefined,
    fields: [
      { key: 'question', label: 'Question', type: 'text', required: true, span: true },
      { key: 'answer', label: 'Answer', type: 'textarea', rows: 4, required: true, span: true },
      PUBLISHED_FIELD,
    ],
  },
}

/* ---------------------------------------------------------------------------
   Helpers
--------------------------------------------------------------------------- */

const asArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

const asText = (value: unknown) => (typeof value === 'string' ? value : '')
const asBool = (value: unknown) => value === true || value === 'true'
const asNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const emptyDraft = (config: ResourceConfig): Record<string, unknown> => {
  const draft: Record<string, unknown> = { published: true, display_order: 0 }
  for (const field of config.fields) {
    if (field.type === 'list') draft[field.key] = []
    else if (field.type === 'boolean') draft[field.key] = field.key === 'featured' ? false : true
    else if (field.type === 'number') draft[field.key] = 0
    else draft[field.key] = ''
  }
  return draft
}

const toPayload = (draft: Record<string, unknown>, config: ResourceConfig) => {
  const payload: Record<string, unknown> = {}
  for (const field of config.fields) {
    const value = draft[field.key]
    if (field.type === 'list') payload[field.key] = Array.isArray(value) ? value : asArray(value)
    else if (field.type === 'boolean') payload[field.key] = asBool(value)
    else if (field.type === 'number') payload[field.key] = asNumber(value)
    else payload[field.key] = asText(value)
  }
  return payload
}

/* ---------------------------------------------------------------------------
   Image field with upload
--------------------------------------------------------------------------- */

function ImageField({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (selected: File) => {
    setUploading(true)
    setError(null)
    try {
      const media = await adminApi.uploadImage(selected)
      onChange(media.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin-image-field">
      <div className="admin-image-row">
        <input
          className="admin-input"
          value={value}
          placeholder="https://â€¦ or /uploads/â€¦"
          onChange={(event) => onChange(event.target.value)}
        />
        <label className="admin-btn admin-btn--small" style={{ cursor: 'pointer' }}>
          <Upload size={14} />
          {uploading ? 'Uploadingâ€¦' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(event) => {
              const selected = event.target.files?.[0]
              if (selected) upload(selected)
              event.target.value = ''
            }}
          />
        </label>
      </div>
      {error ? <span className="admin-field-help" style={{ color: 'var(--adm-danger)' }}>{error}</span> : null}
      {value ? (
        <img className="admin-image-preview" src={value} alt="Preview" />
      ) : (
        <div className="admin-image-preview-placeholder">No image selected</div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   ResourcePage
--------------------------------------------------------------------------- */

export function ResourcePage({
  collection,
  title,
}: {
  collection: string
  title?: string
}) {
  const config = CONFIGS[collection]
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleting, setDeleting] = useState<Record<string, unknown> | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[] | null>(null)

  const resolvedTitle = title ?? config?.title ?? collection

  const load = useCallback(async () => {
    if (!config) return
    setLoading(true)
    try {
      const data = await adminApi.list(config.collection)
      setRows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load content.')
    } finally {
      setLoading(false)
    }
  }, [config])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch is the external system this effect syncs with
    load().catch(() => {})
  }, [load])

  const openCreate = () => {
    setIsNew(true)
    setEditing(emptyDraft(config))
  }

  const openEdit = (row: Record<string, unknown>) => {
    setIsNew(false)
    setEditing({ ...row })
  }

  const closeEditor = () => {
    setEditing(null)
    setIsNew(false)
    setMediaLibrary(null)
  }

  const save = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!editing || !config) return
    setSaving(true)
    setError(null)
    try {
      const payload = toPayload(editing, config)
      if (isNew) {
        await adminApi.create(config.collection, payload)
      } else {
        await adminApi.update(config.collection, Number(editing.id), payload)
      }
      closeEditor()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (row: Record<string, unknown>) => {
    if (!config) return
    try {
      await adminApi.update(config.collection, Number(row.id), {
        ...row,
        published: !asBool(row.published),
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update.')
    }
  }

  const confirmDelete = async () => {
    if (!deleting || !config) return
    try {
      await adminApi.remove(config.collection, Number(deleting.id))
      setDeleting(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.')
      setDeleting(null)
    }
  }

  const updateDraft = (key: string, value: unknown) => {
    setEditing((current) => (current ? { ...current, [key]: value } : current))
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term || !config) return rows
    return rows.filter((row) =>
      config.fields.some((field) =>
        asText(row[field.key]).toLowerCase().includes(term),
      ),
    )
  }, [rows, search, config])

  if (!config) {
    return <EmptyState title="Unknown content type" hint={`No configuration for "${collection}".`} />
  }

  const subtitleField = config.subtitleKey
    ? config.fields.find((field) => field.key === config.subtitleKey)
    : undefined

  const hasImage = config.fields.some((field) => field.type === 'image')

  return (
    <div className="admin-page">
      {error ? (
        <div className="admin-login-error" style={{ marginBottom: 0 }}>{error}</div>
      ) : null}

      <div className="admin-card">
        <div className="admin-card-head">
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={15} />
              <input
                className="admin-input"
                placeholder={`Search ${resolvedTitle.toLowerCase()}â€¦`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <span style={{ color: 'var(--adm-muted)', fontSize: 12.5 }}>
              {filtered.length} of {rows.length}
            </span>
          </div>
          <button className="admin-btn admin-btn--primary" onClick={openCreate}>
            <Plus size={15} /> New {config.singular.toLowerCase()}
          </button>
        </div>

        {loading ? (
          <div className="admin-card-body" style={{ padding: 60 }}>
            <Loader2 size={22} className="admin-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={rows.length === 0 ? `No ${resolvedTitle.toLowerCase()} yet` : 'No matches'}
            hint={rows.length === 0 ? `Create your first ${config.singular.toLowerCase()}.` : 'Try a different search.'}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {hasImage ? (
                    <th style={{ width: 70 }}></th>
                  ) : null}
                  <th>{config.singular}</th>
                  {subtitleField ? <th>{subtitleField.label}</th> : null}
                  <th>Status</th>
                  <th style={{ width: 130 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const imageUrl = hasImage
                    ? asText(row[config.fields.find((field) => field.type === 'image')?.key ?? ''])
                    : ''
                  return (
                    <tr key={Number(row.id)}>
                      {hasImage ? (
                        <td>
                          {imageUrl ? (
                            <img className="admin-thumb" src={imageUrl} alt="" />
                          ) : (
                            <span className="admin-thumb" style={{ display: 'grid', placeItems: 'center' }}>
                              <ImageIcon size={16} style={{ color: 'var(--adm-muted)' }} />
                            </span>
                          )}
                        </td>
                      ) : null}
                      <td>
                        <div className="admin-cell-main">{asText(row[config.titleKey]) || 'Untitled'}</div>
                        {subtitleField ? (
                          <div className="admin-cell-sub">{asText(row[subtitleField.key])}</div>
                        ) : null}
                      </td>
                      {subtitleField ? <td>{asText(row[subtitleField.key])}</td> : null}
                      <td>
                        {asBool(row.published) ? (
                          <Badge tone="success">Published</Badge>
                        ) : (
                          <Badge tone="muted">Draft</Badge>
                        )}
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <RowButton label="Edit" onClick={() => openEdit(row)}>
                            <Pencil size={14} />
                          </RowButton>
                          <RowButton
                            label={asBool(row.published) ? 'Unpublish' : 'Publish'}
                            onClick={() => togglePublished(row)}
                          >
                            {asBool(row.published) ? <X size={14} /> : <Check size={14} />}
                          </RowButton>
                          <RowButton label="Delete" danger onClick={() => setDeleting(row)}>
                            <Trash2 size={14} />
                          </RowButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing ? (
        <Drawer
          title={`${isNew ? 'New' : 'Edit'} ${config.singular.toLowerCase()}`}
          onClose={closeEditor}
          footer={
            <>
              {error ? (
                <span style={{ fontSize: 12.5, color: 'var(--adm-danger)', fontWeight: 600 }}>{error}</span>
              ) : null}
              <span className="spacer" />
              <button className="admin-btn" type="button" onClick={closeEditor}>
                Cancel
              </button>
              <button className="admin-btn admin-btn--primary" type="button" onClick={() => void save()} disabled={saving}>
                {saving ? <Loader2 size={15} /> : null}
                {saving ? 'Savingâ€¦' : isNew ? `Create ${config.singular.toLowerCase()}` : 'Save changes'}
              </button>
            </>
          }
        >
          <form onSubmit={save} id="resource-form">
            <div className="admin-form-grid">
              {config.fields.map((field) => (
                <FormField
                  key={field.key}
                  field={field}
                  value={editing[field.key]}
                  onChange={(value) => updateDraft(field.key, value)}
                />
              ))}
            </div>
          </form>
        </Drawer>
      ) : null}
      {mediaLibrary ? (
        <Drawer title="Media library" onClose={() => setMediaLibrary(null)}>
          <div className="admin-media-grid">
            {mediaLibrary.map((item) => (
              <button
                key={item.id}
                type="button"
                className="admin-media-card"
                style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                onClick={() => {
                  updateDraft(
                    config.fields.find((field) => field.type === 'image')?.key ?? 'image_url',
                    item.url,
                  )
                  setMediaLibrary(null)
                }}
              >
                <img src={item.url} alt={item.alt_text ?? ''} />
                <div className="admin-media-card-body">
                  <span className="admin-media-name">{item.original_name}</span>
                </div>
              </button>
            ))}
            {mediaLibrary.length === 0 ? (
              <EmptyState title="No images yet" hint="Upload images from the Media library first." />
            ) : null}
          </div>
        </Drawer>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title={`Delete ${config.singular.toLowerCase()}?`}
          text={`"${asText(deleting[config.titleKey]) || 'Untitled'}" will be removed permanently. This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Per-field form controls
--------------------------------------------------------------------------- */

function FormField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig
  value: unknown
  onChange: (value: unknown) => void
}) {
  if (field.type === 'boolean') {
    return (
      <div className="admin-field">
        <span className="admin-field-label">{field.label}</span>
        <Toggle checked={asBool(value)} onChange={onChange} label={asBool(value) ? 'Yes' : 'No'} />
        {field.help ? <span className="admin-field-help">{field.help}</span> : null}
      </div>
    )
  }

  if (field.type === 'image') {
    return (
      <Field key={field.key} label={field.label} help={field.help} className={field.span ? 'span-2' : ''}>
        <ImageField value={asText(value)} onChange={onChange as (url: string) => void} />
      </Field>
    )
  }
  if (field.type === 'list') {
    const items = asArray(value)
    return (
      <Field key={field.key} label={field.label} help={field.help} className={field.span ? 'span-2' : ''}>
        <div className="admin-pairs">
          {items.map((item, index) => (
            <div className="admin-pair-row" key={index}>
              <input
                className="admin-input"
                value={item}
                onChange={(event) => {
                  const next = [...items]
                  next[index] = event.target.value
                  onChange(next)
                }}
              />
              <span style={{ width: 40 }} />
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-btn--icon"
                aria-label="Remove item"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin-btn admin-btn--small"
            onClick={() => onChange([...items, ''])}
          >
            <Plus size={14} /> Add item
          </button>
        </div>
      </Field>
    )
  }

  if (field.type === 'select') {
    return (
      <Field key={field.key} label={field.label} required={field.required} className={field.span ? 'span-2' : ''}>
        <select
          className="admin-select"
          value={asText(value)}
          onChange={(event) => onChange(event.target.value)}
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
    )
  }

  if (field.type === 'number') {
    return (
      <Field key={field.key} label={field.label} help={field.help}>
        <input
          className="admin-input"
          type="number"
          value={asNumber(value)}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </Field>
    )
  }

  if (field.type === 'textarea') {
    return (
      <Field key={field.key} label={field.label} required={field.required} help={field.help} className={field.span ? 'span-2' : ''}>
        <textarea
          className="admin-textarea"
          rows={field.rows ?? 3}
          value={asText(value)}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
        />
      </Field>
    )
  }

  return (
    <Field key={field.key} label={field.label} required={field.required} help={field.help}>
      <input
        className="admin-input"
        type="text"
        value={asText(value)}
        onChange={(event) => onChange(event.target.value)}
        required={field.required}
      />
    </Field>
  )
}
