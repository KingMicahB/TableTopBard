"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Music2, AlertCircle, Play, RefreshCw } from "lucide-react"
import { api } from "@/lib/api"
import { defaultModels, availableModels } from "@/lib/models"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import type { SceneData } from "@/lib/types"
import type { SceneDetails } from "@/lib/scene-details"

interface MusicGenerationPanelProps {
  musicPrompt: string
  sceneData?: SceneData | SceneDetails | null
  sceneDetails?: SceneDetails | null // New prop for SceneDetails specifically
  className?: string
  onMusicGenerated?: (songs: Array<{ id: string; title: string; audioUrl: string; imageUrl?: string; duration?: number }>) => void
  onSceneDetailsUpdate?: (sceneDetails: SceneDetails) => void // Callback to update SceneDetails
  selectedModel?: string
}

export function MusicGenerationPanel({
  musicPrompt,
  sceneData,
  sceneDetails,
  className,
  onMusicGenerated,
  onSceneDetailsUpdate,
  selectedModel: externalSelectedModel,
}: MusicGenerationPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState(externalSelectedModel || defaultModels.musicGeneration)
  const [instrumental, setInstrumental] = useState(true)

  // Sync with external model if provided
  useEffect(() => {
    if (externalSelectedModel !== undefined) {
      setSelectedModel(externalSelectedModel)
    }
  }, [externalSelectedModel])
  const [customMode, setCustomMode] = useState(false)
  const [style, setStyle] = useState("")
  const [title, setTitle] = useState("")

  // Use the scene's music prompt if available, otherwise fall back to the prop
  const effectiveMusicPrompt = sceneDetails?.musicPrompt || musicPrompt

  // Update title when sceneData.name or sceneDetails.name changes
  useEffect(() => {
    const name = sceneDetails?.name || sceneData?.name
    if (name) {
      setTitle(name)
    }
  }, [sceneData?.name, sceneDetails?.name])

  const handleGenerateMusic = async () => {
    // Use the currently selected scene's prompt
    const promptToUse = sceneDetails?.musicPrompt || musicPrompt
    
    if (!promptToUse || promptToUse.trim().length === 0) {
      setError("No music prompt available. Please ensure a scene is selected and has a generated music prompt.")
      return
    }

    setIsGenerating(true)
    setError(null)
    setTaskId(null)

    try {
      const result = await api.generateMusic(promptToUse, {
        model: selectedModel,
        instrumental,
        customMode,
        style: style.trim() || undefined,
        title: title.trim() || undefined,
        sceneName: sceneDetails?.name || sceneData?.name || undefined,
      })

      if (result.success && result.taskId) {
        setTaskId(result.taskId)
        // Start polling will be handled by parent component or hook
      } else {
        setError("Failed to start music generation")
      }
    } catch (err) {
      console.error("Music generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate music")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePollStatus = async () => {
    if (!taskId) return

    try {
      const result = await api.pollMusicStatus(taskId)
      
      console.log("[Music Generation] Poll result:", result)
      
      if (result.success) {
        // Check for SUCCESS or completed status
        const isComplete = result.status === "SUCCESS" || 
                          result.status === "completed" || 
                          result.status === "COMPLETED"
        
        if (isComplete && result.songs && result.songs.length > 0) {
          // Map songs to the expected format
          const mappedSongs = result.songs.map((song: any) => ({
            id: song.id,
            title: song.title || "Untitled",
            audioUrl: song.audio_url || song.audioUrl,
            imageUrl: song.image_url || song.imageUrl,
            duration: song.duration,
          }))
          
          console.log("[Music Generation] Songs mapped:", mappedSongs)
          
          // Save to SceneDetails if available
          if (sceneDetails) {
            sceneDetails.addGeneratedMusicMultiple(mappedSongs)
            if (onSceneDetailsUpdate) {
              onSceneDetailsUpdate(sceneDetails)
            }
          }
          
          if (onMusicGenerated) {
            onMusicGenerated(mappedSongs)
          }
          setTaskId(null) // Clear task ID once completed
          setError(null) // Clear any previous errors
        } else if (result.status === "failed" || result.status === "FAILED") {
          setError(result.error || "Music generation failed")
          setTaskId(null)
        }
        // If pending or processing, keep polling
      }
    } catch (err) {
      console.error("Poll status error:", err)
      setError(err instanceof Error ? err.message : "Failed to poll status")
    }
  }

  // Auto-poll when taskId is set
  useEffect(() => {
    if (!taskId) return

    // Poll immediately
    handlePollStatus()

    // Then poll every 15 seconds
    const pollInterval = setInterval(() => {
      handlePollStatus()
    }, 15000)

    return () => clearInterval(pollInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

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
          <Music2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Generate Music</h2>
        </div>
      </div>

      {/* Generation Options */}
      <div className="border-b border-border px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="instrumental" className="text-sm font-medium">
            Instrumental
          </Label>
          <Switch
            id="instrumental"
            checked={instrumental}
            onCheckedChange={setInstrumental}
            aria-label="Instrumental mode"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="custom-mode" className="text-sm font-medium">
            Custom Mode
          </Label>
          <Switch
            id="custom-mode"
            checked={customMode}
            onCheckedChange={setCustomMode}
            aria-label="Custom mode"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="style" className="text-sm font-medium">
            Style (optional)
          </Label>
          <Input
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="e.g., epic, ambient, energetic"
            className="focus-visible-ring"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Title {(sceneDetails?.name || sceneData?.name) ? "(from scene)" : "(optional)"}
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={(sceneDetails?.name || sceneData?.name) || "Song title"}
            className="focus-visible-ring"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <Alert variant="destructive" className="mb-4" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!effectiveMusicPrompt || effectiveMusicPrompt.trim().length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-muted-foreground">
              {sceneDetails 
                ? "No music prompt available for the selected scene. The prompt will be generated automatically when the scene is parsed."
                : "No music prompt available. Please select a scene or generate a music prompt first."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            {taskId ? (
              <>
                <p className="text-center text-muted-foreground">
                  Music generation in progress...
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePollStatus}
                    variant="outline"
                    className="focus-visible-ring"
                    aria-label="Check generation status"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                    Check Status
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-center text-muted-foreground">
                  Ready to generate music from prompt.
                </p>
                <Button
                  onClick={handleGenerateMusic}
                  disabled={isGenerating}
                  size="lg"
                  className="focus-visible-ring"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                      Generate Music
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
