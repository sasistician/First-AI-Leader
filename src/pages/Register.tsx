import { useState } from 'react'
import { Globe, ArrowLeft } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { COHORT, INTERESTS, WORKSHOP, type Interest } from '../lib/schedule'

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwvjabzb'

const SUBJECTS: Record<Interest, string> = {
  workshop: 'Workshop registration',
  cohort: 'January cohort registration',
  both: 'Workshop + January cohort registration',
}

const THANKS: Record<Interest, string> = {
  workshop: `Thanks, your seat is reserved. You'll get a Google Calendar invite with the Google Meet link before ${WORKSHOP.date}.`,
  cohort: `Thanks, we'll be in touch about the cohort starting ${COHORT.date}.`,
  both: `Thanks, your workshop seat is reserved: a Google Calendar invite with the Meet link is on its way. We'll also be in touch about the cohort starting ${COHORT.date}.`,
}

export default function Register() {
  const [params] = useSearchParams()
  const preset = params.get('for')
  const [interest, setInterest] = useState<Interest>(preset === 'cohort' || preset === 'both' ? preset : 'workshop')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(e.target as HTMLFormElement),
      })

      if (!response.ok) throw new Error('Submission failed')
      setSubmitted(true)
    } catch {
      setError('Something went wrong submitting your details. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="relative z-20 pl-6 pr-6 py-6">
        <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
          <Link to="/" className="flex items-center gap-2 text-white font-semibold text-lg">
            <Globe size={24} />
            <span>The AI-First Leader</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back home
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <h1
          className="text-4xl md:text-5xl text-white mb-8 tracking-tight"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Register
        </h1>

        {submitted ? (
          <div className="liquid-glass rounded-2xl px-8 py-10 max-w-md w-full">
            <p className="text-white text-lg">
              {THANKS[interest]}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="liquid-glass rounded-2xl px-8 py-8 max-w-md w-full text-left space-y-4"
          >
            <fieldset>
              <legend className="block text-white/70 text-sm mb-2">I'm registering for</legend>
              <div className="space-y-2">
                {INTERESTS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 text-white text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="interest"
                      value={option.value}
                      checked={interest === option.value}
                      onChange={() => setInterest(option.value)}
                      className="accent-white"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <input type="hidden" name="_subject" value={SUBJECTS[interest]} />
            </fieldset>

            <div>
              <label className="block text-white/70 text-sm mb-1" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-1" htmlFor="message">
                Message (optional)
              </label>
              <textarea
                id="message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Anything you'd like us to know?"
                rows={3}
                className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 outline-none focus:border-white/40 resize-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-white rounded-full px-6 py-3 text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
