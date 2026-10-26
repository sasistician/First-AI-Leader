// Browser side of the voice agent, modelled on the Aurora workshop's talk.js:
// adaptive noise-floor calibration, automatic turn endpointing, pre-roll so the first word
// isn't clipped, barge-in while the agent is speaking, and 16 kHz WAV for speech-to-text.

export type Lang = 'en' | 'zh'

export interface ListenerOptions {
  onTurn: (wav: Blob, seconds: number) => void
  onSpeechStart?: () => void
  onLevel?: (level: number, threshold: number) => void
  endpointMs?: number // silence that ends a turn
  maxTurnMs?: number
  sensitivity?: number // threshold as a multiple of the noise floor
}

const TARGET_RATE = 16000
const PRE_ROLL_MS = 400
const MIN_SPEECH_MS = 350

export class MicListener {
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private node: ScriptProcessorNode | null = null
  private opts: Required<Omit<ListenerOptions, 'onSpeechStart' | 'onLevel'>> & ListenerOptions
  private preRoll: Float32Array[] = []
  private frames: Float32Array[] = []
  private floor = 0.004
  private calibrationLeftMs = 800
  private speechRun = 0
  private silenceMs = 0
  private turnMs = 0
  private speechMs = 0
  private recording = false
  private agentSpeaking = false
  paused = false

  constructor(opts: ListenerOptions) {
    this.opts = { endpointMs: 900, maxTurnMs: 15000, sensitivity: 3, ...opts }
  }

  set endpointMs(ms: number) { this.opts.endpointMs = ms }
  set sensitivity(x: number) { this.opts.sensitivity = x }

  // While the agent talks, require louder, longer speech so its own voice doesn't trigger a barge-in.
  setAgentSpeaking(on: boolean) {
    this.agentSpeaking = on
    this.speechRun = 0
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    })
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new Ctx()
    this.source = this.ctx.createMediaStreamSource(this.stream)
    this.node = this.ctx.createScriptProcessor(2048, 1, 1)
    this.node.onaudioprocess = (e) => this.process(e.inputBuffer.getChannelData(0))
    this.source.connect(this.node)
    this.node.connect(this.ctx.destination) // required for onaudioprocess to fire; output is silent
  }

  stop() {
    this.node?.disconnect()
    this.source?.disconnect()
    this.stream?.getTracks().forEach((t) => t.stop())
    void this.ctx?.close()
    this.ctx = this.stream = this.source = this.node = null
    this.reset()
  }

  get calibrated() { return this.calibrationLeftMs <= 0 }

  private reset() {
    this.frames = []
    this.recording = false
    this.speechRun = this.silenceMs = this.turnMs = this.speechMs = 0
  }

  private process(input: Float32Array) {
    if (!this.ctx) return
    const frame = new Float32Array(input) // copy: the buffer is reused
    const ms = (frame.length / this.ctx.sampleRate) * 1000
    let sum = 0
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i]
    const rms = Math.sqrt(sum / frame.length)

    if (this.calibrationLeftMs > 0) {
      this.floor = this.floor * 0.8 + rms * 0.2
      this.calibrationLeftMs -= ms
      return
    }
    const factor = this.agentSpeaking ? this.opts.sensitivity * 1.8 : this.opts.sensitivity
    const threshold = Math.max(this.floor * factor, this.agentSpeaking ? 0.03 : 0.012)
    this.opts.onLevel?.(rms, threshold)
    if (this.paused) return

    if (!this.recording) {
      this.preRoll.push(frame)
      while (this.preRoll.length * ms > PRE_ROLL_MS) this.preRoll.shift()
      if (rms > threshold) {
        this.speechRun += ms
        if (this.speechRun >= (this.agentSpeaking ? 260 : 120)) {
          this.recording = true
          this.frames = [...this.preRoll]
          this.turnMs = this.speechMs = this.speechRun
          this.silenceMs = 0
          this.opts.onSpeechStart?.()
        }
      } else {
        this.speechRun = 0
        this.floor = this.floor * 0.97 + rms * 0.03 // track slow changes in room noise
      }
      return
    }

    this.frames.push(frame)
    this.turnMs += ms
    if (rms > threshold * 0.8) { this.silenceMs = 0; this.speechMs += ms } else this.silenceMs += ms
    if (this.silenceMs >= this.opts.endpointMs || this.turnMs >= this.opts.maxTurnMs) {
      const frames = this.frames
      const speechMs = this.speechMs
      const rate = this.ctx.sampleRate
      this.reset()
      this.preRoll = []
      if (speechMs < MIN_SPEECH_MS) return // a cough or a click, not a turn
      const pcm = downsample(concat(frames), rate, TARGET_RATE)
      this.opts.onTurn(encodeWav(pcm, TARGET_RATE), pcm.length / TARGET_RATE)
    }
  }
}

function concat(frames: Float32Array[]) {
  const out = new Float32Array(frames.reduce((n, f) => n + f.length, 0))
  let o = 0
  for (const f of frames) { out.set(f, o); o += f.length }
  return out
}

function downsample(input: Float32Array, from: number, to: number) {
  if (from === to) return input
  const ratio = from / to
  const out = new Float32Array(Math.floor(input.length / ratio))
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio)
    const end = Math.min(Math.floor((i + 1) * ratio), input.length)
    let s = 0
    for (let j = start; j < end; j++) s += input[j]
    out[i] = s / Math.max(1, end - start) // average = simple low-pass
  }
  return out
}

function encodeWav(pcm: Float32Array, rate: number) {
  const buf = new ArrayBuffer(44 + pcm.length * 2)
  const v = new DataView(buf)
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  str(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); str(8, 'WAVE')
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  str(36, 'data'); v.setUint32(40, pcm.length * 2, true)
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]))
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Blob([buf], { type: 'audio/wav' })
}

// ---------- speaking (browser voices, the no-cost TTS_BACKEND=system path) ----------

const NOVELTY = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Wobble|Zarvox|Whisper|Trinoids|Organ|Jester|Superstar|Good News|Hysterical|Ralph|Fred|Junior|Kathy|Grandma|Grandpa|Rocko|Shelley|Flo|Eddy|Reed|Sandy/

export function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null
  const want = lang === 'zh' ? ['zh-CN', 'zh-TW', 'zh-HK'] : ['en-US', 'en-GB', 'en-AU']
  const score = (v: SpeechSynthesisVoice) =>
    (/Premium/.test(v.name) ? 40 : /Enhanced/.test(v.name) ? 30 : 0) + (/^Google/.test(v.name) ? 20 : 0) +
    (/Samantha|Karen|Daniel|Tingting|Meijia/.test(v.name) ? 5 : 0) + (3 - Math.max(0, want.indexOf(v.lang.replace('_', '-'))))
  const voices = speechSynthesis.getVoices().filter((v) => !NOVELTY.test(v.name) && v.lang.replace('_', '-').startsWith(lang))
  return voices.sort((a, b) => score(b) - score(a))[0] || null
}

/** speak(text, lang, { onStart, onEnd }) → cancel function */
export function speak(text: string, lang: Lang, cb: { onStart?: () => void; onEnd?: () => void } = {}) {
  if (!('speechSynthesis' in window) || !text) { cb.onEnd?.(); return () => {} }
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const voice = pickVoice(lang)
  if (voice) { u.voice = voice; u.lang = voice.lang } else u.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
  let done = false
  const finish = () => { if (!done) { done = true; cb.onEnd?.() } }
  u.onstart = () => cb.onStart?.()
  u.onend = finish
  u.onerror = finish
  speechSynthesis.speak(u)
  return () => { speechSynthesis.cancel(); finish() }
}
