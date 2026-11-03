import type { Insight, Program, SiteContent } from './api'

/**
 * Homepage content layer.
 *
 * Every repeated block on the homepage resolves through this module so copy,
 * ordering and counts live in data rather than JSX. Each section prefers whatever
 * the API returns and falls back to the editorial sets below, so the page still
 * reads as a finished, deliberate site when the database is empty.
 *
 * Swapping a placeholder for a real record is a data change, never a JSX change:
 * adjust the `dbValue` reader on a stat, or point a resolver at a new endpoint.
 */

const pad = (value: number) => String(Math.max(0, value)).padStart(2, '0')

/** Stable list key that tolerates a record without an id. */
const keyOf = (prefix: string, id: number | undefined, index: number) => `${prefix}-${id ?? index}`

/**
 * Editorial copy only stands in for a thin database. Once real records fill the
 * requested number of slots the placeholders step aside, so a populated site
 * never mixes invented content into its own records.
 */
const withFallbacks = <T extends { id: string }>(primary: T[], fallback: T[], limit: number) =>
  (primary.length >= limit ? primary : [...primary, ...fallback]).slice(0, limit)

// ---------------------------------------------------------------------------
// Headings
// ---------------------------------------------------------------------------

/**
 * Headings are arrays of lines, and each line is an array of parts. A part with
 * `accent: true` is rendered in the nutrition-yellow highlighter used across the
 * homepage instead of being pulled out of the sentence by hand.
 */
export type HeadingPart = { text: string; accent?: boolean }

export const plain = (value: string): HeadingPart => ({ text: value })
export const accent = (value: string): HeadingPart => ({ text: value, accent: true })

/**
 * CMS headings are stored as plain strings where *asterisks* mark the
 * accented phrase, e.g. "Building *healthier people*,". Parsing keeps
 * the editor simple while the renderer keeps its highlighted spans.
 */
export function parseHeadingLine(line: string): HeadingPart[] {
  const parts: HeadingPart[] = []
  const pattern = /\*([^*]+)\*/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(line))) {
    if (match.index > last) parts.push({ text: line.slice(last, match.index) })
    parts.push({ text: match[1], accent: true })
    last = pattern.lastIndex
  }
  if (last < line.length) parts.push({ text: line.slice(last) })
  return parts.length > 0 ? parts : [{ text: line }]
}

/** Deep-merges a saved CMS section over its editorial default. */
export function mergeSection<T extends Record<string, unknown>>(
  base: T,
  override: Record<string, unknown> | undefined,
): T {
  if (!override || typeof override !== 'object') return base
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined || value === null) continue
    const current = result[key]
    if (
      current !== null &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      result[key] = mergeSection(
        current as Record<string, unknown>,
        value as Record<string, unknown>,
      )
    } else {
      result[key] = value
    }
  }
  return result as T
}

/** A saved string wins only when it carries real content. */
export function resolveText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

/** Accepts the CMS string-lines form; falls back to the structured default. */
export function resolveHeading(
  value: unknown,
  fallback: readonly (readonly HeadingPart[])[],
): HeadingPart[][] {
  if (Array.isArray(value) && value.length > 0 && value.every((line) => typeof line === 'string')) {
    return value.map((line) => parseHeadingLine(line))
  }
  return fallback.map((line) => [...line])
}

/** Accepts a saved array of objects (features, areas, ways). */
export function resolveList<T extends Record<string, unknown>>(
  value: unknown,
  fallback: readonly T[],
): T[] {
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => !!item && typeof item === 'object' && !Array.isArray(item))
  ) {
    return value as T[]
  }
  return [...fallback]
}

/** Accepts a saved array of strings (paragraphs). */
export function resolveStrings(value: unknown, fallback: readonly string[]): string[] {
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && item.trim())
  ) {
    return value
  }
  return [...fallback]
}

export type SocialLink = { label: string; url: string }

