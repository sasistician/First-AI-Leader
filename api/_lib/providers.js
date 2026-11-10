// One adaptor, two backends (like Aurora's providers.py): Groq for live speech-to-text
// and chat, or a deterministic mock with no network, key or cost (used by the evals, and
// automatically when GROQ_API_KEY isn't set, e.g. on a preview without the variable).

const GROQ = 'https://api.groq.com/openai/v1'
export const CHAT_MODEL = process.env.CHAT_MODEL || 'openai/gpt-oss-120b'
// Groq's free tier sets token and request quotas per model, so when the main model is busy (429) the
// next one in this list answers instead. Same prompt, guardrails and reply check either way.
export const CHAT_FALLBACKS = (process.env.CHAT_FALLBACKS ?? 'openai/gpt-oss-20b,qwen/qwen3.8-27b')
  .split(',').map((m) => m.trim()).filter((m) => m && m !== CHAT_MODEL)
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
    err.retryAfter = Number(res.headers.get('retry-after') || 0)
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

// Per-model request settings: gpt-oss reasons briefly and hides it; Qwen answers without a thinking pass.
function chatParams(model) {
  if (model.startsWith('openai/gpt-oss')) return { reasoning_effort: 'low', include_reasoning: false }
  if (model.startsWith('qwen/')) return { reasoning_effort: 'none' }
  return {}
}

// A model that just returned 429 is skipped until its quota window resets, so later turns on this
// warm instance go straight to a model with headroom instead of paying for a failed request first.
const cooling = new Map()
export function resetChatCooldowns() {
  cooling.clear()
}

function groq(key) {
  return {
    name: 'groq',
    lastChatModel: null,
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
      const chain = [CHAT_MODEL, ...CHAT_FALLBACKS]
      const ready = chain.filter((m) => (cooling.get(m) || 0) <= Date.now())
      const order = ready.length ? ready : chain
      let lastError
      for (const [i, model] of order.entries()) {
        const body = { model, messages, temperature: 0.3, max_completion_tokens: 500, ...chatParams(model) }
        try {
          // Only the last model in the chain waits out a short 429; the others hand over at once.
          const j = await groqFetch(key, '/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }, i === order.length - 1 ? 0 : 2)
          this.lastChatModel = model
          return (j.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()
        } catch (e) {
          if (e.status === 401 || e.status === 403) throw e // a bad key fails every model alike
          if (e.status === 429) cooling.set(model, Date.now() + Math.min(Math.max(e.retryAfter || 10, 2), 60) * 1000)
          lastError = e
        }
      }
      throw lastError
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
