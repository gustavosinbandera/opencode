import { createSignal, onCleanup } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { VoiceRecorder, type VoiceConfig } from "@tui/voice"
import { useSDK } from "./sdk"
import { createSimpleContext } from "./helper"
import { useToast } from "../ui/toast"
import { useTuiConfig } from "./tui-config"
import { useKeybind } from "./keybind"

const voiceCtx = createSimpleContext({
  name: "Voice",
  init: () => {
    const sdk = useSDK()
    const toast = useToast()
    const config = useTuiConfig()
    const keybind = useKeybind()
    const [recording, setRecording] = createSignal(false)
    const [level, setLevel] = createSignal(0)

    let recorder: VoiceRecorder | null = null

    const voiceConfig: VoiceConfig = config.voice ?? {}

    async function toggle() {
      if (recording()) {
        setRecording(false)
        setLevel(0)
        await recorder?.stop()
        recorder = null
        return
      }

      const fetchFn = sdk.fetch
      const baseUrl = sdk.url
      recorder = new VoiceRecorder(
        voiceConfig,
        (text) => {
          fetchFn(`${baseUrl}/tui/append-prompt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          }).catch(() => {})
        },
        (lvl) => {
          setLevel(lvl)
        },
      )
      setRecording(true)

      await recorder.start((err) => {
        setRecording(false)
        setLevel(0)
        recorder = null
        toast.show({
          variant: "error",
          message: err,
        })
      })
    }

    useKeyboard((evt) => {
      if (keybind.match("voice_toggle", evt)) {
        toggle()
      }
    })

    onCleanup(async () => {
      if (recorder) {
        await recorder.stop()
        recorder = null
      }
    })

    return {
      recording,
      level,
      toggle,
    }
  },
})

export const VoiceProvider = voiceCtx.provider
export const useVoice = voiceCtx.use

const fallbackVoice = {
  recording: () => false as boolean,
  level: () => 0,
  toggle: () => {},
}

export function tryUseVoice() {
  try {
    return voiceCtx.use()
  } catch {
    return fallbackVoice
  }
}
