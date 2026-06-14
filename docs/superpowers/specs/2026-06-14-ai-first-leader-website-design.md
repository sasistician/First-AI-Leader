# The AI-First Leader — Website Design

## Context

The user is building a marketing/course website for "The AI-First Leader," a 5-week online
cohort. Course session content already exists as standalone HTML "broadside" slide decks
(coral palette, see `ai-first-leader-broadside-sample1.html` as a style reference; a real
`w0.html` is being added next, with `w1`–`w5` to follow). The user wants a new React-based
marketing homepage with a cinematic dark "liquid glass" hero (video background, glassmorphism
UI), a registration page for new students, a link to the GitHub profile `sasistician`, and a
`CLAUDE.md` to guide future work as more weekly content is added.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS 3 (default config, no extensions)
- lucide-react for icons
- React Router (for `/` and `/register`)
- Google Font "Instrument Serif" (regular + italic) via `@import`

## Project structure

```
firstWebsite/
├── CLAUDE.md
├── index.html
├── public/
│   └── weeks/
│       └── w0.html              (provided by user; w1-w5 added later)
├── src/
│   ├── components/
│   │   ├── Nav.tsx
│   │   ├── Hero.tsx
│   │   ├── ProgramSection.tsx
│   │   ├── WeeksSection.tsx
│   │   ├── AboutSection.tsx
│   │   └── Footer.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── Register.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── ai-first-leader-broadside-sample1.html   (kept as style reference)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Homepage (`/`)

### Nav
Sticky liquid-glass pill, matching the spec's nav layout:
- Logo: Globe icon (lucide-react) + "The AI-First Leader" wordmark
- Links: **Program**, **Weeks**, **About** (scroll-to anchors within the page)
- Right side: **Register** button (liquid-glass pill, routes to `/register`)

### Hero
- Full-screen looping background video (placeholder URL from the provided spec; swappable
  later), shifted down 17% via `translate-y-[17%]`, custom JS fade-in/fade-out loop exactly as
  specified (requestAnimationFrame, 500ms fades, `fadingOutRef` guard)
- Heading in Instrument Serif: "Built for the AI-first leader."
- Liquid-glass email signup bar (email input + circular submit button with ArrowRight icon)
- Subtitle text describing the cohort
- Liquid-glass button below the signup, labeled "See the program" — scrolls to `#program`

### Program section (`#program`)
Dark liquid-glass cards summarizing the 5-week structure, condensed from the "five-week climb"
copy in the broadside sample (short blurb per week, not full slide content). Each week's card
may link to its `Weeks` entry once that week's deck exists.

### Weeks section (`#weeks`)
Cards/links to `/weeks/w0.html` through `/weeks/w5.html`. Only `w0` is live initially; cards for
`w1`-`w5` render as "Coming soon" (disabled/greyed) until those files are added to
`public/weeks/`.

### About section (`#about`)
Short placeholder description of the course/instructor — flagged as content the user will
likely refine.

### Footer
Social icons in liquid-glass circular buttons:
- GitHub icon → `https://github.com/sasistician`
- Other icons from the original spec (Instagram, Twitter, Globe) retained or trimmed per
  taste — placeholder for now

## Registration page (`/register`)

- Liquid-glass form matching the dark hero aesthetic
- Fields: **Name**, **Email**, optional **Message/note**
- Client-side validation only; on submit, show a "Thanks — we'll be in touch" confirmation
  state. No backend wiring yet (documented in CLAUDE.md as a follow-up — e.g. Formspree)
- Link back to homepage

## Liquid glass design system

Implemented as a shared `.liquid-glass` CSS class in `src/index.css`, per the provided spec:
- `background: rgba(255,255,255,0.01)`, `background-blend-mode: luminosity`
- `backdrop-filter: blur(4px)` (+ `-webkit-` prefix)
- `box-shadow: inset 0 1px 1px rgba(255,255,255,0.1)`
- `::before` pseudo-element gradient border using the mask-composite "exclude" trick
- `position: relative; overflow: hidden; pointer-events: none` on the pseudo-element

This class is reused across Nav, Hero (signup bar, manifesto button), Register form, and
Footer icon buttons.

## Deployment

Target: Vercel or Netlify (not yet configured — out of scope for initial build, but project
structure should not preclude it; standard Vite build output is compatible with both).

## CLAUDE.md contents

- Tech stack & commands (`npm install`, `npm run dev`, `npm run build`)
- Project structure overview
- Liquid glass design system reference (CSS classes/tokens to reuse for consistency)
- How to add a new week's deck: drop `wN.html` into `public/weeks/`, update `WeeksSection.tsx`
  to enable that week's card
- Branding: site name "The AI-First Leader", GitHub link `github.com/sasistician`
- Open placeholders to revisit: hero background video URL, About section copy, registration
  form backend integration, social icon set in footer

## Out of scope / follow-ups

- Real hero video (currently placeholder URL)
- Registration backend (currently client-side only)
- Deployment configuration (Vercel/Netlify project setup)
- w1-w5 weekly deck content (added incrementally by the user)
