const BULLETS = [
  "I am a seasoned AI professional with over 20 years of experience in leading telco, banking, retail, and consulting organizations across Australia, New Zealand, Malaysia, UAE, USA, and Pakistan.",
  "I have a proven track record of building and nurturing high-performing data science teams. I also serve as an advisor for Gen AI / Agentic AI for a San Francisco-based startup.",
  "My passion for data science extends to education, where I have designed data science programs for students from grade 6 to PhD levels and am experienced in teaching Data Science, Gen AI, and Agentic AI courses.",
  "Beyond my professional life, I am a storyteller, a foodie, love traveling, and am always up for a basketball, table tennis or badminton game.",
]

export default function InstructorSection() {
  return (
    <section id="instructor" className="relative z-10 px-6 py-24">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-3">
          Meet Your Instructor
        </p>

        <div className="liquid-glass w-24 h-24 rounded-full mx-auto mb-6">
          <img
            src="/images/bilal-farooq.jpg"
            alt="Bilal Farooq"
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        <h2 className="text-3xl md:text-4xl text-white mb-8" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Bilal Farooq
        </h2>

        <ul className="text-left space-y-4">
          {BULLETS.map((bullet) => (
            <li key={bullet} className="flex gap-3 text-white/70 leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
