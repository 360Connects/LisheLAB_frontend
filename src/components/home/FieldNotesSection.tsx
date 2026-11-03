import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { FIELD_NOTES, INSIGHT_FILTERS, resolveInsights } from '../../homeContent'
import type { HomeDetail, HomeInsight, InsightFilter } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'

type Props = {
  content: SiteContent
  openDetail: (detail: HomeDetail) => void
}

export function FieldNotesSection({ content, openDetail }: Props) {
  const [filter, setFilter] = useState<InsightFilter>('ALL')
  const { notes, usedFallback } = resolveInsights(content, filter, FIELD_NOTES.limit)

  const open = (note: HomeInsight) =>
    openDetail({
      title: note.title,
      category: note.category,
      image: note.image,
      text: note.text,
      details: [note.date, '5 min read', 'Lishe Lab editorial'],
    })

  return (
    <section id="insights" className="section home-notes reveal">
      <div className="home-notes-head">
        <div>
          <span className="section-kicker">{FIELD_NOTES.eyebrow}</span>
          <AccentHeading lines={FIELD_NOTES.heading} className="home-notes-title" />
        </div>
        <p>{FIELD_NOTES.description}</p>
      </div>

      <div className="filter-row home-notes-filters" role="group" aria-label="Filter field notes by category">
        {INSIGHT_FILTERS.map((item) => (
          <button
            key={item}
            className={filter === item ? 'filter-active' : ''}
            onClick={() => setFilter(item)}
            aria-pressed={filter === item}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="home-note-grid">
        {notes.map((note, index) => (
          <article className="home-note-card reveal" key={note.id} style={{ transitionDelay: `${index * 110}ms` }}>
            <button type="button" className="home-note-open" onClick={() => open(note)}>
              <span className="home-note-media">
                <img src={note.image} alt="" loading="lazy" />
              </span>
              <span className="home-note-body">
                <span className="home-note-meta">
                  <span className="tag">{note.category}</span>
                  <small>{note.date}</small>
                </span>
                <h3>{note.title}</h3>
                <p>{note.text}</p>
                <span className="card-link">
                  {FIELD_NOTES.read} <ArrowRight size={15} />
                </span>
              </span>
            </button>
          </article>
        ))}
      </div>

      {usedFallback && filter !== 'ALL' ? <p className="home-notes-empty">{FIELD_NOTES.fallbackNote(filter)}</p> : null}
    </section>
  )
}