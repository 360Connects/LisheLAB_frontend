import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, Loader2, Mail } from 'lucide-react'
import { subscribeToNewsletter } from '../api'
import { NEWSLETTER } from '../homeContent'

type Props = {
  placeholder?: string
  buttonLabel?: string
  success?: string
}

export function NewsletterForm({
  placeholder = NEWSLETTER.placeholder,
  buttonLabel = NEWSLETTER.buttonLabel,
  success = NEWSLETTER.success,
}: Props) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email) return
    setState('loading')
    try {
      await subscribeToNewsletter(email)
      setState('done')
      setMessage(success)
      setEmail('')
    } catch (err) {
      setState('error')
      setMessage(err instanceof Error ? err.message : 'Subscription failed. Please try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="email-input">
        <Mail size={17} />
        <input
          type="email"
          name="email"
          placeholder={placeholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" aria-label={buttonLabel} disabled={state === 'loading'}>
          {state === 'loading' ? <Loader2 size={16} className="spin" /> : <ArrowUpRight size={18} />}
        </button>
      </div>
      {state === 'done' ? (
        <span className="success-message">
          <Check size={14} /> {message}
        </span>
      ) : null}
      {state === 'error' ? <span className="error-message">{message}</span> : null}
    </form>
  )
}
