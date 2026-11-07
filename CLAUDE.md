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
│   ├── WeeksSection.tsx    #weeks — links to /weeks/wN_english.html / wN_mandarin.html decks
│   ├── AboutSection.tsx    #about — course description
│   ├── WhySection.tsx      #why — chat-vs-direct before/after contrast cards
│   ├── InstructorSection.tsx #instructor — instructor bio with headshot photo
│   └── Footer.tsx           social icons: GitHub, email, LinkedIn
│   └── VoiceAgent.tsx       course voice guide UI (mic, transcript, sources, timings)
├── lib/voice.ts      mic turn detection + WAV encoding + browser TTS
├── pages/
│   ├── Home.tsx     composes all homepage sections
│   ├── Register.tsx  /register — student registration form, posts to Formspree
│   └── Agentic.tsx   /agentic — personalized ad + voice guide
└── index.css         liquid-glass design system + Instrument Serif import

api/                  Vercel functions: voice-agent.js + _lib/ (agent, kb, policy, router, providers, ratelimit) + _data/kb.js
kb/                   knowledge-base allowlist (sources.json) and homepage facts
scripts/              build-kb.mjs, dev-api.mjs
tests/, evals/        unit tests and Aurora-style eval suites

public/
├── images/
│   └── bilal-farooq.jpg   instructor headshot, used by InstructorSection.tsx
└── weeks/
    └── w0_english.html   session decks (standalone HTML "broadside" slides)

docs/
└── style-reference/
    └── ai-first-leader-broadside-sample1.html   coral-themed style reference for decks
```

## Branding

- Site name: **The AI-First Leader**
- Footer links: GitHub (`https://github.com/sasistician`), email (`mailto:bilalf@gmail.com`),
  LinkedIn (`https://www.linkedin.com/in/sasistician/`, custom inline SVG icon since
  lucide-react has no brand icons)

## Liquid glass design system

Defined in `src/index.css` as the `.liquid-glass` class:
- `rgba(255,255,255,0.01)` background with `luminosity` blend mode, `blur(4px)` backdrop filter
- `::before` pseudo-element draws a soft gradient border using a mask-composite "exclude" trick
- Used on: nav pill, hero email bar/buttons, footer icon buttons, program/week cards,
  register form card

Headings use the "Instrument Serif" Google Font (imported in `index.css`), applied via inline
`fontFamily` style.

## Adding a new week's deck

1. Drop the standalone HTML deck into `public/weeks/wN_english.html` and/or
   `public/weeks/wN_mandarin.html` (same "broadside" style as
   `docs/style-reference/ai-first-leader-broadside-sample1.html`)
2. In `src/components/WeeksSection.tsx`, add `N` to `AVAILABLE_ENGLISH` and/or
   `AVAILABLE_MANDARIN` so that language's link becomes live instead of greyed out
3. Add the deck to `kb/sources.json` and run `npm run kb` so the voice guide knows it

## /agentic: personalized ad + course voice guide

The page `src/pages/Agentic.tsx` (linked as "Live demo" in the nav) has two parts:

1. **Personalized ad** in an iframe: `public/agentic-ad/` is an export of the ad demo built in
   `../agentic-marketing` (`scripts/export-to-site.sh` there). Don't edit it here; re-export. It reports its
   height to the page via `postMessage` (`?embed=1`).
2. **Voice guide** (`src/components/VoiceAgent.tsx`, `src/lib/voice.ts`): a RAG voice agent over the course,
   modelled on the Aurora workshop agent (hamzafarooq/multi-agent-course, Assignment 2), without LiveKit.

**Pipeline:** the browser detects end-of-turn (adaptive noise floor, pre-roll, barge-in) and posts 16 kHz
WAV to `api/voice-agent.js` (Vercel function). That runs Groq Whisper STT, then the language router
(EN/中文), then deterministic guardrails (`api/_lib/policy.js`: prices/dates, injection, greetings), then BM25
retrieval (`api/_lib/kb.js`), then Groq `openai/gpt-oss-120b`, then a reply check. The browser speaks the
reply with its own voice (free).

- **Knowledge base:** `kb/sources.json` is an **allowlist**; only those files are indexed. `npm run kb`
  writes `api/_data/kb.js`; commit it. `kb/site-facts.md` (+ `.zh.md`) holds verbatim homepage copy. Week
  decks and lab guides belong to the sibling program **The AI-First Engineer**; the overview and homepage
  facts are **The AI-First Leader**. Never add personal files, `.env`s, databases or internal planning
  docs (e.g. `syllabus.md`).
- **Keys:** `GROQ_API_KEY` is set in Vercel's environment variables (Preview + Production), or in
  `.env.local` for local dev (git-ignored). Without it the API runs in **mock mode** (typed questions
  only; answers quote the best excerpt).
- **Local dev:** `npm run dev:api` (port 3001) plus `npm run dev` (Vite proxies `/api`).
- **Tests:** `npm run test:agent` (unit) and `npm run evals` (Aurora-style core and red-team suites, mock,
  no cost). `GROQ_API_KEY=... npm run evals -- --live` adds model checks. Add an eval case before changing
  the prompt, guardrails or retrieval.
- **Limits:** Groq free tier allows 8,000 tokens/minute and 1,000 requests/day for all visitors combined
  (about 1,300 tokens per turn). Per-visitor limits in `api/_lib/ratelimit.js` are in-memory, best effort.
- **Routing:** `vercel.json` sends every non-`/api` path to `index.html`, so `/agentic` and `/register`
  work as direct links.
- **Spoken replies (Aurora's `TTS_BACKEND`):** with `TTS_BACKEND=provider` (the default), English replies are
  synthesized by Groq Orpheus (`api/_lib/tts.js`). The voice is `TTS_VOICE`, default `troy`; other voices are
  autumn, diana, hannah, austin and daniel. Replies are split into ≤200-character requests and returned as base64 WAV.
  Chinese replies, `TTS_BACKEND=system`, or any TTS failure (e.g. quota) fall back to the browser's voice;
  `ttsDetail` in the response says why. Groq's free tier allows only ~3,600 Orpheus tokens/day; the Developer
  tier is $22 per 1M characters (~$3.30 per 1,000 answers).
- **Home page "Talk to AI":** `src/components/TalkDrawer.tsx` is a right-hand side panel (dimmed, blurred backdrop;
  Esc or clicking outside closes it; page scroll locked; focus moves in and back) that shows `VoiceAgent` in
  `compact` mode, with a full-width "Click here to talk" button. Entry points: a "Talk to AI" button in `Nav.tsx`
  (top right, next to Register), one in `Hero.tsx` (next to "See the program"), and `FloatingTalkButton`
  (bottom right, shown only after the hero scrolls away). `Home.tsx` owns the open state; `/?talk=1` opens it
  directly. Closing unmounts the agent, which stops the mic.

## Known placeholders to revisit

- Hero background video is a placeholder URL — swap with the real course video
- About section copy is placeholder — refine with real instructor/course bio
- Registration form (`src/pages/Register.tsx`) posts to Formspree
  (`https://formspree.io/f/mwvjabzb`, delivers to bilalf@gmail.com)
