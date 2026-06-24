import { ArrowRight } from 'lucide-react'

const SHIFTS = [
  { before: 'You chat with AI', after: 'You direct AI' },
  { before: 'You prompt a chatbot', after: 'You delegate to a team of agents' },
  { before: 'You do the work', after: "You orchestrate — that's just management" },
]

export default function WhySection() {
  return (
    <section id="why" className="relative z-10 px-6 py-24">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-3">
          Why take this course
        </p>
        <h2
          className="text-3xl md:text-4xl text-white mb-6"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Reinvent yourself for the era of AI.
        </h2>
        <p className="text-white/70 leading-relaxed mb-12">
          Five weeks to stop chatting with AI and start directing it — across your own work and
          the teams you lead. Delegate whole jobs to a team of agents instead of prompting a
          chatbot one task at a time. Orchestration is just management.
        </p>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 gap-4">
        {SHIFTS.map((shift) => (
          <div
            key={shift.before}
            className="liquid-glass rounded-2xl p-6 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4"
          >
            <p className="text-white/50 text-center md:text-right">{shift.before}</p>
            <ArrowRight className="text-white/30 mx-auto rotate-90 md:rotate-0" size={20} />
            <p className="text-white text-center md:text-left">{shift.after}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
