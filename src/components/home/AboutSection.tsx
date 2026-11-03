import { useMemo } from 'react'
import { ABOUT, mergeSection, resolveHeading, resolveList, resolveStrings, resolveText } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'

type Props = {
  content: SiteContent
}

export function AboutSection({ content }: Props) {
  const about = useMemo(
    () => mergeSection(ABOUT as unknown as Record<string, unknown>, content.homepage.about),
    [content.homepage],
  )

  return (
    <section id="about" className="section home-about reveal">
      <div className="home-about-media">
        <div className="home-about-image">
          <img src={ABOUT.image} alt={ABOUT.imageAlt} loading="lazy" />
          <div className="image-caption">
            {ABOUT.caption.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="home-about-body">
        <div className="reveal">
          <span className="section-kicker">{resolveText(about.eyebrow, ABOUT.eyebrow)}</span>
          <AccentHeading lines={resolveHeading(about.heading, ABOUT.heading)} className="home-about-title" />
        </div>

        {resolveStrings(about.paragraphs, ABOUT.paragraphs).map((paragraph, index) => (
          <p className="home-lead reveal" key={paragraph} style={{ transitionDelay: `${110 + index * 100}ms` }}>
            {paragraph}
          </p>
        ))}

        <ol className="home-feature-list">
          {resolveList(about.features, ABOUT.features).map((feature, index) => (
            <li className="home-feature reveal" key={feature.title} style={{ transitionDelay: `${260 + index * 90}ms` }}>
              <span className="home-feature-number">{`0${index + 1}`}</span>
              <div>
                <b>{resolveText(feature.title, ABOUT.features[index]?.title ?? '')}</b>
                <p>{resolveText(feature.text, ABOUT.features[index]?.text ?? '')}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
