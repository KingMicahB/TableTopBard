"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Music, AlertCircle, RefreshCw } from "lucide-react"
import { api } from "@/lib/api"
import { defaultPrompts } from "@/lib/prompts"
import { defaultModels, availableModels } from "@/lib/models"
import { PromptEditor } from "../summary/prompt-editor"
import { ModelSelector } from "../summary/model-selector"
import type { SceneData } from "@/lib/types"

interface MusicPromptPanelProps {
  summary: string
  sceneData?: SceneData | null
  className?: string
  onPromptGenerated?: (prompt: string) => void
  customPrompt?: string
  onPromptChange?: (prompt: string) => void
}

export function MusicPromptPanel({
  summary,
  sceneData,
  className,
  onPromptGenerated,
  customPrompt: externalPrompt,
  onPromptChange,
}: MusicPromptPanelProps) {
  const [musicPrompt, setMusicPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState(externalPrompt || defaultPrompts.musicPromptGeneration)
  const [selectedModel, setSelectedModel] = useState(defaultModels.musicPromptGeneration)
  const [lastSummary, setLastSummary] = useState("")

  // Sync with external prompt if provided
  useEffect(() => {
    if (externalPrompt !== undefined) {
      setCustomPrompt(externalPrompt)
    }
  }, [externalPrompt])

  // Notify parent of prompt changes
  const handlePromptChange = (newPrompt: string) => {
    setCustomPrompt(newPrompt)
    if (onPromptChange) {
      onPromptChange(newPrompt)
    }
  }

  // Store summary when it changes (for reference, but we use sceneData for generation)
  useEffect(() => {
    if (summary && summary !== lastSummary && summary.trim().length > 0) {
      setLastSummary(summary)
    }
  }, [summary, lastSummary])

  const handleGeneratePrompt = async () => {
    if (!sceneData) {
      setError("No scene data available. Please generate a summary first to extract scene information.")
      return
    }

    // Check if we have at least some basic scene information
    if (!sceneData.location && !sceneData.vibeMood && !sceneData.whatsHappening) {
      setError("Scene data is incomplete. Please ensure the summary contains scene information.")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Build scene information string from structured scene data
      const sceneInfoParts: string[] = []
      
      if (sceneData.name) {
        sceneInfoParts.push(`Scene: ${sceneData.name}`)
      }
      if (sceneData.location) {
        sceneInfoParts.push(`Location/Setting: ${sceneData.location}`)
      }
      if (sceneData.vibeMood) {
        sceneInfoParts.push(`Vibe/Mood: ${sceneData.vibeMood}`)
      }
      if (sceneData.ambience) {
        sceneInfoParts.push(`Ambience: ${sceneData.ambience}`)
      }
      if (sceneData.whatsHappening) {
        sceneInfoParts.push(`What's Happening: ${sceneData.whatsHappening}`)
      }
      if (sceneData.isBattle) {
        sceneInfoParts.push(`Combat/Battle: Yes`)
      }
      if (sceneData.energyLevel) {
        sceneInfoParts.push(`Energy Level: ${sceneData.energyLevel}`)
      }
      if (sceneData.timeWeather) {
        sceneInfoParts.push(`Time/Weather: ${sceneData.timeWeather}`)
      }
      if (sceneData.peopleCharacters) {
        sceneInfoParts.push(`People/Characters: ${sceneData.peopleCharacters}`)
      }
      if (sceneData.additionalNotes) {
        sceneInfoParts.push(`Additional Notes: ${sceneData.additionalNotes}`)
      }

      const sceneInfo = sceneInfoParts.join("\n")

      // Replace placeholder in prompt with scene information only
      const promptWithScene = customPrompt.replace("{summary}", sceneInfo)

      const result = await api.generateMusicPrompt(
        sceneInfo,
        promptWithScene,
        selectedModel
      )

      if (result.success) {
        setMusicPrompt(result.prompt)
        if (onPromptGenerated) {
          onPromptGenerated(result.prompt)
        }
      } else {
        setError("Failed to generate music prompt")
      }
    } catch (err) {
      console.error("Music prompt generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate music prompt")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRefresh = () => {
    handleGeneratePrompt()
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
          <Music className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Music Prompt</h2>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector
            value={selectedModel}
            onChange={setSelectedModel}
            models={availableModels.musicPromptGeneration}
            label="Model"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isGenerating || !sceneData}
            className="focus-visible-ring"
            aria-label="Refresh music prompt"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Prompt Editor - Hidden, managed in settings */}

      {/* Content Area */}
      <div className="overflow-y-auto p-6 h-[600px]">
        {error && (
          <Alert variant="destructive" className="mb-4" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!sceneData ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-muted-foreground">
              Generate a summary first to extract scene information.
              <br />
              <span className="text-sm">
                The music prompt will be generated from the current scene data.
              </span>
            </p>
          </div>
        ) : musicPrompt ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {musicPrompt}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-center text-muted-foreground">
              Ready to generate music prompt from summary.
            </p>
            <Button
              onClick={handleGeneratePrompt}
              disabled={isGenerating || !sceneData}
              className="focus-visible-ring"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Generating...
                </>
              ) : (
                "Generate Music Prompt"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
