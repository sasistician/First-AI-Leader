import { useEffect, useState } from 'react'
import { Mic, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import VoiceAgent from './VoiceAgent'

// Floating "Talk to AI" button (top right) that opens the course voice guide in a glass overlay.
// Closing the overlay unmounts the guide, which stops the microphone and any speech.
export default function AskAIWidget() {
  // sasistician.com/?talk=1 opens the guide straight away (handy for sharing).
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).get('talk') === '1')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-24 right-4 md:right-6 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-white text-sm font-medium
                     bg-black/40 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:bg-white/10 transition-colors"
          aria-haspopup="dialog"
        >
          <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white text-black">
            <Mic size={15} />
            <span className="absolute inset-0 rounded-full border border-white/70 animate-ping opacity-40" />
          </span>
          Talk to AI
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Ask the course voice guide"
          className="fixed z-50 inset-x-3 top-20 md:inset-x-auto md:right-6 md:top-24 md:w-[440px] max-h-[calc(100vh-6rem)] overflow-y-auto
                     rounded-3xl p-5 text-white bg-black/55 backdrop-blur-2xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-white/50 text-[11px] uppercase tracking-[0.18em]">Talk to AI</p>
              <p className="text-2xl leading-tight mt-1" style={{ fontFamily: "'Instrument Serif', serif" }}>Ask a question about the course</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="shrink-0 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
          <VoiceAgent compact />
          <p className="mt-4 text-xs text-white/40">
            Answers come only from the course material. <Link to="/agentic" className="underline hover:text-white/70">See the full demo</Link>
          </p>
        </div>
      )}
    </>
  )
}