export function resolveSocialLinks(value: unknown, fallback: readonly SocialLink[]): SocialLink[] {
  if (Array.isArray(value) && value.length > 0) {
    const parsed = value
      .map((item) => {
        if (typeof item === 'string' && item.trim()) {
          return { label: item, url: '#contact' }
        }
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const record = item as Record<string, unknown>
          const label = typeof record.label === 'string' ? record.label : ''
          const url = typeof record.url === 'string' ? record.url : ''
          if (label || url) {
            return { label: label || 'Link', url: url || '#contact' }
          }
        }
        return null
      })
      .filter((item): item is SocialLink => item !== null)

    if (parsed.length > 0) return parsed
  }

  return [...fallback]
}

export type HomeDetail = {
  title: string
  category: string
  image: string
  text: string
  details: readonly string[]
}

// ---------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------

export const HERO = {
  eyebrow: 'NUTRITION â€¢ INNOVATION â€¢ COMMUNITY',
  heading: [
    [plain('Building '), accent('healthier people'), plain(',')],
    [plain('stronger communities, and')],
    [accent('sustainable food systems'), plain('.')],
  ],
  paragraph:
    'Lishe Lab brings together nutrition knowledge, research, innovation, and community action to explore practical solutions for healthier lives. We believe better nutrition begins with better knowledge, stronger collaboration, and solutions that respond to real community needs.',
  primary: 'Explore our work',
  secondary: 'Partner with us',
  note: 'Healthy people â€¢ Safe food â€¢ Sustainable futures',
  /** Vertical loop: each column scrolls forever, alternating direction so the pair drifts apart. */
  columns: 2,
  tiles: 4,
  /** Seconds for one full loop. Roughly 85px/s - readable, but no longer a crawl. */
  timings: [34, 27],
  imageFallback: '/images/I825b.jpg',
  /**
   * Used only when the API is unreachable. Enough distinct photographs that the
   * collage still reads as a varied reel rather than the same frame repeated.
   */
  fallbackImages: [
    '/images/I825b.jpg',
    '/images/823MU.jpg',
    '/images/7MvEf.jpg',
    '/images/mbeya.jpg',
    '/images/iringa.jpg',
    '/images/mwanza.jpg',
    '/images/GajIw.jpg',
    '/images/2MctH.jpg',
  ],
} as const

// ---------------------------------------------------------------------------
// 2. Introduction
// ---------------------------------------------------------------------------

export const INTRO = {
  id: 'introduction',
  eyebrow: 'NUTRITION FOR REAL LIFE',
  heading: [[plain('Better knowledge. '), accent('Better choices.'), plain(' Better futures.')]],
  paragraphs: [
    'Nutrition is more than what we put on our plates. It is connected to the food we grow, the choices we make, the information we receive, and the systems that shape access to safe and nutritious food.',
    'At Lishe Lab, we connect these ideas through research, education, innovation, and collaboration â€” helping turn knowledge into practical solutions that can make a difference in everyday life.',
  ],
  link: 'Discover Lishe Lab',
} as const

// ---------------------------------------------------------------------------
// 3. Our reach
// ---------------------------------------------------------------------------

export const REACH = {
  eyebrow: 'OUR REACH',
  heading: [[plain('From knowledge '), accent('to action.')]],
  description:
    'Our work connects people, ideas, and communities around a shared goal: creating healthier and more sustainable futures. Through programs, research, partnerships, and community engagement, we turn small steps into meaningful progress.',
} as const

// ---------------------------------------------------------------------------
// 4. About
// ---------------------------------------------------------------------------

