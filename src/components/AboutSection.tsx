export default function AboutSection() {
  return (
    <section id="about" className="relative z-10 px-6 py-24">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-3">About</p>
        <h2
          className="text-3xl md:text-4xl text-white mb-6"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          A small online cohort for senior &amp; mid-level leaders.
        </h2>
        <p className="text-white/70 leading-relaxed">
          The AI-First Leader is a five-week live cohort built on Claude Code — no coding
          required. Each session stacks on the last, so by the end you'll have shipped a real
          agent, grounded it in your own knowledge, and built an AI roadmap for your
          organisation.
        </p>
      </div>
    </section>
  )
}
