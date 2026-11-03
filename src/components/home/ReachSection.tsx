import { useMemo } from 'react'
import { useInView } from '../../hooks'
import { REACH, mergeSection, resolveHeading, resolveText, resolveReach } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'
import { StatFigure } from './StatFigure'

type Props = {
  content: SiteContent
}

export function ReachSection({ content }: Props) {
  const [ref, inView] = useInView<HTMLElement>(0.2)
  const stats = resolveReach(content)
  const reach = useMemo(
    () => mergeSection(REACH as unknown as Record<string, unknown>, content.homepage.reach),
    [content.homepage],
  )

  return (
    <section className="section home-reach reveal" ref={ref}>
      <div className="home-reach-head">
        <div>
          <span className="section-kicker">{resolveText(reach.eyebrow, REACH.eyebrow)}</span>
          <AccentHeading lines={resolveHeading(reach.heading, REACH.heading)} className="home-reach-title" />
        </div>
        <p>{resolveText(reach.description, REACH.description)}</p>
      </div>

      <dl className="home-reach-grid">
        {stats.map((stat, index) => (
          <div className="home-reach-item reveal" key={stat.id} style={{ transitionDelay: `${index * 110}ms` }}>
            <dt>
              <strong>
                <StatFigure stat={stat} play={inView} />
              </strong>
            </dt>
            <dd>{stat.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
