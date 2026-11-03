import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSiteContent, type SiteContent } from './api'

const emptyContent: SiteContent = {
  programs: [],
  stories: [],
  locations: [],
  insights: [],
  heroSlides: [],
  nutrition: [],
  events: [],
  faq: [],
  homepage: {},
}

type Status = 'loading' | 'ready' | 'error'

export function useSiteContent(pollMs = 0) {
  const [content, setContent] = useState<SiteContent>(emptyContent)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const requestId = useRef(0)
  const hasLoaded = useRef(false)

  const load = useCallback(async (silent = false) => {
    const current = ++requestId.current
    const isInitial = !hasLoaded.current
    if (isInitial || !silent) {
      setStatus('loading')
      if (isInitial) setError(null)
    }
    try {
      const next = await fetchSiteContent()
      if (requestId.current !== current) return
      // Keep the last good content if the refresh returned nothing usable.
      setContent(next)
      setStatus('ready')
      setError(null)
      setLastUpdated(Date.now())
      hasLoaded.current = true
    } catch (err) {
      if (requestId.current !== current) return
      // Never wipe the screen on a failed refresh: keep existing content.
      if (isInitial) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Something went wrong while loading content.')
      }
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- fetch is the external system this effect syncs with
    void load()
  }, [load])

  useEffect(() => {
    if (!pollMs) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(true)
    }, pollMs)
    return () => window.clearInterval(timer)
  }, [load, pollMs])

  return {
    content,
    status,
    error,
    lastUpdated,
    refresh: load,
  } as const
}
