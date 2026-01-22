"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PromptEditorProps {
  prompt: string
  onChange: (prompt: string) => void
  placeholder?: string
  label?: string
}

export function PromptEditor({
  prompt,
  onChange,
  placeholder = "Enter your prompt...",
  label = "Prompt",
}: PromptEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="prompt-editor" className="text-sm font-medium">
          {label}
        </Label>
        <Alert className="py-1 px-2">
          <Info className="h-3 w-3" aria-hidden="true" />
          <AlertDescription className="text-xs">
            System prompts are managed on the backend. This is the user prompt.
          </AlertDescription>
        </Alert>
      </div>
      <Textarea
        id="prompt-editor"
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[100px] font-mono text-sm focus-visible-ring"
        aria-label={label}
      />
      <p className="text-xs text-muted-foreground">
        Use placeholders like {"{text}"}, {"{summary}"}, or {"{prompt}"} to insert dynamic content.
      </p>
    </div>
  )
}
