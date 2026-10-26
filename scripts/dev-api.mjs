#!/usr/bin/env node
/*
 * Runs the Vercel function api/voice-agent.js locally on http://localhost:3001, so `npm run dev`
 * (which proxies /api there) works without the Vercel CLI.
 *
 *   npm run dev:api        reads GROQ_API_KEY from the environment or .env.local; mock mode without it
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const envFile = path.join(ROOT, '.env.local')
if (!process.env.GROQ_API_KEY && fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2]
  }
}

const api = await import('../api/voice-agent.js')
const PORT = Number(process.env.API_PORT || 3001)

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const handler = url.pathname === '/api/voice-agent' ? api[req.method] : null
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    return res.end('{"ok":false,"error":"not_found"}')
  }
  try {
    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Readable.toWeb(req)
    const response = await handler(new Request(url, { method: req.method, headers: req.headers, body, duplex: 'half' }))
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: String(e.message) }))
  }
}).listen(PORT, () => {
  console.log(`Voice agent API on http://localhost:${PORT}/api/voice-agent (${process.env.GROQ_API_KEY ? 'live: Groq' : 'mock mode: no GROQ_API_KEY'})`)
})
