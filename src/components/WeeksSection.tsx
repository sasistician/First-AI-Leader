const WEEK_LABELS = [
  { num: 0, title: 'Foundations' },
  { num: 1, title: 'Your first agent' },
  { num: 2, title: 'Grounding' },
  { num: 3, title: 'Delegation' },
  { num: 4, title: 'Operating model' },
  { num: 5, title: 'Ship & certify' },
]

// Decks available at /weeks/wN_english.html / /weeks/wN_mandarin.html.
// Add a week number to a list once that language's file exists in public/weeks/.
const AVAILABLE_ENGLISH = [0]
const AVAILABLE_MANDARIN: number[] = []

function DeckLink({ num, lang, available }: { num: number; lang: 'english' | 'mandarin'; available: boolean }) {
  const label = lang === 'english' ? 'English' : 'Mandarin'

  if (!available) {
    return <span className="text-white/30 cursor-not-allowed">{label}</span>
  }

  return (
    <a
      href={`/weeks/w${num}_${lang}.html`}
      target="_blank"
      rel="noreferrer"
      className="text-white/80 hover:text-white underline transition-colors"
    >
      {label}
    </a>
  )
}

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
            const enAvailable = AVAILABLE_ENGLISH.includes(num)
            const zhAvailable = AVAILABLE_MANDARIN.includes(num)
            const anyAvailable = enAvailable || zhAvailable

            return (
              <div
                key={num}
                className={`liquid-glass rounded-2xl p-6 ${anyAvailable ? '' : 'opacity-40'}`}
              >
                <div className="text-white/40 text-sm font-mono mb-2">Week {num}</div>
                <h3 className="text-white text-lg mb-1">{title}</h3>
                <p className="text-white/50 text-xs uppercase tracking-widest mb-3">
                  {anyAvailable ? 'View deck' : 'Coming soon'}
                </p>
                <div className="flex gap-3 text-sm">
                  <DeckLink num={num} lang="english" available={enAvailable} />
                  <span className="text-white/30">&amp;</span>
                  <DeckLink num={num} lang="mandarin" available={zhAvailable} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