export const ABOUT = {
  eyebrow: 'ABOUT LISHE LAB',
  heading: [[plain('Where nutrition meets '), accent('innovation.')]],
  paragraphs: [
    'Lishe Lab is a space where knowledge, research, innovation, and community experience come together. We explore practical approaches to nutrition and food systems while creating opportunities for people to learn, collaborate, experiment, and contribute.',
    'From nutrition education and food safety to research and community innovation, our work is focused on ideas that can move beyond discussion and create meaningful change.',
  ],
  image: '/images/I825b.jpg',
  imageAlt: 'Lishe Lab community conversation in a field',
  caption: ['01', 'People â€¢ planet â€¢ plate'],
  features: [
    { title: 'LEARN', text: 'Making nutrition knowledge simple, accessible, and useful.' },
    { title: 'INNOVATE', text: 'Exploring new ideas and practical approaches to food and nutrition.' },
    { title: 'CONNECT', text: 'Bringing communities, researchers, institutions, and innovators together.' },
    { title: 'IMPACT', text: 'Turning knowledge and collaboration into action.' },
  ],
} as const

// ---------------------------------------------------------------------------
// 5. Our approach
// ---------------------------------------------------------------------------

export const APPROACH = {
  eyebrow: 'OUR APPROACH',
  heading: [[plain('We look beyond '), accent('the plate.')]],
  description:
    'Better nutrition depends on more than individual choices. It is shaped by food production, safety, availability, knowledge, environment, culture, and the systems around us.',
  second: 'Our approach connects these different areas to better understand challenges and develop solutions that are practical, inclusive, and sustainable.',
  areas: [
    { title: 'NUTRITION EDUCATION', text: 'Practical knowledge for healthier everyday choices.' },
    { title: 'FOOD SAFETY & QUALITY', text: 'Building confidence and awareness from farm to family table.' },
    { title: 'CLIMATE-SMART FOOD', text: 'Supporting food systems that are resilient, sustainable, and nourishing.' },
    { title: 'RESEARCH & INNOVATION', text: 'Turning evidence, ideas, and curiosity into useful solutions.' },
  ],
} as const

// ---------------------------------------------------------------------------
// 6. Nutrition explorer
// ---------------------------------------------------------------------------

export const EXPLORER = {
  eyebrow: 'NUTRITION EXPLORER',
  heading: [[plain('Discover better '), accent('nutrition.')]],
  description:
    'Healthy eating does not have to be complicated. Explore practical nutrition knowledge, everyday food ideas, and simple guidance designed to help people make informed choices.',
  cardTitle: "Today's nutrition idea",
  button: 'Explore nutrition',
  image: '/images/823MU.jpg',
  imageAlt: 'Fresh produce growing in a greenhouse',
  /** Rotation period per tip. Snappy enough to keep attention; hover or focus pauses it. */
  rotateMs: 4500,
} as const

// ---------------------------------------------------------------------------
// 7. Programs
// ---------------------------------------------------------------------------

export const PROGRAMS = {
  eyebrow: 'PROGRAMS & PROJECTS',
  heading: [[plain('Turning ideas '), accent('into action.')]],
  description:
    'From community learning to research and innovation, our programs are designed to explore real challenges and develop practical approaches that can contribute to healthier people and stronger food systems.',
  more: 'View all programs',
  limit: 4,
} as const

// ---------------------------------------------------------------------------
// 8. Research
// ---------------------------------------------------------------------------

export const RESEARCH = {
  eyebrow: 'RESEARCH & INNOVATION',
  heading: [[plain('Research that creates '), accent('real-world impact.')]],
  description:
    'Good research should not remain on a shelf. We connect evidence with people, communities, and practical challenges to explore ideas that can inform better decisions and create opportunities for action.',
  featuredLabel: 'FEATURED STUDY',
  featured: {
    title: 'What makes a food system resilient?',
    text: 'We explore how farmers, families, communities, and food businesses respond to changing conditions and how stronger food systems can contribute to healthier lives.',
    image: '/images/7MvEf.jpg',
    imageAlt: 'Researcher working with a microscope',
    button: 'Read the study',
    details: ['Community-led research', 'Cross-sector collaboration', 'Actionable recommendations'],
  },
} as const

// ---------------------------------------------------------------------------
// 9. Stories of impact
// ---------------------------------------------------------------------------

