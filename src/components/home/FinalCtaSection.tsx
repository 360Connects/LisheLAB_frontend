import { useMemo } from 'react'
import { ArrowUpRight, HeartHandshake, Mail, Sprout, Users } from 'lucide-react'
import { FINAL_CTA, mergeSection, resolveHeading, resolveList, resolveText } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'

const WAYS = [HeartHandshake, Users, Sprout, Mail] as const

type Props = {
  content: SiteContent
  go: (id: string) => void
}

export function FinalCtaSection({ content, go }: Props) {
  const cta = useMemo(
    () => mergeSection(FINAL_CTA as unknown as Record<string, unknown>, content.homepage.cta),
    [content.homepage],
  )

  return (
    <section className="section home-cta section-dark reveal">
      <div className="home-cta-copy">
        <span className="section-kicker">{resolveText(cta.eyebrow, FINAL_CTA.eyebrow)}</span>
        <AccentHeading lines={resolveHeading(cta.heading, FINAL_CTA.heading)} className="home-cta-title" />
        <p>{resolveText(cta.description, FINAL_CTA.description)}</p>

        <div className="home-cta-actions">
          <button className="button button--light" onClick={() => go('contact')}>
            {resolveText(cta.primary, FINAL_CTA.primary)} <ArrowUpRight size={16} />
          </button>
          <button className="text-button home-cta-secondary" onClick={() => go('newsletter')}>
            {resolveText(cta.secondary, FINAL_CTA.secondary)} <ArrowUpRight size={16} />
          </button>
        </div>

        <p className="home-cta-note">{resolveText(cta.note, FINAL_CTA.note)}</p>
      </div>

      <ul className="home-cta-grid">
        {resolveList(cta.ways, FINAL_CTA.ways).map((way, index) => {
          const Icon = WAYS[index % WAYS.length]
          return (
            <li className="home-cta-card reveal" key={way.title} style={{ transitionDelay: `${140 + index * 90}ms` }}>
              <button
                type="button"
                onClick={() => go(way.title === 'Support our work' ? 'newsletter' : 'contact')}
                aria-label={way.title}
              >
                <Icon size={22} />
                <b>{resolveText(way.title, FINAL_CTA.ways[index]?.title ?? '')}</b>
                <span>{resolveText(way.text, FINAL_CTA.ways[index]?.text ?? '')}</span>
                <ArrowUpRight size={17} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
