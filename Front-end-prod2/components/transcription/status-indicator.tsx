"use client"

import { cn } from "@/lib/utils"
import type { TranscriptionStatus } from "@/lib/types"

interface StatusIndicatorProps {
  status: TranscriptionStatus
  className?: string
}

const STATUS_CONFIG: Record<
  TranscriptionStatus,
  { label: string; color: string; pulse: boolean }
> = {
  idle: {
    label: "Ready",
    color: "bg-muted-foreground",
    pulse: false,
  },
  listening: {
    label: "Listening",
    color: "bg-live-indicator",
    pulse: true,
  },
  buffering: {
    label: "Buffering",
    color: "bg-processing",
    pulse: true,
  },
  processing: {
    label: "Processing",
    color: "bg-processing",
    pulse: true,
  },
  refining: {
    label: "Refining",
    color: "bg-primary",
    pulse: false,
  },
  offline: {
    label: "Offline",
    color: "bg-destructive",
    pulse: false,
  },
  paused: {
    label: "Paused",
    color: "bg-muted-foreground",
    pulse: false,
  },
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status]

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="status"
      aria-live="polite"
      aria-label={`Transcription status: ${config.label}`}
    >
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          config.color,
          config.pulse && "animate-pulse-live"
        )}
        aria-hidden="true"
      />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  )
}

interface WaveformIndicatorProps {
  isActive: boolean
  className?: string
}

export function WaveformIndicator({ isActive, className }: WaveformIndicatorProps) {
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={isActive ? "Audio input active" : "Audio input inactive"}
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full bg-primary transition-all",
            isActive ? "animate-waveform" : "h-1"
          )}
          style={{
            animationDelay: isActive ? `${i * 0.1}s` : undefined,
            height: isActive ? undefined : "4px",
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
