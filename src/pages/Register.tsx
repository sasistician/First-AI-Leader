import { useState } from 'react'
import { Globe, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
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
    setSubmitted(true)
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
          Register your interest
        </h1>

        {submitted ? (
          <div className="liquid-glass rounded-2xl px-8 py-10 max-w-md w-full">
            <p className="text-white text-lg">
              Thanks — we'll be in touch about the next cohort.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="liquid-glass rounded-2xl px-8 py-8 max-w-md w-full text-left space-y-4"
          >
            <div>
              <label className="block text-white/70 text-sm mb-1" htmlFor="name">
                Name
              </label>
              <input
                id="name"
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
              className="w-full bg-white rounded-full px-6 py-3 text-black font-medium hover:bg-white/90 transition-colors"
            >
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
