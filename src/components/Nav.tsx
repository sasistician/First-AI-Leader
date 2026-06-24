import { Globe } from 'lucide-react'
import { Link } from 'react-router-dom'

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function Nav() {
  return (
    <nav className="relative z-20 pl-6 pr-6 py-6">
      <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-white font-semibold text-lg">
          <Globe size={24} />
          <span>The AI-First Leader</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection('program')}
            className="text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            Program
          </button>
          <button
            onClick={() => scrollToSection('weeks')}
            className="text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            Weeks
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            About
          </button>
          <button
            onClick={() => scrollToSection('instructor')}
            className="text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            Instructor
          </button>
        </div>

        <Link
          to="/register"
          className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors"
        >
          Register
        </Link>
      </div>
    </nav>
  )
}
