import { useEffect, useState } from 'react'
import { Globe, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import VoiceAgent from '../components/VoiceAgent'
import Footer from '../components/Footer'

const serif = { fontFamily: "'Instrument Serif', serif" }

export default function Agentic() {
  // The embedded ad reports its content height, so the frame fits on any screen size.
  const [adHeight, setAdHeight] = useState<number | null>(null)
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'agentic-ad-height') return
      const h = Number(e.data.height)
      if (h > 300 && h < 4000) setAdHeight(h + 8)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="relative z-20 pl-6 pr-6 py-6">
        <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
          <Link to="/" className="flex items-center gap-2 text-white font-semibold text-lg">
            <Globe size={24} />
            <span>The AI-First Leader</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </nav>

      <main className="flex-1 px-6">
        <header className="max-w-5xl mx-auto pt-10 pb-14 text-white">
          <p className="text-white/50 text-xs uppercase tracking-[0.2em] mb-4">Agentic marketing · live demo</p>
          <h1 className="text-5xl md:text-6xl leading-[1.05] tracking-tight" style={serif}>
            An ad built for you. A guide that answers back.
          </h1>
          <p className="text-white/70 text-lg mt-6 max-w-3xl">
            Two agentic experiences built from the course itself. The ad assembles itself from parts that AI agents wrote and a
            compliance check approved. The voice guide answers questions about the course out loud, grounded in the course material.
          </p>
        </header>

        <section id="ad" className="max-w-6xl mx-auto text-white">
          <div className="max-w-5xl mx-auto mb-6">
            <h2 className="text-3xl md:text-4xl" style={serif}>1 · The personalized ad</h2>
            <p className="text-white/60 mt-2">Pick your role, goal and industry, then press Play. Switch between “Generic” and “Yours” to compare.</p>
          </div>
          <iframe
            src="/agentic-ad/index.html?embed=1"
            title="Personalized ad demo"
            allow="autoplay"
            className={`w-full rounded-3xl bg-black ${adHeight ? '' : 'h-[1900px] md:h-[1200px]'}`}
            style={adHeight ? { height: adHeight } : undefined}
          />
        </section>

        <section id="ask" className="max-w-5xl mx-auto py-20">
          <div className="text-white mb-6">
            <h2 className="text-3xl md:text-4xl" style={serif}>2 · Ask the course, out loud</h2>
            <p className="text-white/60 mt-2">
              Speak in English or 中文. Interrupt any time. Answers come only from the course material, with links to the slides they came from.
            </p>
          </div>
          <VoiceAgent />
        </section>
      </main>

      <Footer />
    </div>
  )
}
