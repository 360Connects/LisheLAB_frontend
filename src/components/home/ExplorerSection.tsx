import { useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Leaf } from 'lucide-react'
import { useRotation } from '../../hooks'
import { EXPLORER, resolveTips } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'

type Props = {
  content: SiteContent
  go: (id: string) => void
}

export function ExplorerSection({ content, go }: Props) {
  const tips = resolveTips(content)
  const [paused, setPaused] = useState(false)
  const [index, goTo] = useRotation(tips.length, EXPLORER.rotateMs, paused)

  const tip = tips[index] ?? tips[0]
  const total = tips.length
  const label = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`

  return (
    <section id="nutrition" className="section home-explorer reveal">
      <div className="home-explorer-head">
        <div>
          <span className="section-kicker">{EXPLORER.eyebrow}</span>
          <AccentHeading lines={EXPLORER.heading} className="home-explorer-title" />
        </div>
        <p>{EXPLORER.description}</p>
      </div>

      <article
        className="home-tip-card reveal"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="home-tip-media">
          <img src={EXPLORER.image} alt={EXPLORER.imageAlt} loading="lazy" />
        </div>

        <div className="home-tip-body">
          <span className="tag tag--yellow">
            <Leaf size={13} /> {EXPLORER.cardTitle}
          </span>

          {tip ? (
            <div className="home-tip-content" key={tip.id}>
              <h3>{tip.title}</h3>
              <p>{tip.text}</p>
              <ul className="home-tip-tags">
                <li>{tip.tag}</li>
              </ul>
            </div>
          ) : null}

          <div className="home-tip-foot">
            <button className="button button--green" onClick={() => go('insights')}>
              {EXPLORER.button} <ArrowRight size={16} />
            </button>

            <div className="home-tip-nav">
              <span className="home-tip-count">{label}</span>
              <div className="home-tip-progress" aria-hidden="true">
                <span className="home-tip-progress-fill" key={index} style={{ animationDuration: `${EXPLORER.rotateMs}ms` }} />
              </div>
              <span className="home-tip-arrows">
                <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous nutrition idea">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={() => goTo(index + 1)} aria-label="Next nutrition idea">
                  <ChevronRight size={16} />
                </button>
              </span>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}
