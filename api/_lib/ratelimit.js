// Best-effort per-visitor limit, kept in memory per function instance. It slows casual
// abuse of the free Groq quota; a shared store (e.g. Vercel KV) would be needed for a
// hard global limit.
const WINDOW_MS = 10 * 60 * 1000
const PER_WINDOW = Number(process.env.RATE_PER_10_MIN || 20)
const PER_DAY = Number(process.env.RATE_PER_DAY || 60)
const hits = new Map()

export function clientId(request) {
  const fwd = request.headers.get('x-forwarded-for') || ''
  return fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || 'local'
}

/** take(id) → { ok, retryAfter } and records the hit when ok. */
export function take(id, now = Date.now()) {
  const list = (hits.get(id) || []).filter((t) => now - t < 24 * 60 * 60 * 1000)
  const recent = list.filter((t) => now - t < WINDOW_MS)
  if (recent.length >= PER_WINDOW) return { ok: false, retryAfter: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000) }
  if (list.length >= PER_DAY) return { ok: false, retryAfter: Math.ceil((24 * 60 * 60 * 1000 - (now - list[0])) / 1000) }
  list.push(now)
  hits.set(id, list)
  if (hits.size > 5000) hits.delete(hits.keys().next().value) // bound memory
  return { ok: true, retryAfter: 0 }
}

export function resetLimits() {
  hits.clear()
}
