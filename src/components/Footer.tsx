import { Code2, Mail } from 'lucide-react'

function LinkedinIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  )
}

const SOCIALS = [
  { Icon: Code2, href: 'https://github.com/sasistician', label: 'GitHub' },
  { Icon: Mail, href: 'mailto:bilalf@gmail.com', label: 'Email' },
  { Icon: LinkedinIcon, href: 'https://www.linkedin.com/in/sasistician/', label: 'LinkedIn' },
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
