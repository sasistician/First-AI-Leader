// Spoken replies, following Aurora's TTS_BACKEND pattern: "provider" synthesizes English
// replies with Groq Orpheus; anything else (or any failure) leaves speaking to the browser's
// own voice, so the guide never goes silent.
import { ttsConfig } from './providers.js'

export const ORPHEUS_MAX_CHARS = 200

// Orpheus takes at most 200 characters per request: split on sentences, then clauses, then words.
export function splitForTts(text, max = ORPHEUS_MAX_CHARS) {
  const pieces = []
  for (const sentence of String(text || '').trim().split(/(?<=[.!?])\s+/)) {
    if (!sentence) continue
    if (sentence.length <= max) { pieces.push(sentence); continue }
    let rest = sentence
    while (rest.length > max) {
      const window = rest.slice(0, max)
      const cut = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '), window.lastIndexOf(' — '))
      const at = cut > max * 0.4 ? cut + 1 : window.lastIndexOf(' ') > 0 ? window.lastIndexOf(' ') : max
      pieces.push(rest.slice(0, at).trim())
      rest = rest.slice(at).trim()
    }
    if (rest) pieces.push(rest)
  }
  // Re-join short neighbours so there are as few requests as possible.
  const chunks = []
  for (const p of pieces) {
    const last = chunks[chunks.length - 1]
    if (last && last.length + 1 + p.length <= max) chunks[chunks.length - 1] = `${last} ${p}`
    else chunks.push(p)
  }
  return chunks
}

/**
 * synthesize(provider, text, language, env) →
 *   { audio: { format, voice, segments: [base64 WAV] } | null, detail: string | null, ms }
 * detail says why there's no audio: 'system' (by configuration), 'language', 'unsupported', or a failure category.
 */
export async function synthesize(provider, text, language, env = process.env) {
  const cfg = ttsConfig(env)
  const started = Date.now()
  if (cfg.backend !== 'provider') return { audio: null, detail: 'system', ms: 0 }
  if (language !== 'en') return { audio: null, detail: 'language', ms: 0 } // Orpheus is English only
  if (typeof provider.speak !== 'function' || !text) return { audio: null, detail: 'unsupported', ms: 0 }
  try {
    const chunks = splitForTts(text).slice(0, 4) // spoken replies are short; cap the cost of any one turn
    const buffers = await Promise.all(chunks.map((c) => provider.speak(c, cfg)))
    return {
      audio: { format: 'wav', voice: cfg.voice, segments: buffers.map((b) => Buffer.from(b).toString('base64')) },
      detail: null,
      ms: Date.now() - started,
    }
  } catch (e) {
    const s = e.status
    const detail = s === 429 ? 'rate_limit' : s === 401 || s === 403 ? 'auth' : s === 400 ? 'request' : s ? `http_${s}` : 'network'
    console.error(JSON.stringify({ event: 'tts_error', status: s, message: String(e.message).slice(0, 200) }))
    return { audio: null, detail, ms: Date.now() - started }
  }
}
