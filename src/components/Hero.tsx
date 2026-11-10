import { useEffect, useRef } from 'react'
import { ArrowRight, Mic } from 'lucide-react'
import { WORKSHOP } from '../lib/schedule'

const FADE_MS = 500
const HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4'

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function Hero({ onTalk }: { onTalk?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number | null>(null)
  const fadingOutRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const fadeTo = (target: number, duration: number, onDone?: () => void) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

      const start = video.style.opacity ? parseFloat(video.style.opacity) : 1
      const startTime = performance.now()

      const step = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        video.style.opacity = String(start + (target - start) * progress)

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          rafRef.current = null
          onDone?.()
        }
      }

      rafRef.current = requestAnimationFrame(step)
    }

    const handleLoadedData = () => {
      video.style.opacity = '0'
      video.play().catch(() => {})
      fadeTo(1, FADE_MS)
    }

    const handleTimeUpdate = () => {
      if (fadingOutRef.current) return
      const remaining = video.duration - video.currentTime
      if (remaining <= 0.55) {
        fadingOutRef.current = true
        fadeTo(0, FADE_MS)
      }
    }

    const handleEnded = () => {
      video.style.opacity = '0'
      window.setTimeout(() => {
        video.currentTime = 0
        video.play().catch(() => {})
        fadingOutRef.current = false
        fadeTo(1, FADE_MS)
      }, 100)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="relative flex-1 flex flex-col">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover translate-y-[17%]"
        src={HERO_VIDEO_URL}
        muted
        playsInline
        autoPlay
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[20%]">
        <button
          onClick={() => scrollToSection('upcoming')}
          className="liquid-glass rounded-full pl-4 pr-3 py-1.5 mb-6 flex items-center gap-2 text-white/90 text-xs sm:text-sm hover:bg-white/5 transition-colors"
        >
          <span className="text-white/60">Free workshop · {WORKSHOP.shortDate}</span>
          <span className="hidden sm:inline">How to build a bilingual voice agent</span>
          <ArrowRight size={14} />
        </button>
        <h1
          className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 tracking-tight whitespace-nowrap"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Built for the AI-first leader.
        </h1>

        <div className="max-w-xl w-full flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => scrollToSection('program')}
            className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors"
          >
            See the program
          </button>
          {onTalk && (
            <button
              onClick={onTalk}
              aria-haspopup="dialog"
              className="flex items-center gap-2 rounded-full pl-3 pr-6 py-2 bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white"><Mic size={14} /></span>
              Talk to AI
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
