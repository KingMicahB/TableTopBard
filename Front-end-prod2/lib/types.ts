export type TranscriptionStatus =
  | "idle"
  | "listening"
  | "buffering"
  | "processing"
  | "refining"
  | "offline"
  | "paused"

export type TranscriptionMode = "caption" | "transcript"

export interface Word {
  text: string
  confidence: number
  startTime: number
  endTime: number
  speaker?: string
}

export interface TranscriptSegment {
  id: string
  text: string
  words: Word[]
  speaker?: string
  startTime: number
  endTime: number
  isProvisional: boolean
  confidence: number
  timestamp: Date
}

export interface Speaker {
  id: string
  name: string
  color: string
}

export interface Transcript {
  id: string
  title: string
  segments: TranscriptSegment[]
  speakers: Speaker[]
  language: string
  createdAt: Date
  updatedAt: Date
  duration: number
  metadata: TranscriptMetadata
}

export interface TranscriptMetadata {
  audioSource: string
  sampleRate?: number
  channels?: number
  noiseLevel?: "low" | "medium" | "high"
}

export interface CaptionSettings {
  fontSize: "small" | "medium" | "large" | "xlarge"
  fontFamily: "sans" | "serif" | "mono"
  textColor: string
  backgroundColor: string
  backgroundOpacity: number
  lineHeight: "compact" | "normal" | "relaxed"
  showSpeakerLabels: boolean
  showTimestamps: boolean
  showConfidence: boolean
  highlightCurrentWord: boolean
}

export interface AudioDevice {
  deviceId: string
  label: string
  kind: "audioinput" | "audiooutput"
}

export interface TranscriptionEngine {
  id: string
  name: string
  status: "available" | "loading" | "error"
  latency: "low" | "medium" | "high"
  accuracy: "low" | "medium" | "high"
}

export type ExportFormat = "txt" | "docx" | "pdf" | "srt" | "vtt"

export interface ExportOptions {
  format: ExportFormat
  includeTimestamps: boolean
  includeSpeakerLabels: boolean
  includeConfidenceScores: boolean
}

export interface SceneData {
  name?: string
  location: string
  vibeMood: string
  ambience: string
  whatsHappening: string
  isBattle: boolean
  energyLevel: string
  timeWeather?: string
  peopleCharacters?: string
  additionalNotes?: string
}