export const STORIES = {
  eyebrow: 'STORIES OF IMPACT',
  heading: [[plain('Change looks '), accent('like this.')]],
  description:
    'Behind every program is a person. Behind every number is a community. Our impact stories highlight the people, experiences, ideas, and lessons that make the work meaningful.',
  read: 'Read story',
  limit: 3,
} as const

// ---------------------------------------------------------------------------
// 10. Where we work
// ---------------------------------------------------------------------------

export const REGIONS = {
  eyebrow: 'WHERE WE WORK',
  heading: [[plain('Across Tanzania, '), accent('with communities.')]],
  description:
    'Our work is grounded in local knowledge and strengthened through collaboration. We listen, learn, and work alongside communities to understand their realities and develop approaches that can create lasting value.',
  partner: 'Partner in this region',
  allRegions: 'Across Tanzania',
  allFocus: ['Nutrition', 'Food safety', 'Climate', 'Youth'],
} as const

// ---------------------------------------------------------------------------
// 11. Field notes
// ---------------------------------------------------------------------------

export const FIELD_NOTES = {
  eyebrow: 'FIELD NOTES',
  heading: [[accent('Useful ideas.'), plain(' Honest lessons.'), plain(' New perspectives.')]],
  description:
    'Explore the latest thoughts, field experiences, nutrition knowledge, research updates, and conversations from Lishe Lab.',
  read: 'Read more',
  limit: 3,
  fallbackNote: (filter: string) => `No ${filter.toLowerCase()} notes published yet â€” showing the latest.`,
} as const

// ---------------------------------------------------------------------------
// 12. Events
// ---------------------------------------------------------------------------

export const EVENTS = {
  eyebrow: 'COME BE PART OF THE WORK',
  heading: [[plain('Learn, connect, '), accent('and contribute.')]],
  description:
    'Join conversations, learning sessions, community activities, research discussions, and events that bring people together around nutrition, innovation, and healthier futures.',
  empty: 'No upcoming events yet. Check back soon for new opportunities to learn and connect.',
  emptyNote: 'In the meantime, the newsletter keeps you close to what we are learning.',
  details: 'Details',
  limit: 3,
} as const

// ---------------------------------------------------------------------------
// 13. Final call to action
// ---------------------------------------------------------------------------

export const FINAL_CTA = {
  eyebrow: 'BE PART OF THE WORK',
  heading: [[plain('Healthier futures '), accent('are built together.')]],
  description:
    'Whether you are a researcher, student, nutrition professional, community member, organization, innovator, or simply someone interested in better nutrition, there is a place for you at Lishe Lab.',
  primary: 'Partner with us',
  secondary: 'Start a conversation',
  note: 'Learn. Innovate. Connect. Impact.',
  ways: [
    { title: 'Partner with us', text: 'Build something useful together.' },
    { title: 'Join a program', text: 'Bring your voice to the work.' },
    { title: 'Volunteer', text: 'Share your time and skills.' },
    { title: 'Support our work', text: 'Help healthy ideas travel further.' },
  ],
} as const

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  logo: '/images/logo.jpeg',
  brandName: 'Lishe Lab',
  tagline:
    'Connecting nutrition, innovation, research, and communities for healthier lives.',
  email: 'hello@lishelab.org',
  phone: '+255 700 000 000',
  address: 'Arusha, Tanzania',
  socials: [
    { label: 'Instagram', url: 'https://instagram.com/' },
    { label: 'Facebook', url: 'https://facebook.com/' },
    { label: 'X', url: 'https://x.com/' },
    { label: 'LinkedIn', url: 'https://linkedin.com/' },
  ],
  manageLabel: 'Manage content',
  explore: ['About', 'Nutrition', 'Programs', 'Research'],
  connect: ['Partner with us', 'Volunteer', 'Join the newsletter'],
  copyright: 'Â© 2026 Lishe Lab. All rights reserved.',
  legal: 'Privacy â€¢ Terms',
} as const

