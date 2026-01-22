"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { TranscriptSegment, CaptionSettings, TranscriptionMode } from "@/lib/types"
import { getConfidenceLevel, formatTime } from "@/lib/transcription-store"

interface CaptionDisplayProps {
  segments: TranscriptSegment[]
  settings: CaptionSettings
  mode: TranscriptionMode
  isAutoScrollEnabled: boolean
  onScrollInteraction: () => void
}

export function CaptionDisplay({
  segments,
  settings,
  mode,
  isAutoScrollEnabled,
  onScrollInteraction,
}: CaptionDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [userScrolled, setUserScrolled] = useState(false)

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (isAutoScrollEnabled && !userScrolled && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [segments, isAutoScrollEnabled, userScrolled])

  // Detect user scroll
  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    
    if (!isAtBottom) {
      setUserScrolled(true)
      onScrollInteraction()
    } else {
      setUserScrolled(false)
    }
  }

  const fontSizeClasses = {
    small: "text-lg",
    medium: "text-2xl",
    large: "text-3xl",
    xlarge: "text-4xl",
  }

  const fontFamilyClasses = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  }

  const lineHeightClasses = {
    compact: "leading-snug",
    normal: "leading-normal",
    relaxed: "leading-relaxed",
  }

  if (mode === "caption") {
    return (
      <CaptionMode
        segments={segments}
        settings={settings}
        fontSizeClasses={fontSizeClasses}
        fontFamilyClasses={fontFamilyClasses}
        lineHeightClasses={lineHeightClasses}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        "flex-1 overflow-y-auto p-6",
        fontFamilyClasses[settings.fontFamily]
      )}
      role="log"
      aria-live="polite"
      aria-label="Live transcript"
      tabIndex={0}
    >
      {segments.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-center text-muted-foreground">
            Start recording to see your transcript here.
            <br />
            <span className="text-sm">
              Press the microphone button or hit Space to begin.
            </span>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {segments.map((segment, index) => (
            <TranscriptSegmentItem
              key={segment.id}
              segment={segment}
              settings={settings}
              fontSizeClasses={fontSizeClasses}
              lineHeightClasses={lineHeightClasses}
              isLatest={index === segments.length - 1}
            />
          ))}
        </div>
      )}

      {/* Scroll to bottom button */}
      {userScrolled && segments.length > 0 && (
        <button
          onClick={() => {
            setUserScrolled(false)
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight
            }
          }}
          className="fixed bottom-24 right-8 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 focus-visible-ring"
          aria-label="Scroll to latest caption"
        >
          Jump to live
        </button>
      )}
    </div>
  )
}

interface CaptionModeProps {
  segments: TranscriptSegment[]
  settings: CaptionSettings
  fontSizeClasses: Record<string, string>
  fontFamilyClasses: Record<string, string>
  lineHeightClasses: Record<string, string>
}

function CaptionMode({
  segments,
  settings,
  fontSizeClasses,
  fontFamilyClasses,
  lineHeightClasses,
}: CaptionModeProps) {
  const recentSegments = segments.slice(-3)

  return (
    <div
      className="flex flex-1 flex-col items-center justify-end p-8"
      role="log"
      aria-live="polite"
      aria-label="Live captions"
    >
      <div
        className={cn(
          "w-full max-w-4xl rounded-lg p-6",
          fontFamilyClasses[settings.fontFamily]
        )}
        style={{
          backgroundColor: settings.backgroundColor,
          opacity: settings.backgroundOpacity,
        }}
      >
        {recentSegments.length === 0 ? (
          <p
            className={cn(
              "text-center",
              fontSizeClasses[settings.fontSize],
              lineHeightClasses[settings.lineHeight]
            )}
            style={{ color: settings.textColor }}
          >
            Waiting for speech...
          </p>
        ) : (
          <div className="space-y-2">
            {recentSegments.map((segment, index) => (
              <p
                key={segment.id}
                className={cn(
                  fontSizeClasses[settings.fontSize],
                  lineHeightClasses[settings.lineHeight],
                  index === recentSegments.length - 1 && "animate-caption-in",
                  segment.isProvisional && "opacity-70"
                )}
                style={{ color: settings.textColor }}
              >
                {settings.showSpeakerLabels && segment.speaker && (
                  <span className="mr-2 font-semibold">
                    {segment.speaker}:
                  </span>
                )}
                {segment.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface TranscriptSegmentItemProps {
  segment: TranscriptSegment
  settings: CaptionSettings
  fontSizeClasses: Record<string, string>
  lineHeightClasses: Record<string, string>
  isLatest: boolean
}

function TranscriptSegmentItem({
  segment,
  settings,
  fontSizeClasses,
  lineHeightClasses,
  isLatest,
}: TranscriptSegmentItemProps) {
  const confidenceLevel = getConfidenceLevel(segment.confidence)
  const confidenceColors = {
    high: "border-l-confidence-high",
    medium: "border-l-confidence-medium",
    low: "border-l-confidence-low",
  }

  return (
    <div
      className={cn(
        "border-l-4 pl-4 transition-all",
        confidenceColors[confidenceLevel],
        isLatest && "animate-caption-in",
        segment.isProvisional && "opacity-70"
      )}
    >
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        {settings.showTimestamps && (
          <span>{formatTime(segment.startTime)}</span>
        )}
        {settings.showSpeakerLabels && segment.speaker && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `var(--speaker-${(parseInt(segment.speaker.replace("Speaker ", "")) % 4) + 1})`,
              color: "white",
            }}
          >
            {segment.speaker}
          </span>
        )}
        {settings.showConfidence && (
          <span className="opacity-60">
            {Math.round(segment.confidence * 100)}% confidence
          </span>
        )}
        {segment.isProvisional && (
          <span className="italic">processing...</span>
        )}
      </div>
      <p
        className={cn(
          fontSizeClasses[settings.fontSize === "xlarge" ? "large" : settings.fontSize],
          lineHeightClasses[settings.lineHeight]
        )}
      >
        {settings.highlightCurrentWord && isLatest
          ? segment.words.map((word, i) => (
              <span
                key={`${segment.id}-word-${i}`}
                className={cn(
                  i === segment.words.length - 1 && "bg-primary/20 rounded px-0.5"
                )}
              >
                {word.text}{" "}
              </span>
            ))
          : segment.text}
      </p>
    </div>
  )
}
