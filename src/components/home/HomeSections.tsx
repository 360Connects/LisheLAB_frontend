import type { SiteContent } from '../../api'
import type { HomeDetail } from '../../homeContent'
import { HeroSection } from './HeroSection'
import { IntroSection } from './IntroSection'
import { ReachSection } from './ReachSection'
import { AboutSection } from './AboutSection'
import { ApproachSection } from './ApproachSection'
import { ExplorerSection } from './ExplorerSection'
import { ProgramsSection } from './ProgramsSection'
import { ResearchSection } from './ResearchSection'
import { StoriesSection } from './StoriesSection'
import { RegionsSection } from './RegionsSection'
import { FieldNotesSection } from './FieldNotesSection'
import { EventsSection } from './EventsSection'
import { FinalCtaSection } from './FinalCtaSection'

export type HomeSectionsProps = {
  content: SiteContent
  go: (id: string) => void
  openDetail: (detail: HomeDetail) => void
}

/**
 * The homepage, in reading order. Every section resolves its own content so a
 * missing database record degrades to editorial copy instead of an empty block.
 */
export function HomeSections({ content, go, openDetail }: HomeSectionsProps) {
  return (
    <>
      <HeroSection content={content} go={go} />
      <IntroSection content={content} go={go} />
      <ReachSection content={content} />
      <AboutSection content={content} />
      <ApproachSection content={content} />
      <ExplorerSection content={content} go={go} />
      <ProgramsSection content={content} openDetail={openDetail} />
      <ResearchSection content={content} openDetail={openDetail} />
      <StoriesSection content={content} openDetail={openDetail} />
      <RegionsSection content={content} go={go} />
      <FieldNotesSection content={content} openDetail={openDetail} />
      <EventsSection content={content} openDetail={openDetail} go={go} />
      <FinalCtaSection content={content} go={go} />
    </>
  )
}
