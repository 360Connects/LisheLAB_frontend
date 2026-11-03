import { useMemo } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { HERO, mergeSection, resolveHeading, resolveText } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'

type Props = {
  content: SiteContent
  go: (id: string) => void
}

/** Entrance delay in ms, used to build the hero's staggered reveal. */
const at = (ms: number) => ({ animationDelay: `${ms}ms` })

export function HeroSection({ content, go }: Props) {
  const hero = useMemo(
    () => mergeSection(HERO as unknown as Record<string, unknown>, content.homepage.hero),
    [content.homepage],
  )

  const columns = useMemo(() => {
    const pool = [
      ...content.heroSlides.map((slide) => slide.image_url),
      ...content.programs.map((program) => program.image_url),
      ...content.insights.map((insight) => insight.image_url),
      ...content.stories.map((story) => story.image_url),
      ...content.locations.map((location) => location.image_url),
    ].filter((url): url is string => Boolean(url))

    const images = [...new Set(pool)]
    if (images.length === 0) images.push(...HERO.fallbackImages)

    return Array.from({ length: HERO.columns }, (_, column) => ({
      key: column,
      // Sequential rather than strided, so each column draws its own slice of the
      // pool and every tile can end up a different photograph.
      items: Array.from({ length: HERO.tiles }, (_, tile) => images[(column * HERO.tiles + tile) % images.length]),
      duration: HERO.timings[column % HERO.timings.length],
      delay: (column * 11) % 17,
      // Alternate the direction so the two columns drift apart instead of in step.
      down: column % 2 === 1,
    }))
  }, [content])

  return (
    <section id="home" className="hero home-hero">
      <div className="hero-copy">
        <p className="eyebrow home-enter" style={at(80)}>
          <span /> {resolveText(hero.eyebrow, HERO.eyebrow)}
        </p>

        <AccentHeading
          as="h1"
          lines={resolveHeading(hero.heading, HERO.heading)}
          className="home-hero-title"
          step={120}
          start={180}
        />

        <p className="hero-lede home-enter" style={at(520)}>
          {resolveText(hero.paragraph, HERO.paragraph)}
        </p>

        <div className="hero-actions home-enter" style={at(640)}>
          <button className="button button--green" onClick={() => go('programs')}>
            {resolveText(hero.primary, HERO.primary)} <ArrowRight size={17} />
          </button>
          <button className="text-button text-button--green" onClick={() => go('contact')}>
            {resolveText(hero.secondary, HERO.secondary)} <ArrowUpRight size={17} />
          </button>
        </div>

        <p className="hero-note home-enter" style={at(760)}>
          <span className="home-dot" aria-hidden="true" />
          {resolveText(hero.note, HERO.note)}
        </p>
      </div>

      <div className="hero-gallery home-gallery-enter" style={at(320)}>
        {columns.map((column) => (
          <div className="hero-gallery-col" key={column.key}>
            <div
              className={`hero-gallery-track${column.down ? ' hero-gallery-track--down' : ''}`}
              style={{ animationDuration: `${column.duration}s`, animationDelay: `-${column.delay}s` }}
            >
              {[...column.items, ...column.items].map((src, index) => (
                <figure className="hero-tile" key={`${column.key}-${index}`} aria-hidden={index >= column.items.length}>
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = HERO.imageFallback
                    }}
                  />
                </figure>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
