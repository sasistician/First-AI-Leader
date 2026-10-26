// Deterministic guardrails that run outside the model, before and after it.
// Rules the model can't talk its way around: no invented prices or dates, no prompt
// injection, course topics only.

const INJECTION = /ignore (all |any |the )?(previous|prior|above|earlier) (instructions|rules|prompts?)|system prompt|developer (message|prompt)|reveal (your|the) (instructions|prompt)|you are now|jailbreak|pretend (to be|you are)|act as (an? )?(unrestricted|different)|忽略(之前|以上|前面)?的?(所有)?(指令|指示|规则)|系统提示|提示词/i
// Only questions about what the course costs. "How much context…" or "token cost" are course content.
const PRICING = /\b(price|prices|pricing|tuition|fees?|discount|refund|payment)\b|\bhow much (is|does|will|would) (it|this|that|the (course|program|cohort|class))\b|\bhow much\b.{0,25}\b(costs?|charge|pay)\b|\b(course|program|cohort|class|it)\s+costs?\b|\bcosts? of (the |this )?(course|program|cohort|class)\b|价格|多少钱|费用|学费|优惠|折扣|退款|付款/i
const DATES = /\b(start date|when (does|will|is) (it|the (course|cohort|program)|the next)|next cohort|enrol(l)?ment (deadline|date)|deadline|what date|which date|upcoming cohort)\b|什么时候(开始|开课|上课)|开课(时间|日期)|下一期|截止/i
const GREETING = /^\s*(hi|hello|hey|good (morning|afternoon|evening)|你好|您好|嗨|哈喽)[\s!.,。！]*$/i
const THANKS = /^\s*(thanks|thank you|cheers|ok(ay)?|great|cool|谢谢|好的|明白了?)[\s!.,。！]*$/i

const REPLIES = {
  injection: {
    en: "I can only help with questions about Bilal's courses, so I'll stay on that. What would you like to know about the program?",
    zh: '我只能回答与 Bilal 课程相关的问题。你想了解课程的哪些内容？',
  },
  pricing: {
    en: "The site doesn't list pricing or dates yet. You can register your interest at sasistician.com, and Bilal will be in touch about the next cohort.",
    zh: '网站目前还没有公布价格或日期。你可以在 sasistician.com 登记意向，Bilal 会就下一期课程与你联系。',
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
    en: "I don't want to give you wrong details on that. The site doesn't list pricing or dates; register your interest at sasistician.com for the latest.",
    zh: '这方面我不想给你错误的信息。网站没有公布价格或日期，请在 sasistician.com 登记意向以获取最新消息。',
  },
}

export function reply(kind, lang) {
  return (REPLIES[kind] || REPLIES.offtopic)[lang === 'zh' ? 'zh' : 'en']
}

/** classify(text) → 'injection' | 'pricing' | 'greeting' | 'thanks' | null (null = answer with RAG) */
export function classify(text) {
  const t = (text || '').trim()
  if (INJECTION.test(t)) return 'injection'
  if (PRICING.test(t) || DATES.test(t)) return 'pricing'
  if (GREETING.test(t)) return 'greeting'
  if (THANKS.test(t)) return 'thanks'
  return null
}

// After the model: block replies that state prices, money, dates or guarantees.
const UNSAFE_REPLY = /[$€£¥]\s?\d|\b\d+\s?(usd|aud|dollars?)\b|\b(20\d\d)\b|\b(january|february|march|april|june|july|august|september|october|november|december)\s+\d|\bguarantee(d|s)?\b|\d+\s*[元块]|保证|包过/i

export function checkReply(text) {
  return !UNSAFE_REPLY.test(text || '')
}
