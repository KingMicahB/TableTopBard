"use client"

import { Captions, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { TranscriptionMode } from "@/lib/types"

interface ModeToggleProps {
  mode: TranscriptionMode
  onModeChange: (mode: TranscriptionMode) => void
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div
      className="inline-flex rounded-lg bg-muted p-1"
      role="tablist"
      aria-label="Display mode"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange("caption")}
        className={cn(
          "gap-2 rounded-md px-4 focus-visible-ring",
          mode === "caption" && "bg-background shadow-sm"
        )}
        role="tab"
        aria-selected={mode === "caption"}
        aria-controls="caption-panel"
      >
        <Captions className="h-4 w-4" aria-hidden="true" />
        <span>Captions</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange("transcript")}
        className={cn(
          "gap-2 rounded-md px-4 focus-visible-ring",
          mode === "transcript" && "bg-background shadow-sm"
        )}
        role="tab"
        aria-selected={mode === "transcript"}
        aria-controls="transcript-panel"
      >
        <FileText className="h-4 w-4" aria-hidden="true" />
        <span>Transcript</span>
      </Button>
    </div>
  )
}
