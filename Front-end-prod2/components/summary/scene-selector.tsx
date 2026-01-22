"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin } from "lucide-react"
import type { SceneDetails } from "@/lib/scene-details"

interface SceneSelectorProps {
  scenes: SceneDetails[]
  selectedIndex: number | null
  onSelectScene: (index: number) => void
  className?: string
}

export function SceneSelector({
  scenes,
  selectedIndex,
  onSelectScene,
  className,
}: SceneSelectorProps) {
  if (scenes.length === 0) {
    return null
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Scenes ({scenes.length})
        </h3>
      </div>
      <ScrollArea className="flex-1 h-full">
        <div className="p-2 space-y-1">
          {scenes.map((scene, index) => (
            <Button
              key={index}
              variant={selectedIndex === index ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-left h-auto py-3 px-3",
                selectedIndex === index && "bg-accent text-accent-foreground"
              )}
              onClick={() => onSelectScene(index)}
            >
              <div className="flex items-start gap-2 w-full">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {scene.name || `Scene ${index + 1}`}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {scene.location && (
                      <div className="text-xs text-muted-foreground truncate">
                        {scene.location}
                      </div>
                    )}
                    {scene.musicPromptGenerating && (
                      <div className="text-xs text-muted-foreground">Generating prompt...</div>
                    )}
                    {scene.musicPrompt && !scene.musicPromptGenerating && (
                      <div className="text-xs text-green-600 dark:text-green-400">✓ Prompt ready</div>
                    )}
                    {scene.musicPromptError && (
                      <div className="text-xs text-red-600 dark:text-red-400">✗ Error</div>
                    )}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
