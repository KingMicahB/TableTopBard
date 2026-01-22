"use client"

import { Mic, MicOff, Pause, Play, Square, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TranscriptionStatus } from "@/lib/types"
import { StatusIndicator, WaveformIndicator } from "./status-indicator"
import { formatTime } from "@/lib/transcription-store"

interface AudioControlsProps {
  status: TranscriptionStatus
  isRecording: boolean
  isPaused: boolean
  duration: number
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
}

export function AudioControls({
  status,
  isRecording,
  isPaused,
  duration,
  onStart,
  onStop,
  onPause,
  onResume,
  onReset,
}: AudioControlsProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* Status and Waveform */}
      <div className="flex items-center gap-4">
        <StatusIndicator status={status} />
        <WaveformIndicator isActive={isRecording && !isPaused} />
      </div>

      {/* Duration */}
      <div
        className="font-mono text-3xl font-light tracking-wider text-foreground"
        role="timer"
        aria-label={`Recording duration: ${formatTime(duration)}`}
      >
        {formatTime(duration)}
      </div>

      {/* Main Controls */}
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <Button
            size="lg"
            onClick={onStart}
            className={cn(
              "h-16 w-16 rounded-full focus-visible-ring",
              "bg-primary hover:bg-primary/90"
            )}
            aria-label="Start recording and transcription"
          >
            <Mic className="h-7 w-7" aria-hidden="true" />
          </Button>
        ) : (
          <>
            {/* Pause/Resume */}
            <Button
              size="lg"
              variant="outline"
              onClick={isPaused ? onResume : onPause}
              className="h-14 w-14 rounded-full focus-visible-ring bg-transparent"
              aria-label={isPaused ? "Resume recording" : "Pause recording"}
            >
              {isPaused ? (
                <Play className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Pause className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>

            {/* Stop */}
            <Button
              size="lg"
              variant="destructive"
              onClick={onStop}
              className="h-16 w-16 rounded-full focus-visible-ring"
              aria-label="Stop recording"
            >
              <Square className="h-6 w-6" aria-hidden="true" />
            </Button>

            {/* Mute indicator */}
            <Button
              size="lg"
              variant="outline"
              onClick={onReset}
              className="h-14 w-14 rounded-full focus-visible-ring bg-transparent"
              aria-label="Reset transcript"
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <p className="text-xs text-muted-foreground">
        <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Space</kbd>
        {" to start/pause, "}
        <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Esc</kbd>
        {" to stop"}
      </p>
    </div>
  )
}
