// One adaptor, two backends (like Aurora's providers.py): Groq for live speech-to-text
// and chat, or a deterministic mock with no network, key or cost (used by the evals, and
// automatically when GROQ_API_KEY isn't set, e.g. on a preview without the variable).

const GROQ = 'https://api.groq.com/openai/v1'
export const CHAT_MODEL = process.env.CHAT_MODEL || 'openai/gpt-oss-120b'
export const STT_MODEL = process.env.STT_MODEL || 'whisper-large-v3-turbo'
const STT_PROMPT = 'The AI-First Leader, The AI-First Engineer, Claude Code, MCP, Skills, sub-agents, orchestration, guardrails, EVBot, Bilal Farooq.'

// Forgive common paste slips in the dashboard: surrounding quotes, whitespace, a "GROQ_API_KEY=" prefix.
export function cleanKey(value) {
  return String(value || '').trim().replace(/^GROQ_API_KEY\s*=\s*/, '').replace(/^["']|["']$/g, '').trim()
}

export function getProvider(env = process.env) {
  const key = cleanKey(env.GROQ_API_KEY)
  const mode = env.PROVIDER || (key ? 'groq' : 'mock')
  return mode === 'groq' ? groq(key) : mock()
}

async function groqFetch(key, path, init, attempt = 0, as = 'json') {
  const res = await fetch(`${GROQ}${path}`, { ...init, headers: { Authorization: `Bearer ${key}`, ...(init.headers || {}) } })
  // The free tier's per-minute token limit usually clears within a second or two: wait once.
  if (res.status === 429 && attempt < 2) {
    const wait = Number(res.headers.get('retry-after') || 0)
    if (wait > 0 && wait <= 3) {
      await new Promise((r) => setTimeout(r, wait * 1000 + 100))
      return groqFetch(key, path, init, attempt + 1, as)
    }
  }
  if (!res.ok) {
    const body = await res.text()
    const err = new Error(`Groq ${path} HTTP ${res.status}: ${body.slice(0, 300)}`)
    err.status = res.status
    throw err
  }
  return as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : res.json()
}

// Text-to-speech settings, read per call so Vercel env changes apply on the next deployment.
// TTS_BACKEND=provider speaks English replies with Groq Orpheus; =system leaves it to the browser.
export function ttsConfig(env = process.env) {
  return {
    backend: (env.TTS_BACKEND || 'provider').toLowerCase(),
    model: env.TTS_MODEL || 'canopylabs/orpheus-v1-english',
    voice: env.TTS_VOICE || 'troy',
  }
}

function groq(key) {
  return {
    name: 'groq',
    async transcribe(audio, filename = 'turn.wav') {
      const form = new FormData()
      form.append('file', audio, filename)
      form.append('model', STT_MODEL)
      form.append('response_format', 'verbose_json')
      form.append('prompt', STT_PROMPT)
      const j = await groqFetch(key, '/audio/transcriptions', { method: 'POST', body: form })
      return { text: (j.text || '').trim(), language: j.language || null }
    },
    async chat(messages) {
      const body = { model: CHAT_MODEL, messages, temperature: 0.3, max_completion_tokens: 500 }
      if (CHAT_MODEL.startsWith('openai/gpt-oss')) Object.assign(body, { reasoning_effort: 'low', include_reasoning: false })
      const j = await groqFetch(key, '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return (j.choices?.[0]?.message?.content || '').trim()
    },
    // Groq Orpheus: English only, WAV output, at most 200 characters per request (see tts.js).
    async speak(text, { model, voice } = ttsConfig()) {
      return groqFetch(key, '/audio/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, voice, input: text, response_format: 'wav' }),
      }, 0, 'buffer')
    },
  }
}

// Mock: answers by quoting the best excerpt, so retrieval and guardrails can be tested offline.
function mock() {
  return {
    name: 'mock',
    async transcribe() {
      return { text: '', language: null }
    },
    async chat(messages) {
      const user = messages[messages.length - 1]?.content || ''
      const m = user.match(/\[1\][^\n]*\n([^\n]+)/)
      const excerpt = m ? m[1].split(/(?<=[.!?。！？])\s+/).slice(0, 2).join(' ') : ''
      return excerpt ? `From the course material: ${excerpt}` : "I couldn't find that in the course material."
    },
  }
}
