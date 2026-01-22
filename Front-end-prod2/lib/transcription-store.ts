import type {
  TranscriptionStatus,
  TranscriptionMode,
  TranscriptSegment,
  Speaker,
  Transcript,
  CaptionSettings,
  AudioDevice,
} from "./types"

export const DEFAULT_CAPTION_SETTINGS: CaptionSettings = {
  fontSize: "large",
  fontFamily: "sans",
  textColor: "#ffffff",
  backgroundColor: "#000000",
  backgroundOpacity: 0.75,
  lineHeight: "relaxed",
  showSpeakerLabels: true,
  showTimestamps: false,
  showConfidence: false,
  highlightCurrentWord: true,
}

export const SPEAKER_COLORS = [
  "var(--speaker-1)",
  "var(--speaker-2)",
  "var(--speaker-3)",
  "var(--speaker-4)",
]

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
]

export function createSegment(
  text: string,
  speaker?: string,
  isProvisional = false
): TranscriptSegment {
  const now = Date.now()
  return {
    id: `segment-${now}-${Math.random().toString(36).substr(2, 9)}`,
    text,
    words: text.split(" ").map((word, index) => ({
      text: word,
      confidence: isProvisional ? 0.7 : 0.95,
      startTime: now + index * 200,
      endTime: now + (index + 1) * 200,
      speaker,
    })),
    speaker,
    startTime: now,
    endTime: now + text.split(" ").length * 200,
    isProvisional,
    confidence: isProvisional ? 0.7 : 0.95,
    timestamp: new Date(),
  }
}

export function createTranscript(
  segments: TranscriptSegment[],
  speakers: Speaker[],
  language: string
): Transcript {
  const now = new Date()
  const duration =
    segments.length > 0
      ? segments[segments.length - 1].endTime - segments[0].startTime
      : 0

  return {
    id: `transcript-${now.getTime()}`,
    title: `Transcript ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    segments,
    speakers,
    language,
    createdAt: now,
    updatedAt: now,
    duration,
    metadata: {
      audioSource: "microphone",
    },
  }
}

export function mergeSegments(
  existing: TranscriptSegment[],
  incoming: TranscriptSegment
): TranscriptSegment[] {
  // If the last segment is provisional, replace it
  if (existing.length > 0 && existing[existing.length - 1].isProvisional) {
    return [...existing.slice(0, -1), incoming]
  }
  return [...existing, incoming]
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`
  }
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`
}

export function getConfidenceLevel(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.9) return "high"
  if (confidence >= 0.7) return "medium"
  return "low"
}
