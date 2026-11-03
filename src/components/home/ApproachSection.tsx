import { useMemo } from 'react'
import { Beaker, BookOpen, ShieldCheck, Sprout } from 'lucide-react'
import { APPROACH, mergeSection, resolveHeading, resolveList, resolveText } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'

const ICONS = [BookOpen, ShieldCheck, Sprout, Beaker] as const

type Props = {
  content: SiteContent
}

export function ApproachSection({ content }: Props) {
  const approach = useMemo(
    () => mergeSection(APPROACH as unknown as Record<string, unknown>, content.homepage.approach),
    [content.homepage],
  )

  return (
    <section className="section home-approach soft-green reveal">
      <div className="home-approach-head">
        <div>
          <span className="section-kicker">{resolveText(approach.eyebrow, APPROACH.eyebrow)}</span>
          <AccentHeading lines={resolveHeading(approach.heading, APPROACH.heading)} className="home-approach-title" />
        </div>
        <div className="home-approach-copy">
          <p>{resolveText(approach.description, APPROACH.description)}</p>
          <p>{resolveText(approach.second, APPROACH.second)}</p>
        </div>
      </div>

      <ol className="home-approach-grid">
        {resolveList(approach.areas, APPROACH.areas).map((area, index) => {
          const Icon = ICONS[index % ICONS.length]
          return (
            <li className="home-approach-item reveal" key={area.title} style={{ transitionDelay: `${index * 120}ms` }}>
              <span className="home-approach-icon" aria-hidden="true">
                <Icon size={20} />
              </span>
              <span className="home-approach-number">{`0${index + 1}`}</span>
              <h3 style={{ transitionDelay: '90ms' }}>{resolveText(area.title, APPROACH.areas[index]?.title ?? '')}</h3>
              <p style={{ transitionDelay: '180ms' }}>{resolveText(area.text, APPROACH.areas[index]?.text ?? '')}</p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
