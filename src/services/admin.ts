const API = '/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API}${path}`, { ...init, credentials: 'include' })
  } catch {
    throw new ApiError('Cannot reach the Lishe Lab server. Check that the backend is running.', 0)
  }

  if (response.status === 204) return undefined as T

  let body: Record<string, unknown> = {}
  try {
    body = (await response.json()) as Record<string, unknown>
  } catch {
    body = {}
  }

  if (!response.ok) {
    const message =
      typeof body.message === 'string' && body.message
        ? body.message
        : `Request failed with status ${response.status}`
    throw new ApiError(message, response.status)
  }

  return body as T
}

export type AdminUser = {
  id: number
  username: string
  email: string
  role: string
}

export type MediaItem = {
  id: number
  filename: string
  original_name: string
  path: string
  url: string
  thumbnail_url: string | null
  public_id: string | null
  alt_text: string | null
  mime_type: string | null
  size_bytes: number | null
  width: number | null
  height: number | null
  source: string
  uploaded_by: number | null
  created_at: string
}

export type AdminStats = {
  counts: Record<string, number>
  newMessages: number
  newsletterSubscribers: number
  mediaCount: number
  recentUpdates: Array<{
    collection: string
    id: number
    title: string
    updated_at: string | null
  }>
}

export type MessageItem = {
  id: number
  name: string
  email: string
  topic: string
  message: string
  status: string
  category: string | null
  created_at: string
}

export type SubscriberItem = {
  id: number
  email: string
  name: string | null
  subscribed: boolean
  created_at: string
}

export type HomepageSections = Record<string, Record<string, unknown>>

export const adminApi = {
  me: () => request<{ user: AdminUser }>('/auth/me'),

  login: (email: string, password: string) =>
    request<{ user: AdminUser }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request('/admin/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  homepage: () => request<{ sections: HomepageSections }>('/homepage'),

  saveHomepage: (sections: HomepageSections) =>
    request('/admin/homepage', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections }),
    }),

  resetHomepage: () => request<{ sections: HomepageSections }>('/admin/homepage/reset', { method: 'POST' }),

  list: (collection: string) => request<Record<string, unknown>[]>(`/admin/${collection}`),

  create: (collection: string, body: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/admin/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  update: (collection: string, id: number, body: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/admin/${collection}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  remove: (collection: string, id: number) =>
    request(`/admin/${collection}/${id}`, { method: 'DELETE' }),

  uploadImage: async (file: File, altText = '') => {
    const form = new FormData()
    form.append('image', file)
    form.append('alt_text', altText)
    return request<MediaItem>('/admin/media', { method: 'POST', body: form })
  },

  media: () => request<MediaItem[]>('/admin/media'),

  deleteMedia: (id: number) => request(`/admin/media/${id}`, { method: 'DELETE' }),

  stats: () => request<AdminStats>('/admin/stats'),

  messages: () => request<MessageItem[]>('/admin/messages'),

  setMessageStatus: (id: number, status: string) =>
    request(`/admin/messages/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),

  deleteMessage: (id: number) => request(`/admin/messages/${id}`, { method: 'DELETE' }),

  subscribers: () => request<SubscriberItem[]>('/admin/newsletter'),

  updateSubscriber: (id: number, body: { name?: string; subscribed?: boolean }) =>
    request(`/admin/newsletter/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  deleteSubscriber: (id: number) => request(`/admin/newsletter/${id}`, { method: 'DELETE' }),
}
