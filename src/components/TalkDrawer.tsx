import { useEffect, useRef, useState } from 'react'
import { Mic, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import VoiceAgent from './VoiceAgent'

// The course voice guide as a side panel: slides in from the right over a dimmed, blurred page.
// Closing it (X, Esc, or clicking outside) unmounts the guide, which stops the mic and any speech.
export default function TalkDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const returnFocus = document.activeElement as HTMLElement | null
    const scroll = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus() // move focus into the dialog; Tab reaches its controls
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = scroll
      returnFocus?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="talk-title">
      <div className="talk-fade absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside ref={panelRef} tabIndex={-1} className="talk-slide outline-none absolute right-0 top-0 h-full w-full sm:w-[460px] flex flex-col text-white
                        bg-neutral-950/85 backdrop-blur-2xl border-l border-white/10 shadow-[-20px_0_60px_rgba(0,0,0,0.5)]">
        <header className="flex items-start justify-between gap-3 px-6 pt-6 pb-5 border-b border-white/10">
          <div>
            <p className="text-white/50 text-[11px] uppercase tracking-[0.18em]">Talk to AI</p>
            <h2 id="talk-title" className="text-3xl leading-tight mt-1" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Ask a question about the course
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="shrink-0 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <VoiceAgent compact />
        </div>
        <footer className="px-6 py-4 border-t border-white/10 text-xs text-white/45">
          Answers come only from the course material, with links to the slides.{' '}
          <Link to="/agentic" onClick={onClose} className="underline hover:text-white/80">See the full demo</Link>
        </footer>
      </aside>
    </div>
  )
}

// Appears in the bottom-right corner only after the hero has scrolled away, so it never
// covers the headline; the nav and hero buttons cover the top of the page.
export function FloatingTalkButton({ onTalk, hidden }: { onTalk: () => void; hidden: boolean }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!show || hidden) return null
  return (
    <button
      onClick={onTalk}
      aria-haspopup="dialog"
      className="talk-fade fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full pl-2 pr-4 py-2 text-sm font-medium text-white
                 bg-black/50 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:bg-white/10 transition-colors"
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black"><Mic size={16} /></span>
      Talk to AI
    </button>
  )
}
