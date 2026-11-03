import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Menu,
  Moon,
  PencilRuler,
  Sun,
  X,
} from 'lucide-react'
import '../App.css'
import '../reference.css'
import '../hero-full.css'
import '../home.css'
import { useSiteContent } from '../useSiteContent'
import { useActiveSection, useReveal, useScrolled, useTheme } from '../hooks'
import { ContactForm } from '../components/ContactForm'
import { NewsletterForm } from '../components/NewsletterForm'
import { EmptyState } from '../components/StatusBar'
import { HomeSections } from '../components/home/HomeSections'
import {
  FOOTER,
  NEWSLETTER,
  SITE_SETTINGS,
  mergeSection,
  resolveHeading,
  resolveSocialLinks,
  resolveStrings,
  resolveText,
} from '../homeContent'
import type { HomeDetail } from '../homeContent'

type ModalItem = HomeDetail

const EXPLORE_TARGETS = ['about', 'nutrition', 'programs', 'research'] as const
const CONNECT_TARGETS = ['contact', 'contact', 'newsletter'] as const

export function HomePage() {
  // `status`, `error`, `lastUpdated` and `refresh` are intentionally unused: the
  // status bar that surfaced them was removed, and every section now degrades to
  // its own editorial content when the API is unavailable. Content still refreshes
  // on the 60s poll and immediately after an admin edit.
  const { content } = useSiteContent(60000)
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<ModalItem | null>(null)

  const scrolled = useScrolled()
  const { theme, toggle: toggleTheme } = useTheme()
  useReveal()

  const navItems = useMemo(
    () => [
      ['home', 'Home'],
      ['about', 'About'],
      ['nutrition', 'Nutrition'],
      ['programs', 'Programs'],
      ['research', 'Research'],
      ['impact', 'Impact'],
      ['insights', 'Insights'],
      ['contact', 'Contact'],
    ] as const,
    [],
  )
  const navIds = useMemo(() => navItems.map(([id]) => id), [navItems])
  const active = useActiveSection(navIds as unknown as string[])

  const { faq } = content

  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const siteSettings = useMemo(
    () => mergeSection(SITE_SETTINGS as unknown as Record<string, unknown>, content.homepage.site_settings),
    [content.homepage],
  )

  const footerData = useMemo(
    () => mergeSection(FOOTER as unknown as Record<string, unknown>, content.homepage.footer),
    [content.homepage],
  )

  const newsletterData = useMemo(
    () => mergeSection(NEWSLETTER as unknown as Record<string, unknown>, content.homepage.newsletter),
    [content.homepage],
  )

  const siteTitle = resolveText(siteSettings.siteTitle, SITE_SETTINGS.siteTitle)
  const footerLogo = resolveText(siteSettings.logo ?? footerData.logo, FOOTER.logo)
  const footerBrand = resolveText(siteSettings.brandName ?? footerData.brandName, FOOTER.brandName)
  const footerSocials = useMemo(
    () => resolveSocialLinks(footerData.socials, FOOTER.socials),
    [footerData],
  )
  const footerExplore = useMemo(
    () => resolveStrings(footerData.explore, FOOTER.explore),
    [footerData],
  )
  const footerConnect = useMemo(
    () => resolveStrings(footerData.connect, FOOTER.connect),
    [footerData],
  )

  useEffect(() => {
    document.title = siteTitle
  }, [siteTitle])

  const go = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }, [])

  const openDetail = useCallback((detail: HomeDetail) => setModal(detail), [])

  return (
    <div className="site-shell">
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <button className="brand" onClick={() => go('home')} aria-label={footerBrand}>
          <img className="brand-logo" src={footerLogo} alt={footerBrand} />
        </button>
        <nav className={menuOpen ? 'nav-links nav-links--open' : 'nav-links'}>
          {navItems.map(([id, label]) => (
            <button key={id} className={active === id ? 'active' : ''} onClick={() => go(id)}>
              {label}
            </button>
          ))}
        </nav>
        <button className="button button--small nav-cta" onClick={() => go('contact')}>
          Get involved <ArrowUpRight size={15} />
        </button>
        <button className="icon-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="menu-toggle" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main className="home-page">
        <HomeSections content={content} go={go} openDetail={openDetail} />

        <section id="contact" className="section contact-section reveal">
          <div className="section-heading">
            <div>
              <span className="section-kicker">SEND A MESSAGE</span>
              <h2>
                Let&rsquo;s <em>talk.</em>
              </h2>
            </div>
            <p>Every message reaches the Lishe Lab team and lands in our inbox.</p>
          </div>
          <ContactForm />
        </section>

        <section className="section faq-section reveal">
          <div className="section-heading">
            <div>
              <span className="section-kicker">QUESTIONS, ANSWERED</span>
              <h2>
                Curious? <em>Good.</em>
              </h2>
            </div>
            <p>A few things people often want to know about Lishe Lab.</p>
          </div>
          <div className="faq-list">
            {faq.length === 0 ? <EmptyState message="Questions will appear here soon." /> : null}
            {faq.map((item, index) => (
              <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={item.id}>
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  <span>0{index + 1}</span>
                  {item.question}
                  {openFaq === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div className={`faq-answer ${openFaq === index ? 'open' : ''}`}>
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="newsletter" className="newsletter-section reveal">
          <div>
            <span className="section-kicker">
              {resolveText(newsletterData.eyebrow, NEWSLETTER.eyebrow)}
            </span>
            <h2>
              {resolveHeading(newsletterData.heading, NEWSLETTER.heading).map(
                (line, lineIndex) => (
                  <Fragment key={lineIndex}>
                    {lineIndex > 0 ? ' ' : null}
                    {line.map((part, index) =>
                      part.accent ? (
                        <em key={index}>{part.text}</em>
                      ) : (
                        <Fragment key={index}>{part.text}</Fragment>
                      ),
                    )}
                  </Fragment>
                ),
              )}
            </h2>
            <p>
              {resolveText(newsletterData.description, NEWSLETTER.description)}
            </p>
          </div>
          <NewsletterForm
            placeholder={resolveText(newsletterData.placeholder, NEWSLETTER.placeholder)}
            buttonLabel={resolveText(newsletterData.buttonLabel, NEWSLETTER.buttonLabel)}
            success={resolveText(newsletterData.success, NEWSLETTER.success)}
          />
        </section>
      </main>

      <footer className="footer">
        <div className="footer-main">
          <button className="brand brand--footer" onClick={() => go('home')} aria-label={footerBrand}>
            <img className="brand-logo" src={footerLogo} alt={footerBrand} />
          </button>
          <p>{resolveText(footerData.tagline, FOOTER.tagline)}</p>
          <div className="socials">
            {footerSocials.map((social) => (
              <a
                key={`${social.label}-${social.url}`}
                href={social.url || '#contact'}
                target={social.url.startsWith('http') ? '_blank' : undefined}
                rel={social.url.startsWith('http') ? 'noreferrer' : undefined}
                aria-label={social.label}
              >
                {social.label}
              </a>
            ))}
          </div>
          <Link className="admin-launch" to="/admin">
            <PencilRuler size={14} /> {resolveText(footerData.manageLabel, FOOTER.manageLabel)}
          </Link>
        </div>
        <div className="footer-links">
          <div>
            <b>EXPLORE</b>
            {footerExplore.map((label, index) => (
              <button key={label} onClick={() => go(EXPLORE_TARGETS[index] ?? 'contact')}>
                {label}
              </button>
            ))}
          </div>
          <div>
            <b>CONNECT</b>
            {footerConnect.map((label, index) => (
              <button key={label} onClick={() => go(CONNECT_TARGETS[index] ?? 'contact')}>
                {label}
              </button>
            ))}
          </div>
          <div>
            <b>CONTACT</b>
            <span>{resolveText(footerData.email, FOOTER.email)}</span>
            <span>{resolveText(footerData.phone, FOOTER.phone)}</span>
            <span>{resolveText(footerData.address, FOOTER.address)}</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{resolveText(footerData.copyright, FOOTER.copyright)}</span>
          <span>{resolveText(footerData.legal, FOOTER.legal)}</span>
        </div>
      </footer>

      <button className="back-top" aria-label="Back to top" onClick={() => go('home')}>
        <ChevronUp size={18} />
      </button>

      {modal ? (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close dialog">
              <X />
            </button>
            <img src={modal.image} alt="" />
            <div className="modal-content">
              <span className="tag">{modal.category}</span>
              <h2>{modal.title}</h2>
              <p>{modal.text}</p>
              <div className="modal-details">
                {modal.details.map((detail) => (
                  <span key={detail}>
                    <Check size={15} /> {detail}
                  </span>
                ))}
              </div>
              <button
                className="button button--green"
                onClick={() => {
                  setModal(null)
                  go('contact')
                }}
              >
                Connect with us <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default HomePage
