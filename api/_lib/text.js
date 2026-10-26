// Tokenising for bilingual (English / 中文) keyword search, in the spirit of the Aurora
// voice agent's SQLite FTS5 retrieval with bilingual query expansion.

const STOP = new Set(`a an and are as at be but by can could do does for from had has have how i if in into is it its
me my of on or our so than that the their them then there these they this to us was we were what when where which
who why will with would you your about tell explain please course program week weeks lesson session cover covers
covered learn learning need needs know want like get happen happens matter matters mean means important`.split(/\s+/))

// Chinese function-word bigrams ("what", "how", "need to"…) that otherwise act as noise.
const ZH_STOP = new Set(`什么 么是 是什 怎么 么样 哪些 为什 可以 我们 你们 他们 这个 那个 一个 需要 讲什 会讲 学什 学到 的是 是不 不是
有没 没有 一下 告诉 请问 课程 这门 门课 这周 本周 内容 关于 吗 呢 吧 了 的 是 我 你 在 有 和 就 都 也 要 会 这 那 么`.split(/\s+/))

const HAN = /\p{Script=Han}/u

export function hasChinese(s) {
  return HAN.test(s || '')
}

// Chinese questions often carry English product names ("Claude Code 的第一周讲什么"), so compare
// Han characters with Latin *words*, not letters.
export function looksChinese(s) {
  const han = [...(s || '')].filter((c) => HAN.test(c)).length
  const latinWords = ((s || '').match(/[A-Za-z]+/g) || []).length
  return { chinese: han >= 2 && han >= latinWords * 1.5, han, latinWords }
}

// Share of Han characters among letters: > 0.3 means the text is mainly Chinese.
export function chineseRatio(s) {
  const letters = [...(s || '')].filter((c) => /\p{L}/u.test(c))
  if (!letters.length) return 0
  return letters.filter((c) => HAN.test(c)).length / letters.length
}

function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y'
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1)
  return w
}

// English words (lower-cased, light stemming, no stop words) + Chinese character bigrams.
export function tokenize(s) {
  const out = []
  // "Claude Code" is one product name; without this, every question about "code" matches it.
  const text = (s || '').normalize('NFKC').toLowerCase().replace(/claude\s+code/g, 'claudecode')
  for (const m of text.matchAll(/[a-z0-9]+(?:[-'][a-z0-9]+)*|\p{Script=Han}+/gu)) {
    const t = m[0]
    if (HAN.test(t)) {
      // Characters and character pairs: pairs give precision, single characters recall ("教" in "谁来教").
      for (const ch of t) if (!ZH_STOP.has(ch)) out.push(ch)
      for (let i = 0; i < t.length - 1; i++) {
        const bg = t.slice(i, i + 2)
        if (!ZH_STOP.has(bg)) out.push(bg)
      }
    } else {
      for (const part of t.split(/[-']/)) {
        if (part && !STOP.has(part)) out.push(stem(part))
      }
    }
  }
  return out
}

// Bilingual expansion: a query in either language also matches the other language's terms.
const GLOSSARY = [
  ['mcp', '模型上下文协议'],
  ['skill', '技能'],
  ['subagent', '子智能体', '子代理'],
  ['agent', '智能体', '代理'],
  ['orchestration', '编排'],
  ['orchestrate', '编排'],
  ['guardrail', '护栏'],
  ['evaluation', '评估'],
  ['eval', '评估'],
  ['context', '上下文'],
  ['memory', '记忆'],
  ['hook', '钩子'],
  ['lab', '实验'],
  ['capstone', '结业项目', '毕业项目'],
  ['strategy', '战略'],
  ['roadmap', '路线图'],
  ['delegation', '委派'],
  ['delegate', '委派'],
  ['grounding', '知识'],
  ['prompt', '提示'],
  ['tool', '工具'],
  ['harness', '框架'],
  ['code', 'coding', 'coder', 'programming', '代码', '编程'],
  ['foundation', '基础'],
  ['certification', '认证'],
  ['leader', '领导者'],
  ['engineer', '工程师'],
  ['teach', 'teache', 'taught', 'teaching', 'instructor', 'teacher', 'bilal', '讲师', '老师', '授课', '教学'],
  ['experience', 'background', '经验'],
]

// Which program a question names, if any: "leader"/"executive" or "engineer"/"developer".
export function programMention(s) {
  const t = (s || '').toLowerCase()
  if (/\b(leaders?|leadership|executives?|managers?)\b|领导|高管|管理者/.test(t)) return 'leader'
  if (/\b(engineers?|engineering|developers?|builder)\b|工程师|开发者/.test(t)) return 'engineer'
  return null
}
const EXPAND = new Map()
for (const group of GLOSSARY) {
  const toks = group.flatMap((g) => tokenize(g))
  for (const t of toks) EXPAND.set(t, [...new Set([...(EXPAND.get(t) || []), ...toks])])
}

// "week 4" / "第4周" / "第四周" → the same week marker token in both languages.
const CN_DIGITS = { 零: 0, 〇: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5 }
// Speech-to-text writes numbers as words ("week one"), and people say "the fourth week".
const EN_NUMBERS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, first: 1, second: 2, third: 3, fourth: 4, fifth: 5 }
export function weekMentions(s) {
  const weeks = new Set()
  for (const m of (s || '').matchAll(/week\s*0?(\d)/gi)) weeks.add(Number(m[1]))
  for (const m of (s || '').matchAll(/\bweek\s+(zero|one|two|three|four|five)\b/gi)) weeks.add(EN_NUMBERS[m[1].toLowerCase()])
  for (const m of (s || '').matchAll(/\b(first|second|third|fourth|fifth)\s+week\b/gi)) weeks.add(EN_NUMBERS[m[1].toLowerCase()])
  for (const m of (s || '').matchAll(/第\s*([0-5零〇一二三四五])\s*周/g)) {
    weeks.add(/\d/.test(m[1]) ? Number(m[1]) : CN_DIGITS[m[1]])
  }
  return [...weeks]
}

// → Map(term → weight). The question's own words weigh 1; glossary expansions 0.4, so a
// translation helps recall without outranking text in the question's own language.
export function expandQuery(s) {
  const terms = new Map()
  const base = tokenize(s)
  // Acronyms in the question (MCP, RAG, API) are nearly always its topic, but they appear so
  // often in the decks that BM25 rates them low. Weight them up.
  const acronyms = new Set([...(s || '').matchAll(/\b[A-Z]{2,5}\b/g)].map((m) => m[0].toLowerCase()))
  for (const t of base) terms.set(t, acronyms.has(t) ? 2.5 : 1)
  for (const t of base) for (const x of EXPAND.get(t) || []) if (!terms.has(x)) terms.set(x, 0.4)
  return terms
}
