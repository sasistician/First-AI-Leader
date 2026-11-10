import { ArrowRight, CalendarDays, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { COHORT, WORKSHOP } from '../lib/schedule'

export default function UpcomingSection() {
  return (
    <section id="upcoming" className="relative z-10 px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-3">Upcoming</p>
        <h2
          className="text-3xl md:text-4xl text-white mb-12 max-w-2xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Start with a free workshop, or join the next cohort.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="liquid-glass rounded-2xl p-8 lg:col-span-3 flex flex-col gap-5">
            <div className="text-white/50 text-sm font-mono">{WORKSHOP.format}</div>
            <h3 className="text-2xl md:text-3xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {WORKSHOP.title}
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/80 text-sm">
              <span className="flex items-center gap-2"><CalendarDays size={16} />{WORKSHOP.date}</span>
              <span className="flex items-center gap-2"><Clock size={16} />{WORKSHOP.time}</span>
            </div>
            <p className="text-white/70 leading-relaxed">{WORKSHOP.blurb}</p>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-3">What we’ll cover</p>
              <ol className="space-y-2 text-white/80 text-sm leading-relaxed list-decimal pl-5 marker:text-white/40">
                {WORKSHOP.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ol>
            </div>
            <Link
              to="/register?for=workshop"
              className="mt-auto self-start flex items-center gap-2 bg-white rounded-full px-6 py-3 text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Reserve a free seat <ArrowRight size={16} />
            </Link>
          </div>

          <div className="liquid-glass rounded-2xl p-8 lg:col-span-2 flex flex-col gap-5">
            <div className="text-white/50 text-sm font-mono">{COHORT.format}</div>
            <h3 className="text-2xl md:text-3xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {COHORT.title}
            </h3>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <CalendarDays size={16} />Starts {COHORT.date}
            </div>
            <p className="text-white/70 leading-relaxed">{COHORT.blurb}</p>
            <Link
              to="/register?for=cohort"
              className="mt-auto self-start liquid-glass flex items-center gap-2 rounded-full px-6 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors"
            >
              Register for January <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
