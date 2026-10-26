// Session language routing (English / 中文), modelled on Aurora's AgentRouter:
// the language persists across turns and changes only on an explicit request or a
// substantive utterance in the other language. "谢谢" or "ok" never flips it.
import { looksChinese } from './text.js'

export const LANGUAGES = {
  en: { name: 'English', locale: 'en-US' },
  zh: { name: 'Simplified Chinese (普通话)', locale: 'zh-CN' },
}

// Only explicit requests switch: "answer in Chinese", "switch to Mandarin". A question that merely
// mentions a language ("Is the course taught in Mandarin?") doesn't.
const TO_ZH = /\b(speak|reply|answer|talk|respond)\b(\s+\w+){0,3}\s+in\s+(chinese|mandarin)\b|\bswitch\b.{0,12}\b(to|into)\s+(chinese|mandarin)\b|(请|可以|能)?(用|说|讲)(中文|普通话|汉语)(回答|说|讲|交流)?|中文回答/i
const TO_EN = /\b(speak|reply|answer|talk|respond)\b(\s+\w+){0,3}\s+in\s+english\b|\bswitch\b.{0,12}\b(to|into)\s+english\b|(请|可以|能)?(用|说|讲)(英文|英语)(回答|说|讲|交流)?|英文回答/i

/**
 * route(text, current, sttLanguage?) → { language, locale, changed, reason }
 * sttLanguage is Whisper's detected language ("english", "chinese", ...) when the turn was spoken.
 */
export function route(text, current = 'en', sttLanguage) {
  const lang = current in LANGUAGES ? current : 'en'
  const t = (text || '').trim()
  let next = lang
  let reason = 'kept'
  if (TO_ZH.test(t)) { next = 'zh'; reason = 'explicit request' }
  else if (TO_EN.test(t)) { next = 'en'; reason = 'explicit request' }
  else {
    const { chinese, han } = looksChinese(t)
    const spoken = (sttLanguage || '').toLowerCase()
    const detected = chinese || spoken === 'chinese' || spoken === 'zh' ? 'zh' : han === 0 ? 'en' : lang
    // Short replies ("谢谢", "ok") don't flip the session; a real question does.
    const substantive = detected === 'zh' ? han >= 3 : t.split(/\s+/).filter(Boolean).length >= 4
    if (detected !== lang && substantive) { next = detected; reason = 'utterance language' }
  }
  return { language: next, locale: LANGUAGES[next].locale, changed: next !== lang, reason }
}
