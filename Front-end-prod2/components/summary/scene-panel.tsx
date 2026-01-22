"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, MapPin, Heart, Volume2, Zap, Users, Clock, FileText, Loader2, Music } from "lucide-react"
import type { SceneData } from "@/lib/types"
import type { SceneDetails } from "@/lib/scene-details"
import { parseLastScene } from "@/lib/scene-parser"
import { generateMusicPromptForScene } from "@/lib/music-prompt-generator"
import { defaultPrompts } from "@/lib/prompts"
import { defaultModels } from "@/lib/models"

interface ScenePanelProps {
  summary: string
  sceneData?: SceneDetails | null
  onSceneDataChange?: (sceneData: SceneData) => void
  onParseRequest?: () => void
  musicPromptTemplate?: string
  musicPromptModel?: string
  className?: string
}

const ENERGY_LEVELS = [
  { value: "calm", label: "Calm" },
  { value: "moderate", label: "Moderate" },
  { value: "energetic", label: "Energetic" },
  { value: "frantic", label: "Frantic" },
  { value: "intense", label: "Intense" },
  { value: "relaxed", label: "Relaxed" },
]

export function ScenePanel({
  summary,
  sceneData: initialSceneData,
  onSceneDataChange,
  onParseRequest,
  musicPromptTemplate,
  musicPromptModel,
  className,
}: ScenePanelProps) {
  const [sceneData, setSceneData] = useState<SceneDetails | null>(initialSceneData || null)
  const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState(false)

  // Update scene data when initialSceneData changes
  useEffect(() => {
    setSceneData(initialSceneData || null)
  }, [initialSceneData])

  const handleParseFromSummary = () => {
    if (onParseRequest) {
      // Use the parent's parse function which handles all scenes
      onParseRequest()
    } else {
      // Fallback to parsing just the last scene
      const parsed = parseLastScene(summary)
      if (parsed) {
        setSceneData(parsed)
        if (onSceneDataChange) {
          onSceneDataChange(parsed)
        }
      }
    }
  }

  const handleFieldChange = <K extends keyof SceneData>(
    field: K,
    value: SceneData[K]
  ) => {
    const updated = { ...sceneData, [field]: value }
    setSceneData(updated)
    if (onSceneDataChange) {
      onSceneDataChange(updated)
    }
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
          <MapPin className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">
            {sceneData.name || "Current Scene"}
          </h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleParseFromSummary}
          disabled={!summary}
          className="focus-visible-ring"
          aria-label="Parse scene from summary"
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Parse
        </Button>
      </div>

      {/* Content Area */}
      <div className="overflow-y-auto p-6 h-[600px] space-y-4">
        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="scene-location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Location/Setting
          </Label>
          <Input
            id="scene-location"
            value={sceneData.location}
            onChange={(e) => handleFieldChange("location", e.target.value)}
            placeholder="e.g., Dark cavern, Tavern, Forest clearing"
            className="focus-visible-ring"
          />
        </div>

        {/* Vibe/Mood */}
        <div className="space-y-2">
          <Label htmlFor="scene-vibe" className="flex items-center gap-2">
            <Heart className="h-4 w-4" aria-hidden="true" />
            Vibe/Mood
          </Label>
          <Input
            id="scene-vibe"
            value={sceneData.vibeMood}
            onChange={(e) => handleFieldChange("vibeMood", e.target.value)}
            placeholder="e.g., Tense, Relaxed, Mysterious, Joyful"
            className="focus-visible-ring"
          />
        </div>

        {/* Ambience */}
        <div className="space-y-2">
          <Label htmlFor="scene-ambience" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            Ambience
          </Label>
          <Input
            id="scene-ambience"
            value={sceneData.ambience}
            onChange={(e) => handleFieldChange("ambience", e.target.value)}
            placeholder="e.g., Busy, Quiet, Natural, Urban"
            className="focus-visible-ring"
          />
        </div>

        {/* What's Happening */}
        <div className="space-y-2">
          <Label htmlFor="scene-happening" className="flex items-center gap-2">
            <FileText className="h-4 w-4" aria-hidden="true" />
            What's Happening
          </Label>
          <Textarea
            id="scene-happening"
            value={sceneData.whatsHappening}
            onChange={(e) => handleFieldChange("whatsHappening", e.target.value)}
            placeholder="Describe key actions, events, or activities..."
            className="min-h-[80px] focus-visible-ring"
          />
        </div>

        {/* Is Battle */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <Label htmlFor="scene-battle" className="flex items-center gap-2 cursor-pointer">
            <Zap className="h-4 w-4" aria-hidden="true" />
            Is Battle/Combat
          </Label>
          <Switch
            id="scene-battle"
            checked={sceneData.isBattle}
            onCheckedChange={(checked) => handleFieldChange("isBattle", checked)}
            aria-label="Is battle or combat"
          />
        </div>

        {/* Energy Level */}
        <div className="space-y-2">
          <Label htmlFor="scene-energy" className="flex items-center gap-2">
            <Zap className="h-4 w-4" aria-hidden="true" />
            Energy Level
          </Label>
          <Select
            value={sceneData.energyLevel}
            onValueChange={(value) => handleFieldChange("energyLevel", value)}
          >
            <SelectTrigger id="scene-energy" className="focus-visible-ring">
              <SelectValue placeholder="Select energy level" />
            </SelectTrigger>
            <SelectContent>
              {ENERGY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time/Weather */}
        <div className="space-y-2">
          <Label htmlFor="scene-time" className="flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Time/Weather (Optional)
          </Label>
          <Input
            id="scene-time"
            value={sceneData.timeWeather || ""}
            onChange={(e) =>
              handleFieldChange("timeWeather", e.target.value || undefined)
            }
            placeholder="e.g., Night, Rainy, Dawn, Clear skies"
            className="focus-visible-ring"
          />
        </div>

        {/* People/Characters */}
        <div className="space-y-2">
          <Label htmlFor="scene-people" className="flex items-center gap-2">
            <Users className="h-4 w-4" aria-hidden="true" />
            People/Characters (Optional)
          </Label>
          <Input
            id="scene-people"
            value={sceneData.peopleCharacters || ""}
            onChange={(e) =>
              handleFieldChange("peopleCharacters", e.target.value || undefined)
            }
            placeholder="e.g., Party of 4, NPC merchant, Guard"
            className="focus-visible-ring"
          />
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="scene-notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Additional Notes (Optional)
          </Label>
          <Textarea
            id="scene-notes"
            value={sceneData.additionalNotes || ""}
            onChange={(e) =>
              handleFieldChange("additionalNotes", e.target.value || undefined)
            }
            placeholder="Any other details helpful for music generation..."
            className="min-h-[80px] focus-visible-ring"
          />
        </div>

        {/* Music Prompt Display */}
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="scene-music-prompt" className="flex items-center gap-2">
              <Music className="h-4 w-4" aria-hidden="true" />
              Music Prompt
            </Label>
            {sceneData.musicPromptGenerating && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Generating...
              </div>
            )}
            {sceneData.musicPromptError && (
              <div className="text-xs text-red-600 dark:text-red-400">
                {sceneData.musicPromptError}
              </div>
            )}
          </div>
          {sceneData.musicPrompt ? (
            <Textarea
              id="scene-music-prompt"
              value={sceneData.musicPrompt}
              readOnly
              className="min-h-[100px] font-mono text-sm focus-visible-ring bg-muted/50"
              aria-label="Generated music prompt"
            />
          ) : sceneData.musicPromptGenerating ? (
            <div className="min-h-[100px] rounded-md border border-border bg-muted/30 p-4 flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="text-sm">Generating music prompt...</span>
              </div>
            </div>
          ) : (
            <div className="min-h-[100px] rounded-md border border-border bg-muted/30 p-4 flex items-center justify-center">
              <p className="text-sm text-muted-foreground text-center">
                Music prompt will be generated automatically when scene is parsed.
              </p>
            </div>
          )}
        </div>

        {/* Generated Music Display */}
        {sceneData.generatedMusic.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <Label className="flex items-center gap-2">
              <Music className="h-4 w-4" aria-hidden="true" />
              Generated Music ({sceneData.generatedMusic.length})
            </Label>
            <div className="space-y-2">
              {sceneData.generatedMusic.map((song) => (
                <div
                  key={song.id}
                  className="rounded-md border border-border bg-muted/30 p-3 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{song.title}</div>
                    {song.duration && (
                      <div className="text-xs text-muted-foreground">
                        Duration: {Math.floor(song.duration / 60)}:{(song.duration % 60).toFixed(0).padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <a
                    href={song.audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline ml-2"
                  >
                    Play
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
