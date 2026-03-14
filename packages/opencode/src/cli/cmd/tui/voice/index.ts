import { spawn, type ChildProcess } from "child_process"
import { Auth } from "@/auth"
import { Log } from "@/util/log"

const log = Log.create({ service: "voice" })

export interface VoiceConfig {
  provider?: string
  apiKey?: string
  model?: string
  language?: string
}

interface STTProvider {
  connect(apiKey: string, opts: { language: string; model: string }): Promise<void>
  sendAudio(chunk: Buffer): void
  onDelta(cb: (text: string) => void): void
  disconnect(): void
}

// ─── OpenAI Realtime provider ───────────────────────────────────────────────

class OpenAIProvider implements STTProvider {
  private ws: WebSocket | null = null
  private deltaCallback: ((text: string) => void) | null = null

  async connect(apiKey: string, opts: { language: string; model: string }): Promise<void> {
    const url = `wss://api.openai.com/v1/realtime?intent=transcription`
    this.ws = new WebSocket(url, {
      // @ts-ignore - Bun WebSocket headers
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "openai-beta": "realtime=v1",
      },
    })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("WebSocket connection timeout")), 10000)

      this.ws!.addEventListener("open", () => {
        clearTimeout(timeout)
        // Configure transcription session
        this.ws!.send(
          JSON.stringify({
            type: "transcription_session.update",
            session: {
              input_audio_format: "pcm16",
              input_audio_transcription: {
                model: opts.model,
                language: opts.language,
              },
              turn_detection: {
                type: "server_vad",
                silence_duration_ms: 500,
              },
            },
          }),
        )
        resolve()
      })

      this.ws!.addEventListener("error", (err) => {
        clearTimeout(timeout)
        reject(err)
      })

      this.ws!.addEventListener("message", (evt) => {
        try {
          const msg = JSON.parse(evt.data as string)
          if (msg.type === "conversation.item.input_audio_transcription.delta" && msg.delta) {
            this.deltaCallback?.(msg.delta)
          }
        } catch {
          // ignore parse errors
        }
      })
    })
  }

  sendAudio(chunk: Buffer): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    this.ws.send(
      JSON.stringify({
        type: "input_audio_buffer.append",
        audio: chunk.toString("base64"),
      }),
    )
  }

  onDelta(cb: (text: string) => void): void {
    this.deltaCallback = cb
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.deltaCallback = null
  }
}

// ─── Deepgram provider ───────────────────────────────────────────────────────

class DeepgramProvider implements STTProvider {
  private ws: WebSocket | null = null
  private deltaCallback: ((text: string) => void) | null = null

  async connect(apiKey: string, opts: { language: string; model: string }): Promise<void> {
    const model = opts.model || "nova-2"
    const url = `wss://api.deepgram.com/v1/listen?model=${model}&language=${opts.language}&encoding=linear16&sample_rate=24000&channels=1`
    this.ws = new WebSocket(url, {
      // @ts-ignore
      headers: { Authorization: `Token ${apiKey}` },
    })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Deepgram WebSocket timeout")), 10000)
      this.ws!.addEventListener("open", () => {
        clearTimeout(timeout)
        resolve()
      })
      this.ws!.addEventListener("error", (err) => {
        clearTimeout(timeout)
        reject(err)
      })
      this.ws!.addEventListener("message", (evt) => {
        try {
          const msg = JSON.parse(evt.data as string)
          const transcript = msg?.channel?.alternatives?.[0]?.transcript
          if (transcript) this.deltaCallback?.(transcript + " ")
        } catch {
          // ignore
        }
      })
    })
  }

  sendAudio(chunk: Buffer): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    this.ws.send(chunk)
  }

  onDelta(cb: (text: string) => void): void {
    this.deltaCallback = cb
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.deltaCallback = null
  }
}

// ─── AssemblyAI provider ─────────────────────────────────────────────────────

class AssemblyAIProvider implements STTProvider {
  private ws: WebSocket | null = null
  private deltaCallback: ((text: string) => void) | null = null

