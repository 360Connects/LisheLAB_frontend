import { Fragment } from 'react'
import type { HeadingPart } from '../../homeContent'

type Props = {
  lines: readonly (readonly HeadingPart[])[]
  className?: string
  as?: 'h1' | 'h2' | 'h3'
  /** Milliseconds between consecutive lines. Set to 0 to reveal them together. */
  step?: number
  /** Delay in milliseconds before the first line. */
  start?: number
}

/**
 * Renders a heading line by line. Accented parts pick up the nutrition-yellow
 * highlighter from home.css, which keeps emphasis readable on both the cream
 * and deep-green sections.
 */
export function AccentHeading({ lines, className = '', as: Tag = 'h2', step = 90, start = 0 }: Props) {
  return (
    <Tag className={`home-heading ${className}`.trim()}>
      {lines.map((line, lineIndex) => {
        const delay = start + lineIndex * step
        return (
          <span
            className="home-line"
            key={lineIndex}
            style={delay ? { transitionDelay: `${delay}ms`, animationDelay: `${delay}ms` } : undefined}
          >
            {line.map((part, partIndex) =>
              part.accent ? <em key={partIndex}>{part.text}</em> : <Fragment key={partIndex}>{part.text}</Fragment>,
            )}
          </span>
        )
      })}
    </Tag>
  )
}
