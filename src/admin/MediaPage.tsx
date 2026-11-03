import { useCallback, useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { Check, Copy, Image as ImageIcon, Trash2 } from 'lucide-react'
import { adminApi } from '../services/admin'
import type { MediaItem } from '../services/admin'
import { ConfirmDialog, EmptyState, Field } from './components'

const fmtSize = (bytes: number | null) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaPage() {
  const [media, setMedia] = useState<MediaItem[] | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [altEdits, setAltEdits] = useState<Record<number, string>>({})
  const [deleting, setDeleting] = useState<MediaItem | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const data = await adminApi.media()
    setMedia(data)
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch is the external system this effect syncs with
    load().catch(() => {})
  }, [load])

  const upload = async (file: File) => {
    setUploading(true)
    setNotice(null)
    try {
      await adminApi.uploadImage(file, '')
      await load()
      setNotice(`"${file.name}" uploaded.`)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void upload(file)
  }

  const remove = async () => {
    if (!deleting) return
    try {
      await adminApi.deleteMedia(deleting.id)
      await load()
      setNotice(`"${deleting.original_name}" deleted.`)
    } catch {
      // ignore
    }
    setDeleting(null)
  }

  const copyUrl = (item: MediaItem) => {
    void navigator.clipboard?.writeText(item.url).catch(() => {})
    setCopiedId(item.id)
    window.setTimeout(() => setCopiedId((current) => (current === item.id ? null : current)), 1600)
  }

  if (media === null) {
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
      {notice ? (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--adm-green)',
          }}
        >
          {notice}
        </div>
      ) : null}

      <div
        className={`admin-dropzone${dragging ? ' dragging' : ''}`}
        onClick={() => fileInput.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="button"
        aria-label="Upload images"
      >
        <b>{uploading ? 'Uploading…' : 'Drop images here'}</b>
        <span>or click to browse — JPEG, PNG, WebP, GIF, AVIF, SVG up to 8 MB</span>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(event) => {
            const files = event.target.files
            if (files) {
              Array.from(files).forEach((file) => void upload(file))
            }
            event.target.value = ''
          }}
        />
      </div>

      {media.length === 0 ? (
        <div className="admin-card">
          <EmptyState title="No images yet" hint="Upload your first photograph to use it across the site." />
        </div>
      ) : (
        <div className="admin-media-grid">
          {media.map((item) => (
            <figure className="admin-media-card" key={item.id}>
              <img src={item.url} alt={item.alt_text ?? ''} />
              <div className="admin-media-card-body">
                <span className="admin-media-name" title={item.original_name}>
                  {item.original_name}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--adm-muted)' }}>
                  {fmtSize(item.size_bytes)}
                  {item.width ? ` · ${item.width}×${item.height}` : ''}
                </span>
                <input
                  className="admin-input"
                  style={{ padding: '6px 9px', fontSize: 12 }}
                  placeholder="Alt text"
                  value={altEdits[item.id] ?? item.alt_text ?? ''}
                  onChange={(event) =>
                    setAltEdits((current) => ({ ...current, [item.id]: event.target.value }))
                  }
                  aria-label={`Alt text for ${item.original_name}`}
                />
                <div className="admin-row-actions" style={{ justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn--small"
                    onClick={() => copyUrl(item)}
                  >
                    {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                    {copiedId === item.id ? 'Copied' : 'Copy URL'}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--small admin-btn--danger"
                    onClick={() => setDeleting(item)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </figure>
          ))}
        </div>
      )}

      {media.length > 0 ? (
        <div className="admin-card" style={{ marginTop: 20 }}>
          <div className="admin-card-body">
            <Field label="Image URLs" help="Paste any of these URLs into a program, story, event or field note.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {media.slice(0, 5).map((item) => (
                  <code
                    key={item.id}
                    style={{
                      fontSize: 12,
                      background: 'var(--adm-cream)',
                      padding: '6px 10px',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <ImageIcon size={13} style={{ color: 'var(--adm-muted)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.url}</span>
                  </code>
                ))}
              </div>
            </Field>
          </div>
        </div>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete image?"
          text={`"${deleting.original_name}" will be removed from the library. Content already using it will show a fallback image.`}
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  )
}
