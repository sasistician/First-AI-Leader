import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Send, Volume2, VolumeX, ExternalLink } from 'lucide-react'
import { MicListener, speak, playSegments, type Lang } from '../lib/voice'

type Source = { title: string; section: string; url: string | null; program: string; lang: string }
type Timings = { stt?: number; retrieval?: number; llm?: number; tts?: number; total?: number; server?: number }
type Message = { id: number; role: 'user' | 'agent'; text: string; sources?: Source[]; policy?: string; lang?: Lang }
type Status = 'idle' | 'starting' | 'listening' | 'hearing' | 'thinking' | 'speaking'

const SUGGESTIONS: Record<Lang, string[]> = {
  en: ['Do I need to know how to code?', 'What will I build in week 1?', 'What is MCP?', 'Who teaches the course?'],
  zh: ['我需要会写代码吗？', '第四周讲什么？', '什么是 MCP？', '谁来教这门课？'],
}

const STATUS_TEXT: Record<Status, Record<Lang, string>> = {
  idle: { en: 'Tap the mic and ask a question', zh: '点击麦克风开始提问' },
  starting: { en: 'Calibrating to your room…', zh: '正在适应环境噪音…' },
  listening: { en: 'Listening. Ask anything about the course', zh: '正在聆听，请提问' },
  hearing: { en: 'Hearing you…', zh: '正在听…' },
  thinking: { en: 'Thinking…', zh: '思考中…' },
  speaking: { en: 'Speaking. Talk to interrupt', zh: '正在回答，说话即可打断' },
}

let nextId = 1
const now = () => performance.now()

