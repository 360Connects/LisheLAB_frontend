import { ArrowRight } from 'lucide-react'
import { useInView } from '../../hooks'
import { RESEARCH, resolveResearchMetrics } from '../../homeContent'
import type { HomeDetail } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'
import { StatFigure } from './StatFigure'

type Props = {
  content: SiteContent
  openDetail: (detail: HomeDetail) => void
}

export function ResearchSection({ content, openDetail }: Props) {
  const [ref, inView] = useInView<HTMLElement>(0.18)
  const metrics = resolveResearchMetrics(content)
  const featured = RESEARCH.featured

  return (
    <section id="research" className="section section-dark home-research reveal" ref={ref}>
      <div className="home-research-head">
        <div>
          <span className="section-kicker">{RESEARCH.eyebrow}</span>
          <AccentHeading lines={RESEARCH.heading} className="home-research-title" />
        </div>
        <p>{RESEARCH.description}</p>
      </div>

      <div className="home-research-body">
        <article className="home-research-feature">
          <div className="home-research-media">
            <img src={featured.image} alt={featured.imageAlt} loading="lazy" />
          </div>
          <div className="home-research-copy">
            <span className="tag tag--yellow">{RESEARCH.featuredLabel}</span>
            <h3>{featured.title}</h3>
            <p>{featured.text}</p>
            <button
              className="text-button"
              onClick={() =>
                openDetail({
                  title: featured.title,
                  category: RESEARCH.featuredLabel,
                  image: featured.image,
                  text: featured.text,
                  details: featured.details,
                })
              }
            >
              {featured.button} <ArrowRight size={16} />
            </button>
          </div>
        </article>

        <dl className="home-research-metrics">
          {metrics.map((metric, index) => (
            <div className="reveal" key={metric.id} style={{ transitionDelay: `${index * 100}ms` }}>
              <dt>
                <strong>
                  <StatFigure stat={metric} play={inView} />
                </strong>
              </dt>
              <dd>{metric.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}