import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { EVENTS, resolveEvents } from '../../homeContent'
import type { HomeDetail, HomeEvent } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'

type Props = {
  content: SiteContent
  openDetail: (detail: HomeDetail) => void
  go: (id: string) => void
}

export function EventsSection({ content, openDetail, go }: Props) {
  const events = resolveEvents(content, EVENTS.limit)

  const open = (event: HomeEvent) =>
    openDetail({
      title: event.title,
      category: 'UPCOMING EVENT',
      image: event.image,
      text: event.text || `${event.title} takes place in ${event.location}.`,
      details: [event.date, event.location, 'Tanzania'],
    })

  return (
    <section className="section soft-green home-events reveal">
      <div className="home-events-head">
        <div>
          <span className="section-kicker">{EVENTS.eyebrow}</span>
          <AccentHeading lines={EVENTS.heading} className="home-events-title" />
        </div>
        <p>{EVENTS.description}</p>
      </div>

      {events.length === 0 ? (
        <div className="home-events-empty reveal">
          <CalendarDays size={22} />
          <b>{EVENTS.empty}</b>
          <p>{EVENTS.emptyNote}</p>
          <button className="text-button text-button--green" onClick={() => go('newsletter')}>
            Join the newsletter <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="home-event-grid">
          {events.map((event, index) => (
            <article
              className={`home-event-card${index === 0 ? ' home-event-card--featured' : ''} reveal`}
              key={event.id}
              style={{ transitionDelay: `${index * 110}ms` }}
            >
              <span className="home-event-date">{event.date}</span>
              <h3>{event.title}</h3>
              {event.text ? <p>{event.text}</p> : null}
              <span className="home-event-place">
                <MapPin size={15} /> {event.location}
              </span>
              <button className="card-link" onClick={() => open(event)}>
                {EVENTS.details} <ArrowRight size={15} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}