// compact: the smaller layout used in the home page's "Talk to AI" overlay.
export default function VoiceAgent({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>('idle')
  const [voiceLabel, setVoiceLabel] = useState('')
  const [lang, setLang] = useState<Lang>('en')
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [speakReplies, setSpeakReplies] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<string>('')
  const [timings, setTimings] = useState<Timings & { firstAudio?: number }>({})
  const [bargeIns, setBargeIns] = useState(0)
  const [level, setLevel] = useState(0)
  const [endpointMs, setEndpointMs] = useState(900)

  const listener = useRef<MicListener | null>(null)
  const cancelSpeech = useRef<() => void>(() => {})
  const statusRef = useRef<Status>('idle')
  const langRef = useRef<Lang>('en')
  const history = useRef<{ role: string; content: string }[]>([])
  const scroller = useRef<HTMLDivElement>(null)

  const setStat = (s: Status) => { statusRef.current = s; setStatus(s) }
  useEffect(() => { langRef.current = lang }, [lang])
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    fetch('/api/voice-agent').then((r) => r.json()).then((j) => setMode(j.mode || '')).catch(() => setMode('offline'))
    speechSynthesis?.getVoices() // start loading voices early (Chrome loads them lazily)
    return () => { listener.current?.stop(); cancelSpeech.current() }
  }, [])
  useEffect(() => { if (listener.current) listener.current.endpointMs = endpointMs }, [endpointMs])

  async function sendTurn(input: { wav?: Blob; text?: string }) {
    const turnEnded = now()
    setStat('thinking')
    setError('')
    if (listener.current) listener.current.paused = true
    try {
      const form = new FormData()
      if (input.wav) form.append('audio', input.wav, 'turn.wav')
      if (input.text) form.append('text', input.text)
      form.append('state', JSON.stringify({ language: langRef.current, history: history.current.slice(-4) }))
      if (speakReplies) form.append('speak', '1') // ask the server for natural-voice audio (English)
      const res = await fetch('/api/voice-agent', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.message || 'Something went wrong.')
      if (data.empty) { resume(); return }
      setMode(data.mode)
      const turnLang: Lang = data.language === 'zh' ? 'zh' : 'en'
      setLang(turnLang)
      langRef.current = turnLang
      setMessages((m) => [...m,
        { id: nextId++, role: 'user', text: data.transcript },
        { id: nextId++, role: 'agent', text: data.reply, sources: data.sources, policy: data.policy, lang: turnLang }])
      history.current = [...history.current, { role: 'user', content: data.transcript }, { role: 'assistant', content: data.reply }].slice(-8)
      setTimings(data.timings || {})
      if (speakReplies) {
        setStat('speaking')
        if (listener.current) { listener.current.paused = false; listener.current.setAgentSpeaking(true) }
        const callbacks = {
          onStart: () => setTimings((t) => ({ ...t, firstAudio: Math.round(now() - turnEnded) })),
          onEnd: () => { listener.current?.setAgentSpeaking(false); if (statusRef.current === 'speaking') resume() },
        }
        const browserVoice = () => {
          setVoiceLabel(t('Browser voice', '浏览器语音'))
          cancelSpeech.current = speak(data.reply, turnLang, callbacks)
        }
        if (data.audio?.segments?.length) {
          // Natural voice from the server (Groq Orpheus); the browser voice steps in if playback fails.
          setVoiceLabel(`Groq Orpheus · ${data.audio.voice}`)
          cancelSpeech.current = playSegments(data.audio.segments, { ...callbacks, onError: browserVoice })
        } else browserVoice()
      } else resume()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      resume()
    }
  }

  function resume() {
    if (listener.current) { listener.current.paused = false; setStat('listening') } else setStat('idle')
  }

  async function startMic() {
    setError('')
    setStat('starting')
    try {
      const l = new MicListener({
        endpointMs,
        onLevel: (rms, threshold) => setLevel(Math.min(1, rms / (threshold * 2))),
        onSpeechStart: () => {
          if (statusRef.current === 'speaking') { // barge-in: stop talking, listen
            cancelSpeech.current()
            setBargeIns((n) => n + 1)
          }
          setStat('hearing')
        },
        onTurn: (wav) => void sendTurn({ wav }),
      })
      await l.start()
      listener.current = l
      setTimeout(() => { if (statusRef.current === 'starting') setStat('listening') }, 900)
    } catch {
      setError(langRef.current === 'zh' ? '无法使用麦克风，请检查浏览器权限，或直接输入问题。' : 'Microphone unavailable. Check browser permissions, or type your question instead.')
      setStat('idle')
    }
  }

  function stopMic() {
    listener.current?.stop()
    listener.current = null
    cancelSpeech.current()
    setStat('idle')
    setLevel(0)
  }

  function submitText(q: string) {
    const question = q.trim()
    if (!question || statusRef.current === 'thinking') return
    cancelSpeech.current()
    setText('')
    void sendTurn({ text: question })
  }

  const live = status !== 'idle'
  const t = (en: string, zh: string) => (lang === 'zh' ? zh : en)

  return (
    <div className={`${compact ? '' : 'liquid-glass rounded-3xl p-6 md:p-8'} text-white`}>
      <div className={`flex ${compact ? 'flex-row items-center justify-between gap-3' : 'flex-col md:flex-row md:items-center gap-6'}`}>
        {!compact && (
          <button
            onClick={live ? stopMic : startMic}
            aria-label={live ? t('Stop the microphone', '关闭麦克风') : t('Start talking', '开始说话')}
            className={`relative shrink-0 w-24 h-24 rounded-full flex items-center justify-center transition-colors ${live ? 'bg-white text-black' : 'liquid-glass hover:bg-white/5'}`}
          >
            {live && (
              <span className="absolute inset-0 rounded-full border border-white/60" style={{ transform: `scale(${1 + level * 0.35})`, transition: 'transform 80ms linear' }} />
            )}
            {live ? <MicOff size={30} /> : <Mic size={30} />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className={compact ? 'text-white/70 text-sm' : 'text-2xl md:text-3xl'} style={compact ? undefined : { fontFamily: "'Instrument Serif', serif" }}>
            {compact && status === 'idle' ? t('Speak or type your question', '说出或输入你的问题') : STATUS_TEXT[status][lang]}
          </p>
          {!compact && (
            <p className="text-white/50 text-sm mt-1">
              {t('Answers come from the course decks, lab guides and homepage. English replies use a natural AI voice; 中文 uses your browser\'s voice.', '回答来自课程讲义、实验指南和网站首页。英文回答使用自然的 AI 语音，中文回答使用浏览器语音。')}
            </p>
          )}
        </div>
        <div className={`flex items-center gap-2 ${compact ? '' : 'self-start md:self-center'}`}>
          <div className="liquid-glass rounded-full p-1 flex text-sm" role="radiogroup" aria-label="Language">
            {(['en', 'zh'] as Lang[]).map((l) => (
              <button key={l} role="radio" aria-checked={lang === l} onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-full ${lang === l ? 'bg-white/15 text-white' : 'text-white/60'}`}>
                {l === 'en' ? 'EN' : '中文'}
              </button>
            ))}
          </div>
          <button onClick={() => { setSpeakReplies((s) => !s); cancelSpeech.current() }} aria-pressed={speakReplies}
            aria-label={t('Speak replies', '朗读回答')} className="liquid-glass rounded-full p-2 text-white/80 hover:text-white">
            {speakReplies ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>

      {compact && (
        <button
          onClick={live ? stopMic : startMic}
          className={`mt-4 w-full rounded-full py-3.5 flex items-center justify-center gap-2.5 font-medium transition-colors ${live ? 'border border-white/25 bg-white/10 hover:bg-white/15 text-white' : 'bg-white text-black hover:bg-white/90'}`}
        >
          {live ? (
            <>
              <span className="relative flex w-3 h-3" aria-hidden="true">
                <span className="absolute inset-0 rounded-full bg-red-400" style={{ transform: `scale(${1 + level * 1.2})`, opacity: 0.45, transition: 'transform 80ms linear' }} />
                <span className="relative w-3 h-3 rounded-full bg-red-400" />
              </span>
              {t('Stop talking', '停止说话')}
            </>
          ) : (
            <>
              <Mic size={18} />
              {t('Click here to talk', '点击这里开始说话')}
            </>
          )}
        </button>
      )}

      {mode === 'mock' && (
        <p className="mt-5 text-amber-300/90 text-sm">
          Demo mode: no API key is configured, so voice input is off and answers quote the best-matching course excerpt.
        </p>
      )}
      {error && <p className="mt-5 text-red-300 text-sm" role="alert">{error}</p>}

      <div ref={scroller} className={`${compact ? 'mt-4 max-h-[42vh]' : 'mt-6 max-h-[420px]'} overflow-y-auto space-y-4 pr-1`} aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS[lang].slice(0, compact ? 3 : 4).map((s) => (
              <button key={s} onClick={() => submitText(s)} className="liquid-glass rounded-full px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-white/10' : 'liquid-glass'}`}>
              <p className="text-white/95 leading-relaxed">{m.text}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.sources.slice(0, 3).map((s) => {
                    const label = `${s.title.replace(/^AI-First Engineer · /, 'Engineer · ').replace(/^The AI-First Leader · /, 'Leader · ')} — ${s.section.slice(0, 40)}`
                    return s.url ? (
                      <a key={label} href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white border border-white/15 rounded-full px-3 py-1">
                        {label} <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span key={label} className="text-xs text-white/50 border border-white/10 rounded-full px-3 py-1">{label}</span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submitText(text) }} className="mt-5 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500}
          placeholder={t('Or type a question…', '或者输入问题…')} aria-label={t('Type a question', '输入问题')}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30" />
        <button type="submit" disabled={!text.trim() || status === 'thinking'} aria-label={t('Send', '发送')}
          className="liquid-glass rounded-full px-5 text-white disabled:opacity-40 hover:bg-white/5">
          <Send size={18} />
        </button>
      </form>

      {!compact && (
      <details className="mt-6 text-sm text-white/60">
        <summary className="cursor-pointer hover:text-white">{t('Under the hood', '技术细节')}</summary>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Speech-to-text', timings.stt], ['Retrieval', timings.retrieval], ['Language model', timings.llm],
            ['Text-to-speech', timings.tts], ['Server total', timings.server], ['To first audio', timings.firstAudio],
          ].map(([label, v]) => (
            <div key={label as string} className="liquid-glass rounded-xl px-3 py-2">
              <div className="text-white/45 text-xs">{label}</div>
              <div className="text-white text-lg">{typeof v === 'number' ? `${v} ms` : '—'}</div>
            </div>
          ))}
          <div className="liquid-glass rounded-xl px-3 py-2">
            <div className="text-white/45 text-xs">Barge-ins</div>
            <div className="text-white text-lg">{bargeIns}</div>
          </div>
          <div className="liquid-glass rounded-xl px-3 py-2">
            <div className="text-white/45 text-xs">Voice</div>
            <div className="text-white text-sm mt-1">{voiceLabel || '—'}</div>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-3">
          <span className="whitespace-nowrap">End-of-turn silence</span>
          <input type="range" min={500} max={1600} step={100} value={endpointMs} onChange={(e) => setEndpointMs(Number(e.target.value))} className="flex-1" />
          <span className="w-16 text-right">{endpointMs} ms</span>
        </label>
        <p className="mt-3 text-white/45">
          Pipeline: your browser detects the end of your turn → Groq Whisper transcribes it → keyword search over the course
          material → Groq gpt-oss-120b answers under guardrails (no prices, dates or invented facts) → Groq Orpheus speaks English
          replies (your browser&apos;s voice speaks 中文, or steps in if Orpheus is unavailable). {mode && `Mode: ${mode}.`}
        </p>
      </details>
      )}
    </div>
  )
}