  async connect(apiKey: string, _opts: { language: string; model: string }): Promise<void> {
    const url = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=24000`
    this.ws = new WebSocket(url, {
      // @ts-ignore
      headers: { Authorization: apiKey },
    })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("AssemblyAI WebSocket timeout")), 10000)
      this.ws!.addEventListener("open", () => {
        clearTimeout(timeout)
        resolve()
      })
      this.ws!.addEventListener("error", (err) => {
        clearTimeout(timeout)
        reject(err)
      })
      this.ws!.addEventListener("message", (evt) => {
        try {
          const msg = JSON.parse(evt.data as string)
          if (msg.message_type === "PartialTranscript" && msg.text) {
            // Only emit complete words
          } else if (msg.message_type === "FinalTranscript" && msg.text) {
            this.deltaCallback?.(msg.text + " ")
          }
        } catch {
          // ignore
        }
      })
    })
  }

  sendAudio(chunk: Buffer): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    this.ws.send(chunk.toString("base64"))
  }

  onDelta(cb: (text: string) => void): void {
    this.deltaCallback = cb
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.deltaCallback = null
  }
}

// ─── Groq provider (HTTP chunks pseudo-streaming) ────────────────────────────

class GroqProvider implements STTProvider {
  private apiKey = ""
  private opts: { language: string; model: string } = { language: "en", model: "whisper-large-v3-turbo" }
  private deltaCallback: ((text: string) => void) | null = null
  private buffer: Buffer[] = []
  private interval: ReturnType<typeof setInterval> | null = null
  private stopped = false

  async connect(apiKey: string, opts: { language: string; model: string }): Promise<void> {
    this.apiKey = apiKey
    this.opts = { language: opts.language, model: opts.model || "whisper-large-v3-turbo" }
    this.stopped = false
    // Flush every 2 seconds
    this.interval = setInterval(() => this.flush(), 2000)
  }

  sendAudio(chunk: Buffer): void {
    this.buffer.push(chunk)
  }

  onDelta(cb: (text: string) => void): void {
    this.deltaCallback = cb
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0 || this.stopped) return
    const combined = Buffer.concat(this.buffer)
    this.buffer = []
    if (combined.length < 1600) return // Skip very short chunks (< ~33ms at 24kHz)

    try {
      const formData = new FormData()
      // Convert raw PCM16 to a WAV blob for Groq
      const wav = pcm16ToWav(combined, 24000)
      formData.append("file", new Blob([wav.buffer as ArrayBuffer], { type: "audio/wav" }), "audio.wav")
      formData.append("model", this.opts.model)
      formData.append("language", this.opts.language)
      formData.append("response_format", "json")

      const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}` },
        body: formData,
      })
      if (resp.ok) {
        const data = (await resp.json()) as { text?: string }
        if (data.text?.trim()) {
          this.deltaCallback?.(data.text.trim() + " ")
        }
      }
    } catch (err) {
      log.warn("Groq transcription error", { err })
    }
  }

  disconnect(): void {
    this.stopped = true
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.buffer = []
    this.deltaCallback = null
  }
}

// ─── PCM16 → WAV helper ──────────────────────────────────────────────────────

