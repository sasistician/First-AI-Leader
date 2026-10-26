#!/usr/bin/env node
/*
 * Aurora-style task and red-team evaluations for the course voice agent.
 *
 *   node evals/run-evals.mjs                      both suites, mock provider (no API cost)
 *   node evals/run-evals.mjs --suite red-team     one suite
 *   GROQ_API_KEY=... node evals/run-evals.mjs --live   also run model checks ("live" expectations)
 *
 * Add a case here before changing the prompt, guardrails or retrieval, so every behaviour
 * change has an explicit acceptance criterion.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runTurn } from '../api/_lib/agent.js'
import { getProvider } from '../api/_lib/providers.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const live = args.includes('--live')
const suiteArg = args.includes('--suite') ? args[args.indexOf('--suite') + 1] : null
const verbose = args.includes('--verbose')
const provider = getProvider(live ? process.env : { PROVIDER: 'mock' })
if (live && provider.name !== 'groq') {
  console.error('--live needs GROQ_API_KEY in the environment')
  process.exit(1)
}

function check(expect, turn) {
  const f = []
  const reply = turn.reply || ''
  const low = reply.toLowerCase()
  if (expect.policy && turn.policy !== expect.policy) f.push(`policy ${turn.policy}, expected ${expect.policy}`)
  if (expect.language && turn.language !== expect.language) f.push(`language ${turn.language}, expected ${expect.language}`)
  if (expect.contains && !reply.includes(expect.contains)) f.push(`reply missing "${expect.contains}"`)
  for (const bad of expect.forbid || []) if (low.includes(bad.toLowerCase())) f.push(`reply contains forbidden "${bad}"`)
  if (expect.sourceContains && !turn.sources.some((s) => (s.url || '').includes(expect.sourceContains))) {
    f.push(`sources missing ${expect.sourceContains} (got ${turn.sources.map((s) => s.url || s.title).join(', ') || 'none'})`)
  }
  if (expect.sourceSection && !turn.sources.some((s) => s.section.includes(expect.sourceSection))) f.push(`no source section "${expect.sourceSection}"`)
  if (expect.programFirst && turn.sources[0]?.program !== expect.programFirst) f.push(`first source program ${turn.sources[0]?.program}, expected ${expect.programFirst}`)
  if (live && expect.live) {
    const l = expect.live
    if (l.containsAny && !l.containsAny.some((x) => low.includes(x.toLowerCase()))) f.push(`live reply has none of ${JSON.stringify(l.containsAny)}`)
    for (const bad of l.forbid || []) if (low.includes(bad.toLowerCase())) f.push(`live reply contains forbidden "${bad}"`)
    if (l.maxWords && reply.split(/\s+/).length > l.maxWords) f.push(`live reply ${reply.split(/\s+/).length} words > ${l.maxWords}`)
  }
  return f
}

const suites = { core: 'core.json', 'red-team': 'red_team.json' }
let failed = 0
let total = 0
for (const [name, file] of Object.entries(suites)) {
  if (suiteArg && suiteArg !== name) continue
  const cases = JSON.parse(fs.readFileSync(path.join(HERE, file), 'utf8'))
  console.log(`\n${name} (${provider.name})`)
  for (const c of cases) {
    let state = { language: 'en', history: [] }
    const failures = []
    for (const t of c.turns) {
      const onlyLive = t.expect.live && Object.keys(t.expect).length === 1
      if (onlyLive && !live) continue
      let turn
      try {
        turn = await runTurn({ text: t.user, state, provider })
      } catch (e) {
        failures.push(`"${t.user}": error ${String(e.message).slice(0, 120)}`)
        break
      }
      failures.push(...check(t.expect, turn).map((x) => `"${t.user}": ${x}`))
      if (verbose) console.log(`    > ${t.user}\n    < [${turn.policy}/${turn.language}] ${turn.reply}`)
      state = { language: turn.language, history: [...state.history, { role: 'user', content: t.user }, { role: 'assistant', content: turn.reply }] }
      if (live && turn.policy === 'answered') await new Promise((r) => setTimeout(r, 9000)) // stay under 8,000 tokens/minute
    }
    total++
    if (failures.length) failed++
    console.log(`  ${failures.length ? 'FAIL' : 'pass'}  ${c.id}`)
    for (const x of failures) console.log(`        ${x}`)
  }
}
console.log(`\n${total - failed}/${total} passed${live ? ' (live model checks included)' : ' (mock: model-dependent checks skipped; use --live)'}`)
process.exit(failed ? 1 : 0)
