import { createSignal, onCleanup } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { VoiceRecorder, type VoiceConfig } from "@tui/voice"
import { useSDK } from "./sdk"
import { createSimpleContext } from "./helper"
import { useToast } from "../ui/toast"
import { useTuiConfig } from "./tui-config"
import { useKeybind } from "./keybind"

export const { use: useVoice, provider: VoiceProvider } = createSimpleContext({
  name: "Voice",
  init: () => {
    const sdk = useSDK()
    const toast = useToast()
    const config = useTuiConfig()
    const keybind = useKeybind()
    const [recording, setRecording] = createSignal(false)

    let recorder: VoiceRecorder | null = null

    const voiceConfig: VoiceConfig = config.voice ?? {}

    async function toggle() {
      if (recording()) {
        setRecording(false)
        await recorder?.stop()
        recorder = null
        return
      }

      const fetchFn = sdk.fetch
      const baseUrl = sdk.url
      recorder = new VoiceRecorder(voiceConfig, (text) => {
        fetchFn(`${baseUrl}/tui/append-prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }).catch(() => {})
      })
      setRecording(true)

      await recorder.start((err) => {
        setRecording(false)
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
      toggle,
    }
  },
})
