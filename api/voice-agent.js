// POST /api/voice-agent — one conversational turn, the equivalent of Aurora's /voice-agent.
//
//   multipart/form-data: audio (16 kHz mono WAV from the browser) and/or text, plus state (JSON)
//   application/json:    { text, state }
//   state = { language: 'en'|'zh', history: [{ role, content }] }
//
// Pipeline: speech-to-text (Groq Whisper) → language route → guardrails → BM25 retrieval over
// the course → LLM answer (Groq) → reply check. The browser speaks the reply.
// GROQ_API_KEY lives in Vercel's environment variables; without it the endpoint runs in mock mode.
import { getProvider, CHAT_MODEL, STT_MODEL } from './_lib/providers.js'
import { runTurn } from './_lib/agent.js'
import { kbInfo } from './_lib/kb.js'
import { take, clientId } from './_lib/ratelimit.js'

const MAX_AUDIO_BYTES = 1_200_000 // ~37 s of 16 kHz mono WAV
const MAX_TEXT = 500

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } })

export async function GET() {
  const provider = getProvider()
  return json({ ok: true, mode: provider.name, chatModel: CHAT_MODEL, sttModel: STT_MODEL, kb: kbInfo() })
}

export async function POST(request) {
  const started = Date.now()
  const limit = take(clientId(request))
  if (!limit.ok) {
    return json({ ok: false, error: 'rate_limited', message: 'You’ve asked a lot of questions. Please try again a little later.', retryAfter: limit.retryAfter }, 429, { 'Retry-After': String(limit.retryAfter) })
  }

  let text = ''
  let audio = null
  let state = {}
  try {
    const type = request.headers.get('content-type') || ''
    if (type.includes('multipart/form-data')) {
      const form = await request.formData()
      text = String(form.get('text') || '')
      audio = form.get('audio')
      state = JSON.parse(String(form.get('state') || '{}'))
    } else {
      const body = await request.json()
      text = String(body.text || '')
      state = body.state || {}
    }
  } catch {
    return json({ ok: false, error: 'bad_request', message: 'Could not read the request.' }, 400)
  }
  if (audio && typeof audio === 'object' && audio.size > MAX_AUDIO_BYTES) {
    return json({ ok: false, error: 'too_long', message: 'That was a long one. Please keep questions under about 30 seconds.' }, 413)
  }

  const provider = getProvider()
  const timings = {}
  let transcript = text.trim().slice(0, MAX_TEXT)
  let sttLanguage = null
  try {
    if (audio && typeof audio === 'object' && audio.size > 0) {
      if (provider.name === 'mock') {
        return json({ ok: false, error: 'mock_mode', message: 'Voice input needs the live provider. Type your question instead.' }, 400)
      }
      const ts = Date.now()
      const stt = await provider.transcribe(audio, 'turn.wav')
      timings.stt = Date.now() - ts
      transcript = stt.text.slice(0, MAX_TEXT)
      sttLanguage = stt.language
    }
    if (!transcript) {
      return json({ ok: true, mode: provider.name, transcript: '', reply: '', empty: true, timings })
    }
    const turn = await runTurn({ text: transcript, state, provider, sttLanguage })
    const result = { ok: true, mode: provider.name, transcript, ...turn, timings: { ...timings, ...turn.timings, server: Date.now() - started } }
    // Structured telemetry without conversation content (Aurora's TELEMETRY_INCLUDE_CONTENT=false).
    console.log(JSON.stringify({ event: 'voice_turn', mode: provider.name, policy: turn.policy, language: turn.language, routeChanged: turn.route.changed, sources: turn.sources.length, topScore: turn.topScore, timings: result.timings }))
    return json(result)
  } catch (e) {
    console.error(JSON.stringify({ event: 'voice_turn_error', status: e.status, message: String(e.message).slice(0, 200) }))
    const busy = e.status === 429
    return json({ ok: false, error: busy ? 'provider_busy' : 'provider_error', message: busy ? 'The voice guide is very busy right now. Please try again in a minute.' : 'Something went wrong answering that. Please try again.' }, busy ? 503 : 502)
  }
}
