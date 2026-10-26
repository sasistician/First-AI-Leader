// BM25 keyword retrieval over the course chunks in api/_data/kb.js. No embeddings,
// no vector database, no API cost, like Aurora's sparse FTS5 retrieval.
import data from '../_data/kb.js'
import { tokenize, expandQuery, weekMentions, programMention } from './text.js'

const K1 = 1.2
const B = 0.75

let index = null

function weekOfSource(sourceId) {
  const m = sourceId.match(/^(?:w|lab)(\d)/)
  return m ? Number(m[1]) : null
}

function build(kb) {
  const sources = new Map(kb.sources.map((s) => [s.id, s]))
  const docs = kb.chunks.map((c) => {
    const src = sources.get(c.source) || {}
    // Title and section count twice: they say what the chunk is about.
    const toks = tokenize(`${src.title} ${c.section} ${src.title} ${c.section} ${c.text}`)
    const tf = new Map()
    for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1)
    return { chunk: c, source: src, tf, len: toks.length, week: weekOfSource(c.source), textWeeks: weekMentions(`${c.section} ${c.text}`) }
  })
  const df = new Map()
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1)
  const avgLen = docs.reduce((a, d) => a + d.len, 0) / Math.max(1, docs.length)
  return { docs, df, avgLen, N: docs.length, builtAt: kb.builtAt }
}

export function getIndex(kb = data) {
  if (!index || kb !== data) index = build(kb)
  return index
}

/**
 * search(query, { lang, k, kb }) → [{ id, score, text, section, lang, source: {id,title,url,program} }]
 * Prefers chunks in the session language and from any week the query names.
 */
export function search(query, { lang = 'en', k = 4, kb } = {}) {
  const idx = kb ? build(kb) : getIndex()
  const terms = expandQuery(query)
  const weeks = weekMentions(query)
  const program = programMention(query)
  if (!terms.size && !weeks.length) return []
  const scored = []
  for (const d of idx.docs) {
    // Every deck exists in English, so English questions use English sources only. Chinese
    // questions prefer Chinese but can still use the English-only lab guides.
    if (lang === 'en' && d.chunk.lang !== 'en') continue
    let s = 0
    for (const [t, w] of terms) {
      const f = d.tf.get(t)
      if (!f) continue
      const n = idx.df.get(t) || 0
      const idf = Math.log(1 + (idx.N - n + 0.5) / (n + 0.5))
      s += w * idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / idx.avgLen)))
    }
    if (weeks.length) {
      // A named week pulls in that week's deck and lab, plus overview chunks that list the week;
      // other weeks' decks drop back even when they mention it in passing.
      if (d.week !== null) s = weeks.includes(d.week) ? s + 6 : s * 0.6
      else if (d.textWeeks.some((w) => weeks.includes(w))) s += 4
    }
    if (program && d.source.program) s *= d.source.program === program ? 1.5 : 0.6
    if (s <= 0) continue
    if (d.chunk.lang !== lang) s *= 0.55
    scored.push({ d, s })
  }
  scored.sort((a, b) => b.s - a.s)
  // At most two chunks per source, so a question about a week gets its deck and its lab guide
  // rather than three slices of one document.
  const perSource = new Map()
  const top = []
  for (const x of scored) {
    const n = perSource.get(x.d.source.id) || 0
    if (n >= 2) continue
    perSource.set(x.d.source.id, n + 1)
    top.push(x)
    if (top.length === k) break
  }
  return top.map(({ d, s }) => ({
    id: d.chunk.id,
    score: Math.round(s * 100) / 100,
    text: d.chunk.text,
    section: d.chunk.section,
    lang: d.chunk.lang,
    source: { id: d.source.id, title: d.source.title, url: d.source.url, program: d.source.program },
  }))
}

// The homepage "About the course" paragraph answers the most common questions (who it's for,
// format, "do I need to code?"), so it always goes to the model alongside the search results.
export function pinnedFacts(lang = 'en') {
  const idx = getIndex()
  const sourceId = lang === 'zh' ? 'site-facts-zh' : 'site-facts'
  const d = idx.docs.find((x) => x.chunk.source === sourceId && /About the course|关于课程/.test(x.chunk.section))
  if (!d) return null
  return {
    id: d.chunk.id, score: 0, text: d.chunk.text, section: d.chunk.section, lang: d.chunk.lang,
    source: { id: d.source.id, title: d.source.title, url: d.source.url, program: d.source.program },
  }
}

export function kbInfo() {
  const idx = getIndex()
  return { chunks: idx.N, builtAt: idx.builtAt }
}
