import { useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { PROGRAMS, resolvePrograms } from '../../homeContent'
import type { HomeDetail, HomeProgram } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'

type Props = {
  content: SiteContent
  openDetail: (detail: HomeDetail) => void
}

export function ProgramsSection({ content, openDetail }: Props) {
  const [showAll, setShowAll] = useState(false)

  // The full list is resolved once; the first few are featured and the rest are
  // revealed on request so the section never grows into a wall of cards.
  const all = useMemo(() => resolvePrograms(content, 12), [content])
  const featured = all.slice(0, PROGRAMS.limit)
  const remaining = all.slice(PROGRAMS.limit)

  const open = (program: HomeProgram) =>
    openDetail({
      title: program.title,
      category: program.category,
      image: program.image,
      text: program.text,
      details: program.details,
    })

  return (
    <section id="programs" className="section home-programs reveal">
      <div className="home-programs-head">
        <div>
          <span className="section-kicker">{PROGRAMS.eyebrow}</span>
          <AccentHeading lines={PROGRAMS.heading} className="home-programs-title" />
        </div>
        <p>{PROGRAMS.description}</p>
      </div>

      <div className="home-program-grid">
        {featured.map((program, index) => (
          <article className="home-program-card reveal" key={program.id} style={{ transitionDelay: `${index * 100}ms` }}>
            <button type="button" className="home-program-open" onClick={() => open(program)}>
              <span className="home-program-media">
                <img src={program.image} alt="" loading="lazy" />
                <span className="home-program-number">{program.number}</span>
              </span>
              <span className="home-program-body">
                <span className="home-program-meta">
                  <span className="tag">{program.category}</span>
                  <ArrowUpRight size={17} />
                </span>
                <h3>{program.title}</h3>
                <p>{program.text}</p>
                <span className="card-link">
                  View program <ArrowRight size={15} />
                </span>
              </span>
            </button>
          </article>
        ))}
      </div>

      {remaining.length > 0 ? (
        <div className={`home-program-extra${showAll ? ' is-open' : ''}`}>
          <div className="home-program-extra-grid">
            {remaining.map((program) => (
              <article className="home-program-card home-program-card--compact" key={program.id}>
                <button type="button" className="home-program-open" onClick={() => open(program)}>
                  <span className="home-program-body">
                    <span className="home-program-meta">
                      <span className="tag">{program.category}</span>
                      <ArrowUpRight size={17} />
                    </span>
                    <h3>{program.title}</h3>
                    <p>{program.text}</p>
                  </span>
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="home-programs-foot">
        {remaining.length > 0 ? (
          <button className="text-button text-button--green" onClick={() => setShowAll((current) => !current)}>
            {showAll ? 'Show featured only' : `${PROGRAMS.more} (${all.length})`} <ArrowRight size={16} />
          </button>
        ) : null}
      </div>
    </section>
  )
}