const WEEK_LABELS = [
  { num: 0, title: 'Foundations' },
  { num: 1, title: 'Your first agent' },
  { num: 2, title: 'Grounding' },
  { num: 3, title: 'Delegation' },
  { num: 4, title: 'Operating model' },
  { num: 5, title: 'Ship & certify' },
]

// Weeks with a deck available at /weeks/wN.html. Add the number here once that
// file exists in public/weeks/.
const AVAILABLE_WEEKS = [0]

export default function WeeksSection() {
  return (
    <section id="weeks" className="relative z-10 px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-3">Session decks</p>
        <h2
          className="text-3xl md:text-4xl text-white mb-12 max-w-2xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Browse each week's slides.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {WEEK_LABELS.map(({ num, title }) => {
            const available = AVAILABLE_WEEKS.includes(num)
            const card = (
              <div
                className={`liquid-glass rounded-2xl p-6 transition-colors ${
                  available ? 'hover:bg-white/5 cursor-pointer' : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="text-white/40 text-sm font-mono mb-2">Week {num}</div>
                <h3 className="text-white text-lg mb-1">{title}</h3>
                <p className="text-white/50 text-xs uppercase tracking-widest">
                  {available ? 'View deck' : 'Coming soon'}
                </p>
              </div>
            )

            return available ? (
              <a key={num} href={`/weeks/w${num}.html`} target="_blank" rel="noreferrer">
                {card}
              </a>
            ) : (
              <div key={num}>{card}</div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
