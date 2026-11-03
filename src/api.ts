const API_BASE = '/api'

export type Program = {
  id: number
  title: string
  category: string
  image_url: string
  text: string
  details: string[]
}

export type Story = {
  id: number
  title: string
  location: string
  stat: string
  image_url: string
  text: string
}

export type Location = {
  id: number
  name: string
  focus: string
  reached: string
  image_url: string
  top_percent: string
  left_percent: string
  lat: number | null
  lng: number | null
}

export type Insight = {
  id: number
  title: string
  category: string
  date: string
  image_url: string
  text: string
}

export type HeroSlide = {
  id: number
  label: string
  title: string
  text: string
  image_url: string
  display_order: number
}

export type NutritionEntry = {
  id: number
  tab_name: string
  title: string
  text: string
  foods: string[]
}

export type EventItem = {
  id: number
  title: string
  date: string
  location: string
  text: string
  image_url: string
}

export type FaqItem = {
  id: number
  question: string
  answer: string
}

export type SiteContent = {
  programs: Program[]
  stories: Story[]
  locations: Location[]
  insights: Insight[]
  heroSlides: HeroSlide[]
  nutrition: NutritionEntry[]
  events: EventItem[]
  faq: FaqItem[]
  /** Raw CMS sections keyed by name (hero, introduction, reach, about, approach, cta). */
  homepage: Record<string, Record<string, unknown>>
}

export type CollectionName =
  | 'programs'
  | 'stories'
  | 'locations'
  | 'insights'
  | 'hero-slides'
  | 'nutrition'
  | 'events'
  | 'faq'

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
    response = await fetch(`${API_BASE}${path}`, init)
  } catch {
    throw new ApiError('Cannot reach the Lishe Lab server. Check that the backend is running.', 0)
  }

  if (!response.ok) {
    let detail = ''
    try {
      const body = await response.json()
      detail = typeof body.error === 'string' ? body.error : ''
    } catch {
      detail = ''
    }
    throw new ApiError(detail || `Request failed with status ${response.status}`, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

const asArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

const withLists = <T extends Record<string, unknown>>(rows: T[], fields: string[]): T[] =>
  rows.map((row) => {
    const next: Record<string, unknown> = { ...row }
    for (const field of fields) next[field] = asArray(row[field])
    return next as T
  })

export const fetchSiteContent = async (): Promise<SiteContent> => {
  const fetchArray = async <T>(promise: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await promise
    } catch {
      return fallback
    }
  }

  const [programs, stories, locations, insights, heroSlides, nutrition, events, faq, homepage] =
    await Promise.all([
      fetchArray(request<Program[]>('/programs'), []),
      fetchArray(request<Story[]>('/stories'), []),
      fetchArray(request<Location[]>('/locations'), []),
      fetchArray(request<Insight[]>('/insights'), []),
      fetchArray(request<HeroSlide[]>('/hero-slides'), []),
      fetchArray(request<NutritionEntry[]>('/nutrition'), []),
      fetchArray(request<EventItem[]>('/events'), []),
      fetchArray(request<FaqItem[]>('/faq'), []),
      fetchArray(request<{ sections: Record<string, Record<string, unknown>> }>('/homepage'), {
        sections: {},
      }),
    ])

  return {
    programs: withLists(programs, ['details']),
    stories,
    locations,
    insights,
    heroSlides,
    nutrition: withLists(nutrition, ['foods']),
    events,
    faq,
    homepage: homepage.sections ?? {},
  }
}

export const createEntry = async <T>(collection: CollectionName, body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(`${API_BASE}/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new ApiError('Could not save the entry. Please try again.', response.status)
  return (await response.json()) as T
}

export const updateEntry = async <T>(collection: CollectionName, id: number, body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(`${API_BASE}/${collection}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new ApiError('Could not update the entry. Please try again.', response.status)
  return (await response.json()) as T
}

export const deleteEntry = async (collection: CollectionName, id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/${collection}/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new ApiError('Could not delete the entry. Please try again.', response.status)
}

export const subscribeToNewsletter = async (email: string): Promise<void> => {
  await request('/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

export const sendMessage = async (payload: {
  name: string
  email: string
  topic: string
  message: string
}): Promise<{ emailNotificationSent: boolean }> => {
  return request('/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