function pcm16ToWav(pcmData: Buffer, sampleRate: number): Buffer {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataSize = pcmData.length
  const headerSize = 44
  const buf = Buffer.alloc(headerSize + dataSize)

  buf.write("RIFF", 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write("WAVE", 8)
  buf.write("fmt ", 12)
  buf.writeUInt32LE(16, 16) // PCM chunk size
  buf.writeUInt16LE(1, 20) // PCM format
  buf.writeUInt16LE(numChannels, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(byteRate, 28)
  buf.writeUInt16LE(blockAlign, 32)
  buf.writeUInt16LE(bitsPerSample, 34)
  buf.write("data", 36)
  buf.writeUInt32LE(dataSize, 40)
  pcmData.copy(buf, 44)
  return buf
}

// ─── Provider factory ─────────────────────────────────────────────────────────

function createProvider(name: string): STTProvider {
  switch (name) {
    case "openai":
      return new OpenAIProvider()
    case "deepgram":
      return new DeepgramProvider()
    case "assemblyai":
      return new AssemblyAIProvider()
    case "groq":
      return new GroqProvider()
    default:
      return new OpenAIProvider()
  }
}

// ─── Platform ffmpeg helpers ──────────────────────────────────────────────────

async function detectDshowAudioDevice(): Promise<string | null> {
  log.info("dshow detecting audio devices")
  return new Promise((resolve) => {
    let resolved = false
    const proc = spawn("ffmpeg", ["-list_devices", "true", "-f", "dshow", "-i", "dummy"], {
      stdio: ["ignore", "ignore", "pipe"],
    })

    // 5 second timeout in case ffmpeg hangs
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        proc.kill()
        log.warn("dshow device detection timed out")
        resolve(null)
      }
    }, 5000)

    let stderr = ""
    proc.stderr?.on("data", (d: Buffer) => (stderr += d.toString()))
    proc.on("close", () => {
      if (resolved) return
      resolved = true
      clearTimeout(timer)
      // Find first line with (audio) — format: [dshow ...] "Device Name" (audio)
      const lines = stderr.split(/\r?\n/)
      for (const line of lines) {
        if (/\(audio\)/i.test(line)) {
          const match = line.match(/"([^"]+)"/)
          if (match?.[1]) {
            resolve(match[1])
            return
          }
        }
      }
      resolve(null)
    })

    proc.on("error", (err) => {
      if (resolved) return
      resolved = true
      clearTimeout(timer)
      log.warn("dshow detection error", { err: err.message })
      resolve(null)
    })
  })
}

async function buildFfmpegArgs(): Promise<string[]> {
  const platform = process.platform
  if (platform === "win32") {
    const device = await detectDshowAudioDevice()
    if (!device) throw new Error("No audio input device found. Check that a microphone is connected.")
    log.info("ffmpeg dshow device", { device })
    return ["-f", "dshow", "-i", `audio=${device}`, "-ar", "24000", "-ac", "1", "-f", "s16le", "pipe:1"]
  }
  if (platform === "darwin") {
    return ["-f", "avfoundation", "-i", ":0", "-ar", "24000", "-ac", "1", "-f", "s16le", "pipe:1"]
  }
  // Linux
  return ["-f", "alsa", "-i", "default", "-ar", "24000", "-ac", "1", "-f", "s16le", "pipe:1"]
}

// ─── VoiceRecorder ────────────────────────────────────────────────────────────

// RMS energy of a PCM16-LE buffer, normalized to 0–1.
// Low noise floor (~50-200 RMS) maps to ~0.05-0.12 (yellow/warning zone).
// Normal speech (~500-3000 RMS) maps to ~0.2-0.6 (green zone).
// Loud speech/clipping (~5000+) maps to ~0.7+ (red zone).
function audioLevel(buf: Buffer): number {
  const samples = buf.length >> 1
  if (samples === 0) return 0
  let sum = 0
  for (let i = 0; i < buf.length; i += 2) {
    const s = buf.readInt16LE(i)
    sum += s * s
  }
  const rms = Math.sqrt(sum / samples)
  return Math.min(1, Math.log1p(rms) / Math.log1p(10000))
}

export class VoiceRecorder {
  private provider: STTProvider
  private proc: ChildProcess | null = null
  private onTranscript: (text: string) => void
  private onLevel: ((level: number) => void) | null = null
  private lastLevelTime = 0
  private peakLevel = 0

  constructor(
    private config: VoiceConfig,
    onTranscript: (text: string) => void,
    onLevel?: (level: number) => void,
  ) {
    this.provider = createProvider(config.provider ?? "openai")
    this.onTranscript = onTranscript
    this.onLevel = onLevel ?? null
  }

