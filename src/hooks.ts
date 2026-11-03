import { useCallback, useEffect, useRef, useState } from 'react'

export function useQueryState(key: string, fallback = '') {
  const read = useCallback(() => {
    const value = new URLSearchParams(window.location.search).get(key)
    return value ?? fallback
  }, [key, fallback])

  const [value, setValue] = useState(read)

  useEffect(() => {
    const onPopState = () => setValue(read())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [read])

  const update = useCallback(
    (next: string) => {
      setValue(next)
      const params = new URLSearchParams(window.location.search)
      if (next && next !== fallback) params.set(key, next)
      else params.delete(key)
      const query = params.toString()
      window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
    },
    [key, fallback],
  )

  return [value, update] as const
}

const themeKey = 'lishelab-theme'

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = window.localStorage.getItem(themeKey)
    if (stored === 'light' || stored === 'dark') return stored
    return 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(themeKey, theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}

export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}

export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    const onScroll = () => {
      const current = ids.find((id) => {
        const el = document.getElementById(id)
        if (!el) return false
        return window.scrollY >= el.offsetTop - 180 && window.scrollY < el.offsetTop + el.offsetHeight - 180
      })
      if (current) setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids])

  return active
}
export function useReveal() {
  useEffect(() => {
    const revealObserver =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return
                entry.target.classList.add('visible')
                revealObserver?.unobserve(entry.target)
              })
            },
            { threshold: 0.05, rootMargin: '0px 0px -10% 0px' },
          )

    const observeRevealNodes = (root: Element | Document) => {
      if (root instanceof Element && root.matches('.reveal:not(.visible)')) {
        if (revealObserver) revealObserver.observe(root)
        else root.classList.add('visible')
      }

      root.querySelectorAll('.reveal:not(.visible)').forEach((node) => {
        if (revealObserver) revealObserver.observe(node)
        else node.classList.add('visible')
      })
    }

    observeRevealNodes(document)

    const mutations = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === 'attributes' && record.target instanceof Element) {
          observeRevealNodes(record.target)
        }
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) observeRevealNodes(node)
        })
      })
    })
    mutations.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    })

    if (!revealObserver) {
      return () => mutations.disconnect()
    }

    const revealReached = () => {
      document.querySelectorAll('.reveal:not(.visible)').forEach((node) => {
        const rect = node.getBoundingClientRect()
        if (rect.top < window.innerHeight - 100 && rect.bottom > 0) node.classList.add('visible')
      })
    }

    // Reveal anything already in the viewport immediately so content isn't
    // blank on load/refresh while the observer settles.
    window.requestAnimationFrame(() => {
      revealReached()
      window.setTimeout(revealReached, 100)
    })

    const failsafe = window.setTimeout(revealReached, 1000)
    return () => {
      window.clearTimeout(failsafe)
      mutations.disconnect()
      revealObserver.disconnect()
    }
  }, [])
}

/**
 * Types a headline out character by character, one headline per index.
 * Falls back to the finished string when motion is reduced or disabled.
 */
export function useTypewriter(words: string[], activeIndex: number, enabled = true) {
  const word = words[activeIndex] ?? ''
  const instant =
    !enabled || (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  // `key` marks which headline the stored text belongs to. While it does not
  // match, the render derives the fresh start value instead of writing state
  // from inside the effect, so the timer stays the only state writer.
  const key = word
  const [state, setState] = useState<{ key: string; text: string; done: boolean }>({
    key: '',
    text: '',
    done: true,
  })
  const stale = state.key !== key

  useEffect(() => {
    if (!word || instant) return

    // Longer headlines type faster so each one always finishes well inside the
    // 6s slide interval, which keeps every headline fully readable.
    const perChar = Math.max(26, Math.min(70, 1900 / word.length))
    let index = 0
    let timer = 0

    timer = window.setTimeout(function step() {
      index += 1
      const finished = index >= word.length
      setState({ key: word, text: word.slice(0, index), done: finished })
      if (!finished) timer = window.setTimeout(step, perChar)
    }, 280)

    return () => window.clearTimeout(timer)
  }, [key, word, instant])

  if (stale) return { typed: instant ? word : '', done: instant }
  return { typed: state.text, done: state.done }
}

const motionQuery = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null

/**
 * Tracks the user's motion preference live, so every animation on the site can
 * collapse to an instant, static state the moment it is switched on.
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = motionQuery()
    if (!query) return
    const sync = () => setReduced(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  return reduced
}

/**
 * One-shot viewport entry signal. Latches on first intersection and then
 * disconnects, so a reveal or count-up never plays twice.
 */
export function useInView<T extends Element>(threshold = 0.2, rootMargin = '0px 0px -8% 0px') {
  const ref = useRef<T | null>(null)
  // Without IntersectionObserver there is nothing to wait for, so start settled.
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setInView(true)
        observer.disconnect()
      },
      { threshold, rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, inView] as const
}

/**
 * Eases a number up to `target` once `active` turns true. Reduced motion snaps
 * straight to the final figure instead of animating.
 */
export function useCountUp(target: number, active: boolean, duration = 1500) {
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active || reduced || target <= 0) return
    let frame = 0
    const started = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, target, duration, reduced])

  if (!active) return 0
  // Reduced motion resolves straight to the final figure with no tweening.
  if (reduced || target <= 0) return target
  return value
}

/** Slow, pauseable index rotation used by the nutrition tip and story rails. */
export function useRotation(length: number, intervalMs: number, paused: boolean) {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (paused || reduced || length < 2) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % length), intervalMs)
    return () => window.clearInterval(timer)
  }, [length, intervalMs, paused, reduced])

  const goTo = useCallback(
    (next: number) => {
      if (length < 1) return
      setIndex(((next % length) + length) % length)
    },
    [length],
  )

  return [index, goTo] as const
}