export const SITE_SETTINGS = {
  logo: '/images/logo.jpeg',
  brandName: 'Lishe Lab',
  siteTitle: 'Lishe Lab | Nutrition, Innovation & Impact',
  tagline: 'Connecting nutrition, innovation, research, and communities for healthier lives.',
} as const

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export const NEWSLETTER = {
  eyebrow: 'STAY IN THE LOOP',
  heading: [[plain('Good ideas are better '), accent('together.')]],
  description:
    'Receive nutrition insights, research highlights, program updates and opportunities.',
  placeholder: 'Your email address',
  buttonLabel: 'Subscribe',
  success: "You're connected. Thank you for joining Lishe Lab.",
} as const

// ---------------------------------------------------------------------------
// Counts
// ---------------------------------------------------------------------------

export type HomeStat = {
  id: string
  value: number
  /** Rendered straight after the figure, e.g. the "+" in "35+". */
  suffix: string
  label: string
  source: 'database' | 'placeholder'
}

type StatDefinition = {
  id: string
  label: string
  placeholder: number
  placeholderSuffix?: string
  /** Reads the live figure out of the site content. Return 0 to use the placeholder. */
  dbValue: (content: SiteContent) => number
}

const toStats = (definitions: StatDefinition[], content: SiteContent): HomeStat[] =>
  definitions.map(({ placeholder, placeholderSuffix = '', dbValue, ...rest }) => {
    const live = dbValue(content)
    const fromDatabase = live > 0
    return {
      ...rest,
      value: fromDatabase ? live : placeholder,
      suffix: fromDatabase ? '' : placeholderSuffix,
      source: fromDatabase ? 'database' : 'placeholder',
    }
  })

const REACH_DEFINITIONS: StatDefinition[] = [
  { id: 'programs', label: 'Active programs', placeholder: 12, placeholderSuffix: '+', dbValue: (c) => c.programs.length },
  { id: 'regions', label: 'Regions reached', placeholder: 8, dbValue: (c) => c.locations.length },
  {
    id: 'initiatives',
    label: 'Community initiatives',
    placeholder: 35,
    placeholderSuffix: '+',
    dbValue: (c) => c.programs.length + c.stories.length,
  },
  {
    id: 'resources',
    label: 'Stories, resources & insights',
    placeholder: 100,
    placeholderSuffix: '+',
    dbValue: (c) => c.stories.length + c.insights.length + c.nutrition.length,
  },
]

const RESEARCH_DEFINITIONS: StatDefinition[] = [
  { id: 'research-projects', label: 'Research projects', placeholder: 24, dbValue: (c) => c.insights.length },
  { id: 'community-studies', label: 'Community studies', placeholder: 12, dbValue: (c) => c.stories.length },
  { id: 'nutrition-insights', label: 'Nutrition insights', placeholder: 40, dbValue: (c) => c.nutrition.length },
  { id: 'open-resources', label: 'Open resources', placeholder: 30, dbValue: (c) => c.programs.length },
]

export function resolveReach(content: SiteContent): HomeStat[] {
  return toStats(REACH_DEFINITIONS, content)
}

export function resolveResearchMetrics(content: SiteContent): HomeStat[] {
  return toStats(RESEARCH_DEFINITIONS, content)
}

// ---------------------------------------------------------------------------
// Nutrition tips
// ---------------------------------------------------------------------------

export type HomeTip = { id: string; tag: string; title: string; text: string }

