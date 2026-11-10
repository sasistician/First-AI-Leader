// Upcoming dates shown on the site. Keep in step with SCHEDULE in api/_lib/policy.js (what the voice
// guide says) and kb/site-facts*.md (what it retrieves); tests/agent.test.mjs checks that they agree.

export const WORKSHOP = {
  title: 'How to build a bilingual voice agent',
  date: 'Saturday 21 November 2026',
  shortDate: 'Sat 21 Nov',
  time: '10:00–12:00 Malaysia time (GMT+8)',
  format: 'Free · Live online · 2 hours',
  blurb:
    'See how the voice guide on this site is built, from the browser to the reply, using real bugs and decisions from the project. Open to anyone; no coding needed to follow along.',
  topics: [
    'Anatomy of one voice turn: turn detection, barge-in, and why there’s no streaming server',
    'Speech in, speech out: Whisper with a vocabulary prompt, the Orpheus voice, and the 200-character split',
    'One agent, two languages: session language routing and the “Is it taught in Mandarin?” bug',
    'RAG without a vector database: tuning BM25 search, with bilingual query expansion',
    'Guardrails in code: what the model must never say, and how code enforces it',
    'Evals: turning every production bug into a test',
    'Live Q&A',
  ],
}

export const COHORT = {
  title: 'The AI-First Leader',
  date: '15 January 2027',
  format: 'Five weeks · Live online',
  blurb: 'The next cohort for senior and mid-level leaders. No prior coding experience required.',
}

export type Interest = 'workshop' | 'cohort' | 'both'

export const INTERESTS: { value: Interest; label: string }[] = [
  { value: 'workshop', label: `Free workshop · ${WORKSHOP.shortDate}` },
  { value: 'cohort', label: `${COHORT.title} · starts ${COHORT.date}` },
  { value: 'both', label: 'Both' },
]
