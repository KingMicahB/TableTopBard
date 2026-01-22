"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type {
  TranscriptionStatus,
  TranscriptSegment,
  AudioDevice,
  Speaker,
} from "@/lib/types"
import { createSegment, mergeSegments, SPEAKER_COLORS } from "@/lib/transcription-store"

interface UseTranscriptionOptions {
  language: string
  onSegmentUpdate?: (segment: TranscriptSegment) => void
}

interface UseTranscriptionReturn {
  status: TranscriptionStatus
  isRecording: boolean
  isPaused: boolean
  segments: TranscriptSegment[]
  speakers: Speaker[]
  duration: number
  audioDevices: AudioDevice[]
  selectedDevice: string
  error: string | null
  start: () => Promise<void>
  stop: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  setSelectedDevice: (deviceId: string) => void
}

// Speech recognition with proper typing
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  onspeechstart: (() => void) | null
  onspeechend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export function useTranscription({
  language,
  onSegmentUpdate,
}: UseTranscriptionOptions): UseTranscriptionReturn {
  const [status, setStatus] = useState<TranscriptionStatus>("idle")
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [duration, setDuration] = useState(0)
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState("default")
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const currentSpeakerRef = useRef<string>("Speaker 1")
  const lastTranscriptRef = useRef<string>("")
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get available audio devices
  useEffect(() => {
    async function getDevices() {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ audio: true })
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
            kind: device.kind as "audioinput",
          }))
        setAudioDevices(audioInputs)
        if (audioInputs.length > 0 && selectedDevice === "default") {
          setSelectedDevice(audioInputs[0].deviceId)
        }
      } catch (err) {
        console.error("Error getting audio devices:", err)
      }
    }
    getDevices()
  }, [])

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser")
      setStatus("offline")
      return null
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      setStatus("listening")
      setError(null)
    }

    recognition.onspeechstart = () => {
      setStatus("listening")
    }

    recognition.onspeechend = () => {
      setStatus("processing")
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Clear silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }

      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        const confidence = result[0].confidence

        if (result.isFinal) {
          finalTranscript += transcript

          // Create final segment
          const segment = createSegment(
            transcript.trim(),
            currentSpeakerRef.current,
            false
          )
          segment.confidence = confidence || 0.9

          setSegments((prev) => {
            // Remove provisional segment if exists and add final
            const withoutProvisional = prev.filter((s) => !s.isProvisional)
            return [...withoutProvisional, segment]
          })

          if (onSegmentUpdate) {
            onSegmentUpdate(segment)
          }

          lastTranscriptRef.current = ""
          setStatus("listening")
        } else {
          interimTranscript += transcript

          // Detect potential speaker change based on pause duration
          // This is a simplified heuristic
          if (
            interimTranscript.length > 0 &&
            lastTranscriptRef.current.length === 0
          ) {
            silenceTimeoutRef.current = setTimeout(() => {
              // Potential speaker change after 2 seconds of silence
              const speakerNum =
                (parseInt(currentSpeakerRef.current.replace("Speaker ", "")) %
                  4) +
                1
              currentSpeakerRef.current = `Speaker ${speakerNum}`
            }, 2000)
          }

          lastTranscriptRef.current = interimTranscript
        }
      }

      // Update provisional segment for interim results
      if (interimTranscript) {
        setStatus("buffering")
        const provisionalSegment = createSegment(
          interimTranscript.trim(),
          currentSpeakerRef.current,
          true
        )

        setSegments((prev) => mergeSegments(prev, provisionalSegment))
      }
    }

    recognition.onerror = (event: Event & { error: string }) => {
      console.error("Speech recognition error:", event.error)

      switch (event.error) {
        case "not-allowed":
          setError("Microphone access denied. Please allow microphone access.")
          setStatus("offline")
          break
        case "no-speech":
          // This is normal, just keep listening
          setStatus("listening")
          break
        case "network":
          setError("Network error. Please check your connection.")
          setStatus("offline")
          break
        case "aborted":
          // User stopped, this is fine
          break
        default:
          setError(`Recognition error: ${event.error}`)
          setStatus("offline")
      }
    }

    recognition.onend = () => {
      // Restart if still recording and not paused
      if (isRecording && !isPaused && recognitionRef.current) {
        try {
          recognition.start()
        } catch (err) {
          console.error("Error restarting recognition:", err)
        }
      }
    }

    return recognition
  }, [language, isRecording, isPaused, onSegmentUpdate])

  // Start transcription
  const start = useCallback(async () => {
    setError(null)

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDevice !== "default" ? selectedDevice : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      mediaStreamRef.current = stream

      // Initialize recognition
      const recognition = initRecognition()
      if (!recognition) return

      recognitionRef.current = recognition
      recognition.start()

      setIsRecording(true)
      setIsPaused(false)
      startTimeRef.current = Date.now()

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setDuration(Date.now() - startTimeRef.current)
      }, 100)

      // Initialize first speaker
      if (speakers.length === 0) {
        setSpeakers([
          {
            id: "speaker-1",
            name: "Speaker 1",
            color: SPEAKER_COLORS[0],
          },
        ])
      }
    } catch (err) {
      console.error("Error starting transcription:", err)
      setError("Failed to start transcription. Please check microphone access.")
      setStatus("offline")
    }
  }, [selectedDevice, initRecognition, speakers.length])

  // Stop transcription
  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }

    setIsRecording(false)
    setIsPaused(false)
    setStatus("idle")
  }, [])

  // Pause transcription
  const pause = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsPaused(true)
    setStatus("paused")
  }, [])

  // Resume transcription
  const resume = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (err) {
        // Recognition might need to be reinitialized
        const recognition = initRecognition()
        if (recognition) {
          recognitionRef.current = recognition
          recognition.start()
        }
      }
    }
    setIsPaused(false)
    setStatus("listening")
  }, [initRecognition])

  // Reset transcription
  const reset = useCallback(() => {
    stop()
    setSegments([])
    setSpeakers([])
    setDuration(0)
    setError(null)
    currentSpeakerRef.current = "Speaker 1"
    lastTranscriptRef.current = ""
  }, [stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    status,
    isRecording,
    isPaused,
    segments,
    speakers,
    duration,
    audioDevices,
    selectedDevice,
    error,
    start,
    stop,
    pause,
    resume,
    reset,
    setSelectedDevice,
  }
}