const EDITORIAL_TIPS: HomeTip[] = [
  {
    id: 'tip-colour',
    tag: 'VARIETY',
    title: 'Add more colour to your plate.',
    text: 'Different fruits and vegetables provide different nutrients. Try including a variety of colours in your meals to make your plate more diverse and nourishing.',
  },
  {
    id: 'tip-whole',
    tag: 'WHOLE FOODS',
    title: 'Choose whole foods more often.',
    text: 'Whole grains, beans, nuts and seeds keep more of their natural fibre and nutrients than their refined versions, which helps meals stay satisfying for longer.',
  },
  {
    id: 'tip-hydration',
    tag: 'HYDRATION',
    title: 'Stay hydrated throughout the day.',
    text: 'Regular water breaks support energy, digestion and concentration. Carry a bottle you actually like and refill it before you feel thirsty.',
  },
  {
    id: 'tip-variety',
    tag: 'MEAL PLANNING',
    title: 'Make variety part of your meals.',
    text: 'Rotating a few staple foods keeps meals interesting and spreads nutrient intake across the week instead of loading it all onto one dish.',
  },
]

export function resolveTips(content: SiteContent): HomeTip[] {
  const fromDatabase = content.nutrition
    .filter((entry) => entry.title && entry.text)
    .map<HomeTip>((entry, index) => ({
      id: keyOf('tip-db', entry.id, index),
      tag: (entry.tab_name || 'GUIDANCE').toUpperCase(),
      title: entry.title,
      text: entry.text,
    }))

  const seen = new Set<string>()
  return [...fromDatabase, ...EDITORIAL_TIPS].filter((tip) => {
    const key = tip.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

export type HomeProgram = {
  id: string
  number: string
  category: string
  title: string
  text: string
  image: string
  details: string[]
}

const EDITORIAL_PROGRAMS: HomeProgram[] = [
  {
    id: 'program-youth',
    number: '01',
    category: 'COMMUNITY',
    title: 'Youth Nutrition Champions',
    text: 'Empowering young people to become nutrition advocates in their communities.',
    image: '/images/iringa.jpg',
    details: ['Youth leadership training', 'Community outreach', 'Peer-to-peer nutrition education'],
  },
  {
    id: 'program-traditional',
    number: '02',
    category: 'EDUCATION',
    title: 'Traditional Food Revival',
    text: 'Documenting and promoting nutrient-rich traditional foods and preparation methods.',
    image: '/images/mbeya.jpg',
    details: ['Recipe documentation', 'Nutrient analysis', 'Community cooking sessions'],
  },
  {
    id: 'program-schools',
    number: '03',
    category: 'EDUCATION',
    title: 'Nutrition Education in Schools',
    text: 'Teaching children about balanced diets through interactive workshops and school gardens.',
    image: '/images/mwanza.jpg',
    details: ['Interactive workshops', 'School gardens', 'Teacher and parent sessions'],
  },
  {
    id: 'program-champions',
    number: '04',
    category: 'FLAGSHIP PROGRAMS',
    title: 'Nutrition Champions Initiative',
    text: 'A community-driven program that identifies and trains local champions — farmers, teachers, health workers and youth leaders — to deliver peer-to-peer nutrition education, promote healthy diets, and model safe food practices within households, schools and communities.',
    image: '/images/GajIw.jpg',
    details: ['Champion training', 'Peer-to-peer education', 'Healthy diet promotion', 'Safe food practices'],
  },
]

export function resolvePrograms(content: SiteContent, limit: number): HomeProgram[] {
  const fromDatabase = content.programs
    .filter((program) => program.title && program.text)
    .map<HomeProgram>((program: Program, index) => ({
      id: keyOf('program', program.id, index),
      number: pad(index + 1),
      category: (program.category || 'PROGRAM').toUpperCase(),
      title: program.title,
      text: program.text,
      image: program.image_url || HERO.imageFallback,
      details: program.details,
    }))

  return withFallbacks(fromDatabase, EDITORIAL_PROGRAMS, limit)
}

// ---------------------------------------------------------------------------
// Impact stories
// ---------------------------------------------------------------------------

export type HomeStory = {
  id: string
  category: string
  title: string
  text: string
  stat: string
  image: string
}

const EDITORIAL_STORIES: HomeStory[] = [
  {
    id: 'story-garden',
    category: 'COMMUNITY',
    title: 'A kitchen garden that changed a familyâ€™s table',
    text: 'What began as a small training session in Mbeya is now a thriving kitchen garden feeding a household of six, with surplus sold at the local market.',
    stat: '12 varieties grown',
    image: '/images/mbeya.jpg',
  },
  {
    id: 'story-lake',
    category: 'FOOD SYSTEMS',
    title: 'Safer fish, cleaner drying, stronger incomes',
    text: 'Raised drying racks and solar dryers introduced with Lake Victoria fishing families cut post-harvest losses and improved food safety across the landing sites.',
    stat: '300+ families reached',
    image: '/images/mwanza.jpg',
  },
  {
    id: 'story-youth',
    category: 'YOUTH',
    title: 'Students running their own nutrition club',
    text: 'A group of secondary school students in Iringa turned one workshop into weekly cooking demonstrations, a school garden and a model for neighbouring schools.',
    stat: '50 youth champions',
    image: '/images/iringa.jpg',
  },
]

export function resolveStories(content: SiteContent, limit: number): HomeStory[] {
  const fromDatabase = content.stories
    .filter((story) => story.title && story.text)
    .map<HomeStory>((story, index) => ({
      id: keyOf('story', story.id, index),
      category: (story.location || 'IMPACT').toUpperCase(),
      title: story.title,
      text: story.text,
      stat: story.stat,
      image: story.image_url || HERO.imageFallback,
    }))

  return withFallbacks(fromDatabase, EDITORIAL_STORIES, limit)
}

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------

export type HomeRegion = {
  id: string
  name: string
  focus: string[]
  initiatives: number
  description: string
  image: string
  top: string
  left: string
  lat?: number | null
  lng?: number | null
}

const EDITORIAL_REGIONS: HomeRegion[] = [
  {
    id: 'region-mbeya-alt',
    name: 'Mbeya',
    focus: ['Traditional foods', 'Market access', 'Research'],
    initiatives: 6,
    description: 'Documenting traditional foods and connecting smallholder vendors to better markets.',
    image: '/images/mbeya.jpg',
    top: '45%',
    left: '35%',
  },
  {
    id: 'region-mwanza',
    name: 'Mwanza',
    focus: ['Food safety', 'Fisheries', 'Post-harvest handling'],
    initiatives: 12,
    description: 'Working with fishing families on safer drying, storage and market access.',
    image: '/images/mwanza.jpg',
    top: '20%',
    left: '15%',
  },
  {
    id: 'region-iringa',
    name: 'Iringa',
    focus: ['Climate-smart agriculture', 'Youth engagement'],
    initiatives: 8,
    description: 'Young farmers testing resilient crops and leading nutrition clubs in their schools.',
    image: '/images/iringa.jpg',
    top: '55%',
    left: '50%',
  },
  {
    id: 'region-mbeya',
    name: 'Mbeya',
    focus: ['Traditional foods', 'Market access', 'Research'],
    initiatives: 6,
    description: 'Documenting traditional foods and connecting smallholder vendors to better markets.',
    image: '/images/mbeya.jpg',
    top: '70%',
    left: '60%',
  },
]

/** Pulls the first whole number out of a free-text reach line, e.g. "15 schools, 3,000+ students". */
function initiativesFrom(text: string, fallback: number) {
  const match = /\d[\d,.]*/.exec(text ?? '')
  if (!match) return fallback
  const parsed = Number.parseInt(match[0].replace(/[^\d]/g, ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const splitFocus = (focus: string) =>
  (focus ?? '')
    .split(/[â€¢,]/)
    .map((part) => part.trim())
    .filter(Boolean)

export function resolveRegions(content: SiteContent): HomeRegion[] {
  const fromDatabase = content.locations
    .filter((location) => location.name)
    .map<HomeRegion>((location, index) => ({
      id: keyOf('region', location.id, index),
      name: location.name,
      focus: splitFocus(location.focus),
      initiatives: initiativesFrom(location.reached, 0),
      description: location.reached || 'Active programs and partnerships in this region.',
      image: location.image_url || HERO.imageFallback,
      top: location.top_percent || '50%',
      left: location.left_percent || '50%',
      lat: location.lat ?? null,
      lng: location.lng ?? null,
    }))

  // Fewer than three mappable points looks sparse on the map, so pad with the
  // editorial regions until the silhouette carries enough weight.
  if (fromDatabase.length >= 3) return fromDatabase.slice(0, 6)
  return [...fromDatabase, ...EDITORIAL_REGIONS].slice(0, 6)
}

// ---------------------------------------------------------------------------
// Field notes
// ---------------------------------------------------------------------------

export const INSIGHT_FILTERS = ['ALL', 'NUTRITION', 'RESEARCH', 'FOOD SYSTEMS', 'COMMUNITY', 'INNOVATION'] as const
export type InsightFilter = (typeof INSIGHT_FILTERS)[number]

const FILTER_ALIASES: Record<string, string[]> = {
  NUTRITION: ['NUTRITION'],
  RESEARCH: ['RESEARCH'],
  'FOOD SYSTEMS': ['FOOD', 'FOOD SYSTEMS'],
  COMMUNITY: ['COMMUNITY'],
  INNOVATION: ['INNOVATION'],
}

export function matchesInsightFilter(filter: string, category: string) {
  const aliases = FILTER_ALIASES[filter.toUpperCase()]
  if (!aliases) return true
  const value = (category || '').toUpperCase()
  return aliases.some((alias) => value === alias || value.includes(alias))
}

export type HomeInsight = {
  id: string
  category: string
  title: string
  text: string
  date: string
  image: string
}

const EDITORIAL_NOTES: HomeInsight[] = [
  {
    id: 'note-colour',
    category: 'NUTRITION',
    title: 'Why food colour matters more than you think',
    text: 'The pigments that give fruits and vegetables their colour are protective compounds in their own right. A short guide to eating the rainbow.',
    date: 'FIELD NOTE',
    image: '/images/823MU.jpg',
  },
  {
    id: 'note-safety',
    category: 'RESEARCH',
    title: 'Building food safety from the ground up',
    text: 'Food safety does not begin in the kitchen. Simple interventions at production level change what reaches the table.',
    date: 'FIELD NOTE',
    image: '/images/7MvEf.jpg',
  },
  {
    id: 'note-food-systems',
    category: 'FOOD SYSTEMS',
    title: 'The hidden cost of food loss',
    text: 'A share of what Tanzania grows never reaches a plate. We look at where it goes, and which interventions pay back fastest.',
    date: 'FIELD NOTE',
    image: '/images/GajIw.jpg',
  },
]

export function resolveInsights(content: SiteContent, filter: string, limit: number) {
  const fromDatabase = content.insights.map<HomeInsight>((insight: Insight, index) => ({
    id: keyOf('note', insight.id, index),
    category: (insight.category || 'FIELD NOTE').toUpperCase(),
    title: insight.title,
    text: insight.text,
    date: insight.date,
    image: insight.image_url || HERO.imageFallback,
  }))

  const all = [...fromDatabase, ...EDITORIAL_NOTES].filter((note) => note.title && note.text)
  const matched = all.filter((note) => matchesInsightFilter(filter, note.category))

  // An unused filter must never leave the grid empty; fall back to the latest.
  return {
    notes: (matched.length > 0 ? matched : all).slice(0, limit),
    usedFallback: matched.length === 0,
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type HomeEvent = {
  id: string
  title: string
  date: string
  location: string
  text: string
  image: string
}

export function resolveEvents(content: SiteContent, limit: number): HomeEvent[] {
  return content.events
    .filter((event) => event.title)
    .slice(0, limit)
    .map((event, index) => ({
      id: keyOf('event', event.id, index),
      title: event.title,
      date: event.date,
      location: event.location,
      text: event.text,
      image: event.image_url || HERO.imageFallback,
    }))
}
