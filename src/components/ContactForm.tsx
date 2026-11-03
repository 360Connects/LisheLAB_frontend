import { useState, type FormEvent } from 'react'
import { Check, Loader2, Send } from 'lucide-react'
import { sendMessage } from '../api'

const topics = ['General', 'Partnership', 'Volunteer', 'Research collaboration', 'Media']

export function ContactForm() {
  const [values, setValues] = useState({ name: '', email: '', topic: topics[0], message: '' })
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')

  const update = (key: keyof typeof values) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [key]: event.target.value }))
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setState('loading')
    setFeedback('')
    try {
      const result = await sendMessage(values)
      setState('done')
      setFeedback(
        result.emailNotificationSent
          ? 'Thank you. Your message is with the team and we will reply shortly.'
          : 'Your message was saved, but we could not send the inbox notification. The team can still see it on the website.',
      )
      setValues({ name: '', email: '', topic: topics[0], message: '' })
    } catch (err) {
      setState('error')
      setFeedback(err instanceof Error ? err.message : 'We could not send your message. Please try again.')
    }
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="contact-form__row">
        <label>
          <span>Your name</span>
          <input name="name" value={values.name} onChange={update('name')} required placeholder="Amina Said" />
        </label>
        <label>
          <span>Email address</span>
          <input name="email" type="email" value={values.email} onChange={update('email')} required placeholder="you@example.com" />
        </label>
      </div>
      <label>
        <span>What is this about?</span>
        <select name="topic" value={values.topic} onChange={update('topic')}>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Your message</span>
        <textarea
          name="message"
          rows={4}
          value={values.message}
          onChange={update('message')}
          required
          placeholder="Tell us what you would like to explore together."
        />
      </label>
      <button className="button button--green" type="submit" disabled={state === 'loading'}>
        {state === 'loading' ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Send message
      </button>
      {state === 'done' ? (
        <span className="success-message">
          <Check size={14} /> {feedback}
        </span>
      ) : null}
      {state === 'error' ? <span className="error-message">{feedback}</span> : null}
    </form>
  )
}
