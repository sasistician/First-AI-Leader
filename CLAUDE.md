# The AI-First Leader — Website

Marketing site + registration page for "The AI-First Leader," a 5-week online cohort.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS 3 (default config)
- lucide-react for icons
- react-router-dom for routing

## Commands

```
npm install
npm run dev      # local dev server
npm run build    # production build (tsc + vite build)
```

## Project structure

```
src/
├── components/
│   ├── Nav.tsx            sticky liquid-glass nav, scroll-anchor links + Register button
│   ├── Hero.tsx            full-screen video hero with custom fade loop + email signup
│   ├── ProgramSection.tsx  #program — 5-week curriculum cards
│   ├── WeeksSection.tsx    #weeks — links to /weeks/wN.html session decks
│   ├── AboutSection.tsx    #about — course description
│   └── Footer.tsx           social icons incl. GitHub
├── pages/
│   ├── Home.tsx     composes all homepage sections
│   └── Register.tsx  /register — student registration form
└── index.css         liquid-glass design system + Instrument Serif import

public/
└── weeks/
    └── w0.html        session decks (standalone HTML "broadside" slides)

docs/
└── style-reference/
    └── ai-first-leader-broadside-sample1.html   coral-themed style reference for decks
```

## Branding

- Site name: **The AI-First Leader**
- GitHub: linked from the footer to `https://github.com/sasistician`

## Liquid glass design system

Defined in `src/index.css` as the `.liquid-glass` class:
- `rgba(255,255,255,0.01)` background with `luminosity` blend mode, `blur(4px)` backdrop filter
- `::before` pseudo-element draws a soft gradient border using a mask-composite "exclude" trick
- Used on: nav pill, hero email bar/buttons, footer icon buttons, program/week cards,
  register form card

Headings use the "Instrument Serif" Google Font (imported in `index.css`), applied via inline
`fontFamily` style.

## Adding a new week's deck

1. Drop the standalone HTML deck into `public/weeks/wN.html` (same "broadside" style as
   `docs/style-reference/ai-first-leader-broadside-sample1.html`)
2. In `src/components/WeeksSection.tsx`, add `N` to the `AVAILABLE_WEEKS` array so its card
   becomes a live link instead of "Coming soon"

## Known placeholders to revisit

- Hero background video is a placeholder URL — swap with the real course video
- About section copy is placeholder — refine with real instructor/course bio
- Registration form (`src/pages/Register.tsx`) is client-side only (no backend); wire up a
  form service (e.g. Formspree) when ready
- Footer social icons (Twitter/Globe) are placeholders — confirm real links or remove
