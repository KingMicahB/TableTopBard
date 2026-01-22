"use client"

import { useState } from "react"
import { X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { CaptionSettings } from "@/lib/types"
import { PromptEditor } from "@/components/summary/prompt-editor"
import { ModelSelector } from "@/components/summary/model-selector"
import { availableModels } from "@/lib/models"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: CaptionSettings
  onSettingsChange: (settings: CaptionSettings) => void
  prompts?: {
    summarization: string
    musicPromptGeneration: string
  }
  onPromptsChange?: (prompts: { summarization: string; musicPromptGeneration: string }) => void
  selectedModels?: {
    summarization: string
    musicPromptGeneration: string
    musicGeneration: string
  }
  onModelsChange?: (models: { summarization: string; musicPromptGeneration: string; musicGeneration: string }) => void
}

export function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  prompts,
  onPromptsChange,
  selectedModels,
  onModelsChange,
}: SettingsPanelProps) {
  const [isPromptsOpen, setIsPromptsOpen] = useState(true)
  const [isModelsOpen, setIsModelsOpen] = useState(true)
  
  const updateSetting = <K extends keyof CaptionSettings>(
    key: K,
    value: CaptionSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Caption Settings</SheetTitle>
          <SheetDescription>
            Customize the appearance and behavior of live captions.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          {/* Typography Section */}
          <section aria-labelledby="typography-heading">
            <h3
              id="typography-heading"
              className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Typography
            </h3>

            <div className="space-y-4">
              {/* Font Size */}
              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <Select
                  value={settings.fontSize}
                  onValueChange={(value) =>
                    updateSetting(
                      "fontSize",
                      value as CaptionSettings["fontSize"]
                    )
                  }
                >
                  <SelectTrigger id="font-size" className="focus-visible-ring">
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (18px)</SelectItem>
                    <SelectItem value="medium">Medium (24px)</SelectItem>
                    <SelectItem value="large">Large (30px)</SelectItem>
                    <SelectItem value="xlarge">Extra Large (36px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Family */}
              <div className="space-y-2">
                <Label htmlFor="font-family">Font Family</Label>
                <Select
                  value={settings.fontFamily}
                  onValueChange={(value) =>
                    updateSetting(
                      "fontFamily",
                      value as CaptionSettings["fontFamily"]
                    )
                  }
                >
                  <SelectTrigger id="font-family" className="focus-visible-ring">
                    <SelectValue placeholder="Select font family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans">Sans-serif (Default)</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="mono">Monospace</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Line Height */}
              <div className="space-y-2">
                <Label htmlFor="line-height">Line Spacing</Label>
                <Select
                  value={settings.lineHeight}
                  onValueChange={(value) =>
                    updateSetting(
                      "lineHeight",
                      value as CaptionSettings["lineHeight"]
                    )
                  }
                >
                  <SelectTrigger id="line-height" className="focus-visible-ring">
                    <SelectValue placeholder="Select line spacing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="relaxed">Relaxed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Colors Section */}
          <section aria-labelledby="colors-heading">
            <h3
              id="colors-heading"
              className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Colors
            </h3>

            <div className="space-y-4">
              {/* Text Color */}
              <div className="space-y-2">
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="text-color"
                    value={settings.textColor}
                    onChange={(e) => updateSetting("textColor", e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-input"
                    aria-label="Select text color"
                  />
                  <input
                    type="text"
                    value={settings.textColor}
                    onChange={(e) => updateSetting("textColor", e.target.value)}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible-ring"
                    placeholder="#ffffff"
                    aria-label="Text color hex value"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <Label htmlFor="bg-color">Background Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="bg-color"
                    value={settings.backgroundColor}
                    onChange={(e) =>
                      updateSetting("backgroundColor", e.target.value)
                    }
                    className="h-10 w-14 cursor-pointer rounded border border-input"
                    aria-label="Select background color"
                  />
                  <input
                    type="text"
                    value={settings.backgroundColor}
                    onChange={(e) =>
                      updateSetting("backgroundColor", e.target.value)
                    }
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible-ring"
                    placeholder="#000000"
                    aria-label="Background color hex value"
                  />
                </div>
              </div>

              {/* Background Opacity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bg-opacity">Background Opacity</Label>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(settings.backgroundOpacity * 100)}%
                  </span>
                </div>
                <Slider
                  id="bg-opacity"
                  value={[settings.backgroundOpacity]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={([value]) =>
                    updateSetting("backgroundOpacity", value)
                  }
                  className="focus-visible-ring"
                  aria-label="Background opacity"
                />
              </div>
            </div>
          </section>

          {/* Display Options Section */}
          <section aria-labelledby="display-heading">
            <h3
              id="display-heading"
              className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Display Options
            </h3>

            <div className="space-y-4">
              {/* Show Speaker Labels */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="speaker-labels">Speaker Labels</Label>
                  <p className="text-xs text-muted-foreground">
                    Show speaker identification
                  </p>
                </div>
                <Switch
                  id="speaker-labels"
                  checked={settings.showSpeakerLabels}
                  onCheckedChange={(checked) =>
                    updateSetting("showSpeakerLabels", checked)
                  }
                  className="focus-visible-ring"
                />
              </div>

              {/* Show Timestamps */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="timestamps">Timestamps</Label>
                  <p className="text-xs text-muted-foreground">
                    Show time for each segment
                  </p>
                </div>
                <Switch
                  id="timestamps"
                  checked={settings.showTimestamps}
                  onCheckedChange={(checked) =>
                    updateSetting("showTimestamps", checked)
                  }
                  className="focus-visible-ring"
                />
              </div>

              {/* Show Confidence */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="confidence">Confidence Scores</Label>
                  <p className="text-xs text-muted-foreground">
                    Show transcription accuracy
                  </p>
                </div>
                <Switch
                  id="confidence"
                  checked={settings.showConfidence}
                  onCheckedChange={(checked) =>
                    updateSetting("showConfidence", checked)
                  }
                  className="focus-visible-ring"
                />
              </div>

              {/* Highlight Current Word */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="highlight-word">Highlight Current Word</Label>
                  <p className="text-xs text-muted-foreground">
                    Emphasize the latest word
                  </p>
                </div>
                <Switch
                  id="highlight-word"
                  checked={settings.highlightCurrentWord}
                  onCheckedChange={(checked) =>
                    updateSetting("highlightCurrentWord", checked)
                  }
                  className="focus-visible-ring"
                />
              </div>
            </div>
          </section>

          {/* Preview Section */}
          <section aria-labelledby="preview-heading">
            <h3
              id="preview-heading"
              className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Preview
            </h3>

            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: settings.backgroundColor,
                opacity: settings.backgroundOpacity,
              }}
            >
              <p
                className={`
                  ${settings.fontSize === "small" ? "text-lg" : ""}
                  ${settings.fontSize === "medium" ? "text-2xl" : ""}
                  ${settings.fontSize === "large" ? "text-3xl" : ""}
                  ${settings.fontSize === "xlarge" ? "text-4xl" : ""}
                  ${settings.fontFamily === "sans" ? "font-sans" : ""}
                  ${settings.fontFamily === "serif" ? "font-serif" : ""}
                  ${settings.fontFamily === "mono" ? "font-mono" : ""}
                  ${settings.lineHeight === "compact" ? "leading-snug" : ""}
                  ${settings.lineHeight === "normal" ? "leading-normal" : ""}
                  ${settings.lineHeight === "relaxed" ? "leading-relaxed" : ""}
                `}
                style={{ color: settings.textColor }}
              >
                {settings.showSpeakerLabels && (
                  <span className="mr-2 font-semibold">Speaker 1:</span>
                )}
                This is a preview of your caption settings.
              </p>
            </div>
          </section>

          {/* AI Prompts Section */}
          {prompts && onPromptsChange && (
            <section aria-labelledby="prompts-heading">
              <button
                type="button"
                onClick={() => setIsPromptsOpen(!isPromptsOpen)}
                className="flex w-full items-center justify-between mb-4 hover:opacity-80 transition-opacity"
              >
                <h3
                  id="prompts-heading"
                  className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  AI Prompts
                </h3>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 text-muted-foreground ${
                    isPromptsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isPromptsOpen && (
                <div className="space-y-6">
                  {/* Summarization Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="summarization-prompt">Summarization Prompt</Label>
                    <PromptEditor
                      prompt={prompts.summarization}
                      onChange={(value) =>
                        onPromptsChange({
                          ...prompts,
                          summarization: value,
                        })
                      }
                      placeholder="Enter your summarization prompt. Use {text} as a placeholder for the transcription."
                    />
                  </div>

                  {/* Music Prompt Generation */}
                  <div className="space-y-2">
                    <Label htmlFor="music-prompt-generation">Music Prompt Generation</Label>
                    <PromptEditor
                      prompt={prompts.musicPromptGeneration}
                      onChange={(value) =>
                        onPromptsChange({
                          ...prompts,
                          musicPromptGeneration: value,
                        })
                      }
                      placeholder="Enter your music prompt generation prompt. Use {summary} as a placeholder for the scene information."
                    />
                  </div>
                </div>
              )}
            </section>
          )}

          {/* AI Models Section */}
          {selectedModels && onModelsChange && (
            <section aria-labelledby="models-heading" className="mt-6">
              <button
                type="button"
                onClick={() => setIsModelsOpen(!isModelsOpen)}
                className="flex w-full items-center justify-between mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <h3 id="models-heading">AI Models</h3>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isModelsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isModelsOpen && (
                <div className="space-y-6">
                  {/* Summarization Model */}
                  <div className="space-y-2">
                    <Label htmlFor="summarization-model">Summarization Model</Label>
                    <ModelSelector
                      value={selectedModels.summarization}
                      onChange={(value) =>
                        onModelsChange({
                          ...selectedModels,
                          summarization: value,
                        })
                      }
                      models={availableModels.summarization}
                      label=""
                    />
                  </div>

                  {/* Music Prompt Generation Model */}
                  <div className="space-y-2">
                    <Label htmlFor="music-prompt-model">Music Prompt Generation Model</Label>
                    <ModelSelector
                      value={selectedModels.musicPromptGeneration}
                      onChange={(value) =>
                        onModelsChange({
                          ...selectedModels,
                          musicPromptGeneration: value,
                        })
                      }
                      models={availableModels.musicPromptGeneration}
                      label=""
                    />
                  </div>

                  {/* Music Generation Model (Suno) */}
                  <div className="space-y-2">
                    <Label htmlFor="music-generation-model">Music Generation Model (Suno)</Label>
                    <ModelSelector
                      value={selectedModels.musicGeneration}
                      onChange={(value) =>
                        onModelsChange({
                          ...selectedModels,
                          musicGeneration: value,
                        })
                      }
                      models={availableModels.musicGeneration}
                      label=""
                    />
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