  async start(onError?: (err: string) => void): Promise<void> {
    // Resolve provider and API key
    const providerName = this.config.provider ?? (await this.autoDetectProvider())
    if (!providerName) {
      onError?.("No voice provider configured and no API key found. Configure a provider in opencode.json.")
      return
    }
    this.provider = createProvider(providerName)

    const apiKey = await this.getApiKey(providerName)
    if (!apiKey) {
      onError?.(`No API key found for provider "${providerName}". Configure it with /auth.`)
      return
    }

    const language = this.config.language ?? "en"
    const model = this.config.model ?? this.defaultModel(providerName)

    try {
      await this.provider.connect(apiKey, { language, model })
    } catch (err) {
      onError?.(`Failed to connect to ${providerName}: ${err}`)
      return
    }

    this.provider.onDelta((text) => this.onDelta(text))

    // Launch ffmpeg
    let args: string[]
    try {
      args = await buildFfmpegArgs()
    } catch (err) {
      onError?.(`${err}`)
      this.provider.disconnect()
      return
    }
    log.info("ffmpeg", { args: args.join(" ") })

    try {
      this.proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] })
    } catch {
      onError?.("ffmpeg not found. Please install ffmpeg and make sure it is in your PATH.")
      this.provider.disconnect()
      return
    }

    this.proc.on("error", (err) => {
      onError?.(`ffmpeg error: ${err.message}`)
      this.stop()
    })

    this.proc.on("exit", (code) => {
      if (code !== null && code !== 0) {
        log.warn("ffmpeg exited", { code })
      }
    })

    let ffmpegStderr = ""
    this.proc.stderr?.on("data", (d: Buffer) => {
      ffmpegStderr += d.toString()
      // Log only errors / device lines
      const line = d.toString().trim()
      if (line) log.info("ffmpeg stderr", { line: line.slice(0, 200) })
    })

    this.proc.stdout?.on("data", (chunk: Buffer) => {
      this.provider.sendAudio(chunk)
      const lvl = audioLevel(chunk)
      if (lvl > this.peakLevel) this.peakLevel = lvl
      const now = Date.now()
      if (now - this.lastLevelTime >= 50) {
        this.lastLevelTime = now
        this.onLevel?.(this.peakLevel)
        this.peakLevel = 0
      }
    })
  }

  async stop(): Promise<void> {
    this.provider.disconnect()
    if (this.proc) {
      this.proc.kill("SIGTERM")
      this.proc = null
    }
  }

  private onDelta(text: string): void {
    this.onTranscript(text)
  }

  private async getApiKey(providerName: string): Promise<string | undefined> {
    // 1. Explicit key in tui.json voice.apiKey (highest priority)
    if (this.config.apiKey) return this.config.apiKey

    // 2. Environment variables
    const envMap: Record<string, string> = {
      openai: "OPENAI_API_KEY",
      deepgram: "DEEPGRAM_API_KEY",
      assemblyai: "ASSEMBLYAI_API_KEY",
      groq: "GROQ_API_KEY",
    }
    const envKey = process.env[envMap[providerName] ?? ""]
    if (envKey) return envKey

    // 3. Opencode auth store — only accept real API keys (not OAuth JWTs)
    try {
      const info = await Auth.get(providerName)
      if (!info) return undefined
      if (info.type === "api") return info.key
      if (info.type === "wellknown") return info.key
      // OAuth tokens are JWTs for the web UI — not valid for Realtime/Audio APIs
      return undefined
    } catch {
      return undefined
    }
  }

  private async autoDetectProvider(): Promise<string | undefined> {
    const candidates = ["openai", "groq", "deepgram", "assemblyai"]
    for (const p of candidates) {
      const key = await this.getApiKey(p)
      if (key) return p
    }
    return undefined
  }

  private defaultModel(provider: string): string {
    switch (provider) {
      case "openai":
        return "gpt-4o-transcribe"
      case "deepgram":
        return "nova-2"
      case "groq":
        return "whisper-large-v3-turbo"
      default:
        return ""
    }
  }
}
