import { useCallback, useState } from 'react'
import Nav from '../components/Nav'
import Hero from '../components/Hero'
import ProgramSection from '../components/ProgramSection'
import WeeksSection from '../components/WeeksSection'
import AboutSection from '../components/AboutSection'
import WhySection from '../components/WhySection'
import TestimonialsSection from '../components/TestimonialsSection'
import InstructorSection from '../components/InstructorSection'
import Footer from '../components/Footer'
import TalkDrawer, { FloatingTalkButton } from '../components/TalkDrawer'

export default function Home() {
  // sasistician.com/?talk=1 opens the voice guide straight away (handy for sharing).
  const [talkOpen, setTalkOpen] = useState(() => new URLSearchParams(window.location.search).get('talk') === '1')
  const openTalk = useCallback(() => setTalkOpen(true), [])
  const closeTalk = useCallback(() => setTalkOpen(false), [])

  return (
    <div className="min-h-screen flex flex-col">
      <Nav onTalk={openTalk} />
      <Hero onTalk={openTalk} />
      <ProgramSection />
      <WeeksSection />
      <AboutSection />
      <WhySection />
      <TestimonialsSection />
      <InstructorSection />
      <Footer />
      <FloatingTalkButton onTalk={openTalk} hidden={talkOpen} />
      <TalkDrawer open={talkOpen} onClose={closeTalk} />
    </div>
  )
}
