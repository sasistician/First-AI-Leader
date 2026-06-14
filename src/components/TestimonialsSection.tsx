const TESTIMONIALS = [
  {
    name: 'Milica',
    role: 'Senior Director, Global Head of Data & Analytics',
    rating: 10,
    quote:
      'This was an excellent, truly production-ready agent course. The instructor was down-to-earth, incredibly experienced, and wonderfully patient — with a great sense of humour that made even the complex parts enjoyable. The course was exceptionally well-researched, delivered with real depth of knowledge, and packed with practical, immediately useful materials. Highly recommended for anyone wanting to build RAGs with confidence.',
  },
  {
    name: 'Simon',
    role: 'Head of Data Platforms and Engineering',
    rating: 9,
    quote:
      'Higly recommend this course. Bilal is very knowledgeable and explains the concepts clearly. I learnt a lot about GenAI and n8n from doing this course.',
  },
  {
    name: 'Suretha',
    role: 'Data Scientist',
    rating: 10,
    quote:
      'Throughout the course, I gained valuable insights into the evolving Agentic AI space. I had the opportunity to explore and work with emerging tools and frameworks such as n8n, LangGraph, Supabase, and Lovable for building agentic systems. The cohort was highly practical and interactive, which made it easier to apply concepts and develop the project progressively throughout the program.',
  },
  {
    name: 'Sophy',
    role: 'Assistant Manager, Fine Accounting',
    rating: 10,
    quote:
      'Creating production ready agents was a great course, the instructor led the class from a basic level and within a few hours we were building agents. We covered all the technical aspects of building agents and learned in detail about Gen AI / LLM. I personally build a financial market update agent — which helped me to reduce my time to search through all financial markets information. I highly recommend this course.',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="relative z-10 px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-3">
          From previous cohorts · four voices
        </p>
        <h2
          className="text-3xl md:text-4xl text-white mb-12 max-w-2xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Students from previous cohorts say about the course.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="liquid-glass rounded-2xl p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-widest">{t.role}</p>
                  <p className="text-white text-xl font-semibold mt-1">{t.name}</p>
                </div>
                <div className="text-white/30 text-4xl font-bold flex-shrink-0 ml-4">
                  {t.rating}
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">{t.quote}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
