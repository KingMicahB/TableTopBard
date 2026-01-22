"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileText, Edit2, Check, X } from "lucide-react"
import { Label } from "@/components/ui/label"

interface EditableTranscriptProps {
  transcription: string
  onTranscriptionChange?: (text: string) => void
  className?: string
}

export function EditableTranscript({
  transcription,
  onTranscriptionChange,
  className,
}: EditableTranscriptProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(transcription)

  // Update edited text when transcription changes (from live transcription)
  useEffect(() => {
    if (!isEditing) {
      setEditedText(transcription)
    }
  }, [transcription, isEditing])

  const handleSave = () => {
    if (onTranscriptionChange) {
      onTranscriptionChange(editedText)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedText(transcription)
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
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Transcript</h2>
        </div>
        {!isEditing ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="focus-visible-ring"
            aria-label="Edit transcript"
          >
            <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {isEditing ? (
          <div className="space-y-2">
            <Label htmlFor="transcript-editor" className="text-sm font-medium">
              Edit Transcript
            </Label>
            <Textarea
              id="transcript-editor"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="Enter or edit your transcript here..."
              className="min-h-[300px] font-mono text-sm focus-visible-ring"
              aria-label="Transcript editor"
            />
            <p className="text-xs text-muted-foreground">
              Make any corrections or additions to the transcript. Click Save to apply changes.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Transcript</Label>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              {editedText.trim() ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {editedText}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No transcript available. Start recording to generate a transcript, or click Edit to enter text manually.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
