const WEEKS = [
  {
    num: '01',
    theme: 'Mindset',
    title: 'Your first agent',
    blurb:
      'From prompting a chatbot to directing an agent. Automate one real recurring task — leave with it off your plate, zero code written.',
  },
  {
    num: '02',
    theme: 'Knowledge',
    title: 'Grounding',
    blurb:
      'Connect Claude to your own documents and give it persistent memory of how you work. Leave with an AI that knows your business.',
  },
  {
    num: '03',
    theme: 'Orchestration',
    title: 'Delegation',
    blurb:
      'Design a multi-step workflow or team of sub-agents that owns a recurring job end-to-end — a delegated AI workflow your team can run.',
  },
  {
    num: '04',
    theme: 'Strategy',
    title: 'Operating model',
    blurb:
      'Build your AI-First Opportunity Map and a prioritised 90-day roadmap — a defensible org-level AI plan.',
  },
  {
    num: '05',
    theme: 'Capstone',
    title: 'Ship & certify',
    blurb:
      'Finalise and defend your capstone agent in a live showcase. Leave with a live AI product you own, plus certification.',
  },
]

export default function ProgramSection() {
  return (
    <section id="program" className="relative z-10 px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-3">
          The five-week climb
        </p>
        <h2
          className="text-3xl md:text-4xl text-white mb-12 max-w-2xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Five weeks to go from AI user to AI leader — and drive AI transformation across your
          organisation.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {WEEKS.map((week) => (
            <div key={week.num} className="liquid-glass rounded-2xl p-6">
              <div className="text-white/40 text-sm font-mono mb-2">Week {week.num}</div>
              <div className="text-white/60 text-xs uppercase tracking-widest mb-1">
                {week.theme}
              </div>
              <h3 className="text-white text-xl mb-3">{week.title}</h3>
              <p className="text-white/70 text-sm leading-relaxed">{week.blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
