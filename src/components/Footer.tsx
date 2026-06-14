import { Code2, Mail, Globe } from 'lucide-react'

const SOCIALS = [
  { Icon: Code2, href: 'https://github.com/sasistician', label: 'GitHub' },
  { Icon: Mail, href: 'mailto:hello@example.com', label: 'Email' },
  { Icon: Globe, href: '/', label: 'Website' },
]

export default function Footer() {
  return (
    <footer className="relative z-10 flex justify-center gap-4 pb-12 pt-4">
      {SOCIALS.map(({ Icon, href, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"
        >
          <Icon size={20} />
        </a>
      ))}
    </footer>
  )
}
