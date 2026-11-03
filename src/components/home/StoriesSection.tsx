import { ArrowRight } from 'lucide-react'
import { STORIES, resolveStories } from '../../homeContent'
import type { HomeDetail, HomeStory } from '../../homeContent'
import type { SiteContent } from '../../api'
import { AccentHeading } from './AccentHeading'

type Props = {
  content: SiteContent
  openDetail: (detail: HomeDetail) => void
}

export function StoriesSection({ content, openDetail }: Props) {
  const stories = resolveStories(content, STORIES.limit)

  const open = (story: HomeStory) =>
    openDetail({
      title: story.title,
      category: story.category,
      image: story.image,
      text: story.text,
      details: story.stat ? [story.stat] : [],
    })

  return (
    <section id="impact" className="section home-stories reveal">
      <div className="home-stories-head">
        <div>
          <span className="section-kicker">{STORIES.eyebrow}</span>
          <AccentHeading lines={STORIES.heading} className="home-stories-title" />
        </div>
        <p>{STORIES.description}</p>
      </div>

      <div className="home-story-grid">
        {stories.map((story, index) => (
          <article
            className={`home-story-card${index === 0 ? ' home-story-card--lead' : ''} reveal`}
            key={story.id}
            style={{ transitionDelay: `${index * 120}ms` }}
          >
            <button type="button" className="home-story-open" onClick={() => open(story)}>
              <span className="home-story-media">
                <img src={story.image} alt="" loading="lazy" />
                {story.stat ? <span className="home-story-stat">{story.stat}</span> : null}
              </span>
              <span className="home-story-body">
                <span className="home-story-meta">
                  <span className="tag">{story.category}</span>
                </span>
                <h3>{story.title}</h3>
                <p>{story.text}</p>
                <span className="card-link">
                  {STORIES.read} <ArrowRight size={15} />
                </span>
              </span>
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}