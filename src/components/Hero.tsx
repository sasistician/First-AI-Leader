import { useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'

const FADE_MS = 500
const HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4'

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function Hero() {
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
        <h1
          className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 tracking-tight whitespace-nowrap"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Built for the AI-first leader.
        </h1>

        <div className="max-w-xl w-full space-y-4">
          <form
            className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-transparent outline-none text-white placeholder:text-white/40 text-base"
            />
            <button
              type="submit"
              aria-label="Submit email"
              className="bg-white rounded-full p-3 text-black"
            >
              <ArrowRight size={20} />
            </button>
          </form>

          <p className="text-white text-sm leading-relaxed px-4">
            Stay updated with the latest news and insights. Subscribe to our newsletter today
            and never miss out on exciting updates.
          </p>

          <button
            onClick={() => scrollToSection('program')}
            className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors"
          >
            See the program
          </button>
        </div>
      </div>
    </div>
  )
}
