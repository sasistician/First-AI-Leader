import Nav from '../components/Nav'
import Hero from '../components/Hero'
import ProgramSection from '../components/ProgramSection'
import WeeksSection from '../components/WeeksSection'
import AboutSection from '../components/AboutSection'
import WhySection from '../components/WhySection'
import TestimonialsSection from '../components/TestimonialsSection'
import InstructorSection from '../components/InstructorSection'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <Hero />
      <ProgramSection />
      <WeeksSection />
      <AboutSection />
      <WhySection />
      <TestimonialsSection />
      <InstructorSection />
      <Footer />
    </div>
  )
}
