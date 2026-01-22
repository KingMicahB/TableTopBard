"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Edit2, Check, X } from "lucide-react"
import type { TranscriptSegment, CaptionSettings, TranscriptionMode } from "@/lib/types"
import { CaptionDisplay } from "./caption-display"
import { ModeToggle } from "./mode-toggle"

interface TranscriptViewProps {
  editedTranscript: string
  settings: CaptionSettings
  isAutoScrollEnabled: boolean
  onScrollInteraction: () => void
}

function TranscriptView({
  editedTranscript,
  settings,
  isAutoScrollEnabled,
  onScrollInteraction,
}: TranscriptViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [userScrolled, setUserScrolled] = useState(false)
  const lastTranscriptLengthRef = useRef(editedTranscript.length)

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (isAutoScrollEnabled && !userScrolled && containerRef.current) {
      const hasNewContent = editedTranscript.length > lastTranscriptLengthRef.current
      if (hasNewContent) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    }
    lastTranscriptLengthRef.current = editedTranscript.length
  }, [editedTranscript, isAutoScrollEnabled, userScrolled])

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

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        "overflow-y-auto p-6",
        "h-[600px]", // Fixed height
        settings.fontFamily === "sans" && "font-sans",
        settings.fontFamily === "serif" && "font-serif",
        settings.fontFamily === "mono" && "font-mono"
      )}
      role="log"
      aria-live="polite"
      aria-label="Transcript"
    >
      {editedTranscript.trim() ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p
              className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap",
                settings.fontSize === "small" && "text-lg",
                settings.fontSize === "medium" && "text-2xl",
                settings.fontSize === "large" && "text-3xl",
                settings.fontSize === "xlarge" && "text-4xl",
                settings.lineHeight === "compact" && "leading-snug",
                settings.lineHeight === "normal" && "leading-normal",
                settings.lineHeight === "relaxed" && "leading-relaxed"
              )}
            >
              {editedTranscript}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-center text-muted-foreground">
            Start recording to see your transcript here.
            <br />
            <span className="text-sm">
              Press the microphone button or hit Space to begin.
            </span>
          </p>
        </div>
      )}

      {/* Scroll to bottom button */}
      {userScrolled && editedTranscript.trim() && (
        <button
          onClick={() => {
            setUserScrolled(false)
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight
            }
          }}
          className="fixed bottom-24 right-8 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 focus-visible-ring"
          aria-label="Scroll to latest transcript"
        >
          Jump to live
        </button>
      )}
    </div>
  )
}

interface CaptioningPanelProps {
  segments: TranscriptSegment[]
  settings: CaptionSettings
  editedTranscript: string
  onTranscriptChange: (text: string) => void
  className?: string
}

export function CaptioningPanel({
  segments,
  settings,
  editedTranscript,
  onTranscriptChange,
  className,
}: CaptioningPanelProps) {
  const [mode, setMode] = useState<TranscriptionMode>("transcript")
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(editedTranscript)
  const processedSegmentIdsRef = useRef<Set<string>>(new Set())
  const lastEditedTranscriptRef = useRef(editedTranscript)

  const handleScrollInteraction = () => {
    setIsAutoScrollEnabled(false)
  }

  // Update edit text when edited transcript changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditText(editedTranscript)
    }
    lastEditedTranscriptRef.current = editedTranscript
  }, [editedTranscript, isEditing])

  // Append new segments to edited transcript
  useEffect(() => {
    if (isEditing) return // Don't auto-append while editing

    // Find new final (non-provisional) segments that haven't been processed
    const newFinalSegments = segments.filter(
      (s) => !s.isProvisional && !processedSegmentIdsRef.current.has(s.id)
    )

    if (newFinalSegments.length > 0) {
      const newText = newFinalSegments.map((s) => s.text).join(" ")

      if (newText.trim()) {
        // Mark these segments as processed
        newFinalSegments.forEach((s) => processedSegmentIdsRef.current.add(s.id))

        // Append to edited transcript
        const currentTranscript = lastEditedTranscriptRef.current || editedTranscript
        const updated = currentTranscript.trim()
          ? `${currentTranscript} ${newText}`
          : newText
        onTranscriptChange(updated)
        lastEditedTranscriptRef.current = updated
      }
    }

    // Also mark provisional segments that become final
    segments.forEach((s) => {
      if (!s.isProvisional) {
        processedSegmentIdsRef.current.add(s.id)
      }
    })
  }, [segments, editedTranscript, onTranscriptChange, isEditing])

  const handleSave = () => {
    // Update the ref immediately with the saved text
    lastEditedTranscriptRef.current = editText
    onTranscriptChange(editText)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(editedTranscript)
    setIsEditing(false)
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card",
        className
      )}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <ModeToggle mode={mode} onModeChange={setMode} />
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{segments.length} segments</span>
                {!isAutoScrollEnabled && (
                  <button
                    onClick={() => setIsAutoScrollEnabled(true)}
                    className="rounded bg-muted px-2 py-1 text-xs hover:bg-muted/80 focus-visible-ring"
                    aria-label="Re-enable auto-scroll"
                  >
                    Resume auto-scroll
                  </button>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Ensure editText is current when entering edit mode
                  setEditText(editedTranscript)
                  setIsEditing(true)
                }}
                className="focus-visible-ring"
                aria-label="Edit transcript"
              >
                <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Edit
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="focus-visible-ring"
                aria-label="Cancel editing"
              >
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="focus-visible-ring"
                aria-label="Save transcript"
              >
                <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                Save
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isEditing ? (
        <div className="overflow-y-auto p-6 h-[600px]">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Edit your transcript here. New captions will be appended after your edits."
            className="min-h-full font-mono text-sm focus-visible-ring"
            aria-label="Transcript editor"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Any new captions from live transcription will be added after your edited text.
          </p>
        </div>
      ) : mode === "transcript" ? (
        <TranscriptView
          editedTranscript={editedTranscript}
          settings={settings}
          isAutoScrollEnabled={isAutoScrollEnabled}
          onScrollInteraction={handleScrollInteraction}
        />
      ) : (
        <CaptionDisplay
          segments={segments}
          settings={settings}
          mode={mode}
          isAutoScrollEnabled={isAutoScrollEnabled}
          onScrollInteraction={handleScrollInteraction}
        />
      )}
    </div>
  )
}
