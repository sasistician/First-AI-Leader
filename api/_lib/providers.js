// One adaptor, two backends (like Aurora's providers.py): Groq for live speech-to-text
// and chat, or a deterministic mock with no network, key or cost (used by the evals, and
// automatically when GROQ_API_KEY isn't set, e.g. on a preview without the variable).

const GROQ = 'https://api.groq.com/openai/v1'
export const CHAT_MODEL = process.env.CHAT_MODEL || 'openai/gpt-oss-120b'
export const STT_MODEL = process.env.STT_MODEL || 'whisper-large-v3-turbo'
const STT_PROMPT = 'The AI-First Leader, The AI-First Engineer, Claude Code, MCP, Skills, sub-agents, orchestration, guardrails, EVBot, Bilal Farooq.'

export function getProvider(env = process.env) {
  const mode = env.PROVIDER || (env.GROQ_API_KEY ? 'groq' : 'mock')
  return mode === 'groq' ? groq(env.GROQ_API_KEY) : mock()
}

async function groqFetch(key, path, init, attempt = 0) {
  const res = await fetch(`${GROQ}${path}`, { ...init, headers: { Authorization: `Bearer ${key}`, ...(init.headers || {}) } })
  // The free tier's per-minute token limit usually clears within a second or two: wait once.
  if (res.status === 429 && attempt < 2) {
    const wait = Number(res.headers.get('retry-after') || 0)
    if (wait > 0 && wait <= 3) {
      await new Promise((r) => setTimeout(r, wait * 1000 + 100))
      return groqFetch(key, path, init, attempt + 1)
    }
  }
  if (!res.ok) {
    const body = await res.text()
    const err = new Error(`Groq ${path} HTTP ${res.status}: ${body.slice(0, 300)}`)
    err.status = res.status
    throw err
  }
  return res.json()
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
