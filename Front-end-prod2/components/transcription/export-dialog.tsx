"use client"

import React from "react"

import { useState } from "react"
import { Download, FileText, FileType, Captions, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { TranscriptSegment, ExportFormat, ExportOptions } from "@/lib/types"
import { formatTime } from "@/lib/transcription-store"

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  segments: TranscriptSegment[]
  title?: string
}

export function ExportDialog({
  isOpen,
  onClose,
  segments,
  title = "Transcript",
}: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: "txt",
    includeTimestamps: true,
    includeSpeakerLabels: true,
    includeConfidenceScores: false,
  })
  const [copied, setCopied] = useState(false)

  const formatIcons: Record<ExportFormat, React.ReactNode> = {
    txt: <FileText className="h-4 w-4" aria-hidden="true" />,
    docx: <FileType className="h-4 w-4" aria-hidden="true" />,
    pdf: <FileType className="h-4 w-4" aria-hidden="true" />,
    srt: <Captions className="h-4 w-4" aria-hidden="true" />,
    vtt: <Captions className="h-4 w-4" aria-hidden="true" />,
  }

  const generateContent = (): string => {
    if (segments.length === 0) {
      return "No transcript available."
    }

    switch (options.format) {
      case "srt":
        return generateSRT(segments, options)
      case "vtt":
        return generateVTT(segments, options)
      default:
        return generatePlainText(segments, options)
    }
  }

  const handleExport = () => {
    const content = generateContent()
    const mimeTypes: Record<ExportFormat, string> = {
      txt: "text/plain",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pdf: "application/pdf",
      srt: "text/plain",
      vtt: "text/vtt",
    }

    const blob = new Blob([content], { type: mimeTypes[options.format] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.replace(/\s+/g, "_")}.${options.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    onClose()
  }

  const handleCopyToClipboard = async () => {
    const content = generateContent()
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy to clipboard:", err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Transcript</DialogTitle>
          <DialogDescription>
            Choose your export format and options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(value) =>
                setOptions({ ...options, format: value as ExportFormat })
              }
              className="grid grid-cols-3 gap-2"
            >
              {(["txt", "srt", "vtt"] as ExportFormat[]).map((format) => (
                <div key={format}>
                  <RadioGroupItem
                    value={format}
                    id={`format-${format}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`format-${format}`}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-input p-3 transition-colors hover:bg-muted peer-aria-checked:border-primary peer-aria-checked:bg-primary/5"
                  >
                    {formatIcons[format]}
                    <span className="mt-1 text-xs font-medium uppercase">
                      {format}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="include-timestamps">Include Timestamps</Label>
                <p className="text-xs text-muted-foreground">
                  Add time markers to each segment
                </p>
              </div>
              <Switch
                id="include-timestamps"
                checked={options.includeTimestamps}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeTimestamps: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="include-speakers">Include Speaker Labels</Label>
                <p className="text-xs text-muted-foreground">
                  Identify who is speaking
                </p>
              </div>
              <Switch
                id="include-speakers"
                checked={options.includeSpeakerLabels}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeSpeakerLabels: checked })
                }
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-input bg-muted/50 p-3 font-mono text-xs">
              <pre className="whitespace-pre-wrap">
                {generateContent().slice(0, 500)}
                {generateContent().length > 500 && "..."}
              </pre>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleCopyToClipboard}
            className="w-full sm:w-auto bg-transparent"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                Copy to Clipboard
              </>
            )}
          </Button>
          <Button onClick={handleExport} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Download {options.format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper functions for generating export content

function generatePlainText(
  segments: TranscriptSegment[],
  options: ExportOptions
): string {
  return segments
    .map((segment) => {
      let line = ""
      if (options.includeTimestamps) {
        line += `[${formatTime(segment.startTime)}] `
      }
      if (options.includeSpeakerLabels && segment.speaker) {
        line += `${segment.speaker}: `
      }
      line += segment.text
      return line
    })
    .join("\n\n")
}

function generateSRT(
  segments: TranscriptSegment[],
  options: ExportOptions
): string {
  return segments
    .map((segment, index) => {
      const startTime = formatSRTTime(segment.startTime)
      const endTime = formatSRTTime(segment.endTime)
      let text = segment.text
      if (options.includeSpeakerLabels && segment.speaker) {
        text = `${segment.speaker}: ${text}`
      }
      return `${index + 1}\n${startTime} --> ${endTime}\n${text}`
    })
    .join("\n\n")
}

function generateVTT(
  segments: TranscriptSegment[],
  options: ExportOptions
): string {
  const header = "WEBVTT\n\n"
  const body = segments
    .map((segment) => {
      const startTime = formatVTTTime(segment.startTime)
      const endTime = formatVTTTime(segment.endTime)
      let text = segment.text
      if (options.includeSpeakerLabels && segment.speaker) {
        text = `<v ${segment.speaker}>${text}`
      }
      return `${startTime} --> ${endTime}\n${text}`
    })
    .join("\n\n")
  return header + body
}

function formatSRTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = ms % 1000
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`
}

function formatVTTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = ms % 1000
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
}
