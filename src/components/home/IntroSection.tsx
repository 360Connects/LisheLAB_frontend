import { useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { INTRO, mergeSection, resolveHeading, resolveStrings, resolveText } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'

type Props = {
  content: SiteContent
  go: (id: string) => void
}

export function IntroSection({ content, go }: Props) {
  const intro = useMemo(
    () => mergeSection(INTRO as unknown as Record<string, unknown>, content.homepage.introduction),
    [content.homepage],
  )

  return (
    <section id={INTRO.id} className="section home-intro reveal">
      <div className="home-intro-body">
        <div className="reveal">
          <span className="section-kicker">{resolveText(intro.eyebrow, INTRO.eyebrow)}</span>
          <AccentHeading
            lines={resolveHeading(intro.heading, INTRO.heading)}
            className="home-intro-title"
          />
        </div>
        <div className="home-intro-copy">
          {resolveStrings(intro.paragraphs, INTRO.paragraphs).map((paragraph, index) => (
            <p className="reveal" key={paragraph} style={{ transitionDelay: `${120 + index * 110}ms` }}>
              {paragraph}
            </p>
          ))}
          <button className="text-button text-button--green reveal" style={{ transitionDelay: '340ms' }} onClick={() => go('about')}>
            {resolveText(intro.link, INTRO.link)} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}
