"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileText, AlertCircle, RefreshCw } from "lucide-react"
import { api } from "@/lib/api"
import { defaultPrompts } from "@/lib/prompts"
import { defaultModels, availableModels } from "@/lib/models"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PromptEditor } from "./prompt-editor"
import { ModelSelector } from "./model-selector"
import { ScenePanel } from "./scene-panel"
import { SceneSelector } from "./scene-selector"
import { parseAllScenes, parseLastScene } from "@/lib/scene-parser"
import { generateMusicPromptsForScenes } from "@/lib/music-prompt-generator"
import type { SceneData } from "@/lib/types"
import type { SceneDetails } from "@/lib/scene-details"

interface SummaryPanelProps {
  transcription: string
  className?: string
  onSummaryGenerated?: (summary: string) => void
  onSceneDataChange?: (sceneData: SceneData | null) => void
  onSceneDetailsChange?: (sceneDetails: SceneDetails | null) => void
  customPrompt?: string
  onPromptChange?: (prompt: string) => void
  musicPromptTemplate?: string
  musicPromptModel?: string
  selectedModel?: string
}

export function SummaryPanel({
  transcription,
  className,
  onSummaryGenerated,
  onSceneDataChange,
  onSceneDetailsChange,
  customPrompt: externalPrompt,
  onPromptChange,
  musicPromptTemplate,
  musicPromptModel,
  selectedModel: externalSelectedModel,
}: SummaryPanelProps) {
  const [summary, setSummary] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState(externalPrompt || defaultPrompts.summarization)
  const [selectedModel, setSelectedModel] = useState(externalSelectedModel || defaultModels.summarization)
  const [lastTranscription, setLastTranscription] = useState("")

  // Sync with external model if provided
  useEffect(() => {
    if (externalSelectedModel !== undefined) {
      setSelectedModel(externalSelectedModel)
    }
  }, [externalSelectedModel])

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
  const [allScenes, setAllScenes] = useState<SceneDetails[]>([])
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(null)
  const [sceneData, setSceneData] = useState<SceneDetails | null>(null)

  // Store transcription when it changes
  useEffect(() => {
    if (transcription && transcription !== lastTranscription) {
      setLastTranscription(transcription)
    }
  }, [transcription, lastTranscription])

  const handleGenerateSummary = async () => {
    if (!transcription || transcription.trim().length === 0) {
      setError("No transcription available to summarize")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Replace placeholder in prompt
      const promptWithText = customPrompt.replace("{text}", transcription)

      const result = await api.summarizeText(
        transcription,
        promptWithText,
        selectedModel
      )

      if (result.success) {
        setSummary(result.summary)
        if (onSummaryGenerated) {
          onSummaryGenerated(result.summary)
        }
        // Parse all scenes from summary
        const parsedScenes = parseAllScenes(result.summary)
        setAllScenes(parsedScenes)
        
        // Select the last scene by default
        if (parsedScenes.length > 0) {
          const lastScene = parsedScenes[parsedScenes.length - 1]
          setSelectedSceneIndex(parsedScenes.length - 1)
          setSceneData(lastScene)
          if (onSceneDataChange) {
            onSceneDataChange(lastScene.toSceneData())
          }
          if (onSceneDetailsChange) {
            onSceneDetailsChange(lastScene)
          }

          // Automatically generate music prompts for all scenes (async, in parallel)
          if (parsedScenes.length > 0 && musicPromptTemplate) {
            generateMusicPromptsForScenes(
              parsedScenes,
              musicPromptTemplate,
              musicPromptModel
            ).catch((error) => {
              console.error("Error generating music prompts:", error)
              // Don't show error to user, just log it
            })
          }
        } else {
          setSelectedSceneIndex(null)
          setSceneData(null)
        }
      } else {
        setError("Failed to generate summary")
      }
    } catch (err) {
      console.error("Summary generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate summary")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRefresh = () => {
    handleGenerateSummary()
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
          <h2 className="text-lg font-semibold">Summary</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isGenerating || !transcription}
            className="focus-visible-ring"
            aria-label="Refresh summary"
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

      {/* Content Area - Side by Side Layout */}
      <div className="flex flex-col lg:flex-row gap-4 p-6 min-h-0">
        {error && (
          <Alert variant="destructive" className="mb-4 col-span-2" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!transcription || transcription.trim().length === 0 ? (
          <div className="flex h-[600px] items-center justify-center col-span-2">
            <p className="text-center text-muted-foreground">
              Start transcription to generate a summary.
              <br />
              <span className="text-sm">
                The summary will auto-update every 30 seconds.
              </span>
            </p>
          </div>
        ) : summary ? (
          <>
            {/* Left Column - Full Summary */}
            <div className="flex-1 overflow-y-auto h-[600px]">
              <div className="rounded-lg border border-border bg-muted/30 p-4 w-full">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {summary}
                </div>
              </div>
            </div>

            {/* Middle Column - Scene Selector */}
            {allScenes.length > 0 && (
              <div className="w-48 border border-border rounded-xl bg-card flex flex-col h-[600px]">
                <SceneSelector
                  scenes={allScenes}
                  selectedIndex={selectedSceneIndex}
                  onSelectScene={(index) => {
                    setSelectedSceneIndex(index)
                    const selectedScene = allScenes[index]
                    setSceneData(selectedScene)
                    if (onSceneDataChange) {
                      onSceneDataChange(selectedScene.toSceneData())
                    }
                    if (onSceneDetailsChange) {
                      onSceneDetailsChange(selectedScene)
                    }
                  }}
                  className="flex-1"
                />
              </div>
            )}

            {/* Right Column - Scene Panel */}
            <div className="flex-1 min-w-0">
              <ScenePanel
                summary={summary}
                sceneData={sceneData}
                onSceneDataChange={(data) => {
                  if (selectedSceneIndex !== null && sceneData) {
                    // Update the scene data
                    sceneData.updateFromSceneData(data)
                    setSceneData(sceneData.clone())
                    
                    // Update the scene in allScenes array
                    const updatedScenes = [...allScenes]
                    updatedScenes[selectedSceneIndex] = sceneData
                    setAllScenes(updatedScenes)
                  }
                  if (onSceneDataChange) {
                    onSceneDataChange(data)
                  }
                }}
                onParseRequest={() => {
                  // Re-parse all scenes from summary
                  const parsedScenes = parseAllScenes(summary)
                  setAllScenes(parsedScenes)
                  
                  // If we had a selected scene, try to keep it selected
                  // Otherwise select the last scene
                  if (parsedScenes.length > 0) {
                    const newIndex = selectedSceneIndex !== null && selectedSceneIndex < parsedScenes.length
                      ? selectedSceneIndex
                      : parsedScenes.length - 1
                    setSelectedSceneIndex(newIndex)
                    const selectedScene = parsedScenes[newIndex]
                    setSceneData(selectedScene)
                    if (onSceneDataChange) {
                      onSceneDataChange(selectedScene.toSceneData())
                    }
                    if (onSceneDetailsChange) {
                      onSceneDetailsChange(selectedScene)
                    }
                    
                    // Re-generate music prompts for all scenes
                    if (musicPromptTemplate) {
                      generateMusicPromptsForScenes(
                        parsedScenes,
                        musicPromptTemplate,
                        musicPromptModel
                      ).catch((error) => {
                        console.error("Error generating music prompts:", error)
                      })
                    }
                  } else {
                    setSelectedSceneIndex(null)
                    setSceneData(null)
                  }
                }}
                musicPromptTemplate={musicPromptTemplate}
                musicPromptModel={musicPromptModel}
                className="h-[600px]"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-8 col-span-2">
            <p className="text-center text-muted-foreground">
              Ready to generate summary from transcription.
            </p>
            <Button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="focus-visible-ring"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Generating...
                </>
              ) : (
                "Generate Summary"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
