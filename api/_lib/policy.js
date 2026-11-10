// Deterministic guardrails that run outside the model, before and after it.
// Rules the model can't talk its way around: no invented prices or dates, no prompt
// injection, course topics only. Dates come only from SCHEDULE below, never from the model.

// The only dates the voice guide states. Keep in step with the homepage (src/lib/schedule.ts)
// and kb/site-facts*.md; tests check that all three agree.
export const SCHEDULE = {
  workshop: { en: 'Saturday 21 November 2026, 10am to noon Malaysia time', zh: '2026年11月21日（星期六）马来西亚时间上午10点至12点' },
  cohort: { en: '15 January 2027', zh: '2027年1月15日' },
}

// System prompts and 提示词 are course topics, so only asking for *this agent's* prompt, or trying to
// override it, counts. "What is a system prompt?" and "什么是提示词工程？" are course questions.
const INJECTION = /ignore (all |any |the )?(previous|prior|above|earlier) (instructions|rules|prompts?)|\b(your|this agent's|the hidden) (system prompt|instructions|developer (message|prompt))|\b(reveal|print|show|repeat|output|dump|leak) (me )?(the |your )?(system prompt|instructions|developer (message|prompt))|you are now|jailbreak|pretend (to be|you are)|act as (an? )?(unrestricted|different)|忽略(之前|以上|前面)?的?(所有)?(指令|指示|规则)|你的(系统提示|提示词|指令)|(告诉我|显示|输出|打印|透露|泄露|重复)(一下)?(你的)?(系统提示|提示词)/i
// "How much does it cost to run an agent?" is about running costs, a course topic, not the course price.
const RUNNING_COST = /\bcosts?\s+to\s+(run|build|host|call|use|deploy)\b|\b(token|api|inference|running|compute|model)\s+costs?\b/i
// Only questions about what the course costs. "How much context…" or "token cost" are course content.
const PRICING = /\b(price|prices|pricing|tuition|fees?|discount|refund|payment)\b|\bhow much (is|does|will|would) (it|this|that|the (course|program|cohort|class))\b|\bhow much\b.{0,25}\b(costs?|charge|pay)\b|\b(course|program|cohort|class|it)\s+costs?\b|\bcosts? of (the |this )?(course|program|cohort|class)\b|价格|多少钱|费用|学费|优惠|折扣|退款|付款/i
const DATES = /\b(start date|when (does|will|is) (it|the ([\w-]+ )?(course|cohort|program|class|workshop|session|webinar)|the next)|next cohort|enrol(l)?ment (deadline|date)|deadline|what date|which date|what time|upcoming cohort)\b|什么时候(开始|开课|上课|举行|举办)|开课(时间|日期)|下一期|截止|工作坊.{0,8}(时间|什么时候|哪天|几点|日期)|(时间|什么时候|哪天|几点|日期).{0,8}工作坊/i
const GREETING = /^\s*(hi|hello|hey|good (morning|afternoon|evening)|你好|您好|嗨|哈喽)[\s!.,。！]*$/i
const THANKS = /^\s*(thanks|thank you|cheers|ok(ay)?|great|cool|谢谢|好的|明白了?)[\s!.,。！]*$/i

const REPLIES = {
  injection: {
    en: "I can only help with questions about Bilal's courses, so I'll stay on that. What would you like to know about the program?",
    zh: '我只能回答与 Bilal 课程相关的问题。你想了解课程的哪些内容？',
  },
  pricing: {
    en: "The site doesn't list pricing for the course, and the voice agent workshop is free. Register at sasistician.com and Bilal will be in touch.",
    zh: '网站没有公布课程价格，语音智能体工作坊是免费的。请在 sasistician.com 报名，Bilal 会与你联系。',
  },
  dates: {
    en: `The free two-hour online workshop on building a bilingual voice agent is on ${SCHEDULE.workshop.en}. The next AI-First Leader cohort starts on ${SCHEDULE.cohort.en}. Register at sasistician.com.`,
    zh: `关于构建双语语音智能体的免费两小时线上工作坊将于${SCHEDULE.workshop.zh}举行。下一期 AI-First Leader 课程将于${SCHEDULE.cohort.zh}开课。请在 sasistician.com 报名。`,
  },
  greeting: {
    en: "Hi, I'm the course guide for Bilal's AI-First programs. Ask me what you'll build each week, or what topics like MCP or orchestration mean.",
    zh: '你好，我是 Bilal 的 AI-First 课程向导。你可以问我每周会做什么，或者 MCP、编排这些主题是什么意思。',
  },
  thanks: {
    en: 'You’re welcome. Anything else about the course?',
    zh: '不客气。关于课程还有其他问题吗？',
  },
  offtopic: {
    en: "I can only answer questions about Bilal's AI-First courses, and I couldn't find that in the course material. Try asking about a week, a topic, or what you'll build.",
    zh: '我只能回答 Bilal 的 AI-First 课程相关问题，课程资料里没有找到这个内容。你可以问某一周的内容、某个主题，或者你会做出什么。',
  },
  unsafe_reply: {
    en: `I don't want to give you wrong details on that. The site doesn't list pricing. The free workshop is on ${SCHEDULE.workshop.en}, and the next cohort starts on ${SCHEDULE.cohort.en}.`,
    zh: `这方面我不想给你错误的信息。网站没有公布价格。免费工作坊将于${SCHEDULE.workshop.zh}举行，下一期课程将于${SCHEDULE.cohort.zh}开课。`,
  },
}

export function reply(kind, lang) {
  return (REPLIES[kind] || REPLIES.offtopic)[lang === 'zh' ? 'zh' : 'en']
}

/** classify(text) → 'injection' | 'pricing' | 'dates' | 'greeting' | 'thanks' | null (null = answer with RAG) */
export function classify(text) {
  const t = (text || '').trim()
  if (INJECTION.test(t)) return 'injection'
  if (PRICING.test(t) && !RUNNING_COST.test(t)) return 'pricing'
  if (DATES.test(t)) return 'dates'
  if (GREETING.test(t)) return 'greeting'
  if (THANKS.test(t)) return 'thanks'
  return null
}

// After the model: block replies that state prices, money, dates or guarantees. Dates are blocked
// both ways round ("November 21", "21 November", 11月21日); the code-owned replies above state them.
const UNSAFE_REPLY = /[$€£¥]\s?\d|\b\d+\s?(usd|aud|dollars?)\b|\b(20\d\d)\b|\b(january|february|march|april|june|july|august|september|october|november|december)\s+\d|\b\d{1,2}(st|nd|rd|th)?\s+(of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\b|\bguarantee(d|s)?\b|\d+\s*[元块]|\d{1,2}\s*月\s*\d{1,2}\s*日|保证|包过/i

export function checkReply(text) {
  return !UNSAFE_REPLY.test(text || '')
}
