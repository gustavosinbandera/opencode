import z from "zod"
import { Config } from "./config"

const KeybindOverride = z
  .object(
    Object.fromEntries(Object.keys(Config.Keybinds.shape).map((key) => [key, z.string().optional()])) as Record<
      string,
      z.ZodOptional<z.ZodString>
    >,
  )
  .strict()

export const VoiceOptions = z
  .object({
    provider: z.enum(["openai", "deepgram", "assemblyai", "groq"]).optional().describe("STT provider"),
    apiKey: z.string().optional().describe("API key for the STT provider"),
    model: z.string().optional().describe("Model to use for transcription"),
    language: z.string().optional().default("en").describe("Language code for transcription (e.g. 'en', 'es')"),
  })
  .optional()
  .describe("Voice input configuration")

export const TuiOptions = z.object({
  scroll_speed: z.number().min(0.001).optional().describe("TUI scroll speed"),
  scroll_acceleration: z
    .object({
      enabled: z.boolean().describe("Enable scroll acceleration"),
    })
    .optional()
    .describe("Scroll acceleration settings"),
  diff_style: z
    .enum(["auto", "stacked"])
    .optional()
    .describe("Control diff rendering style: 'auto' adapts to terminal width, 'stacked' always shows single column"),
})

export const TuiInfo = z
  .object({
    $schema: z.string().optional(),
    theme: z.string().optional(),
    keybinds: KeybindOverride.optional(),
    voice: VoiceOptions,
  })
  .extend(TuiOptions.shape)
  .strict()
