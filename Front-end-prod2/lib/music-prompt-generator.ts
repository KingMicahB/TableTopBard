/**
 * Music Prompt Generator
 * Generates music prompts for SceneDetails objects
 */

import { api } from "./api"
import { defaultPrompts } from "./prompts"
import { defaultModels } from "./models"
import type { SceneDetails } from "./scene-details"

/**
 * Generate music prompt for a scene
 */
export async function generateMusicPromptForScene(
  scene: SceneDetails,
  customPrompt?: string,
  model?: string
): Promise<string> {
  // Build scene information string from structured scene data
  const sceneInfoParts: string[] = []
  
  if (scene.name) {
    sceneInfoParts.push(`Scene: ${scene.name}`)
  }
  if (scene.location) {
    sceneInfoParts.push(`Location/Setting: ${scene.location}`)
  }
  if (scene.vibeMood) {
    sceneInfoParts.push(`Vibe/Mood: ${scene.vibeMood}`)
  }
  if (scene.ambience) {
    sceneInfoParts.push(`Ambience: ${scene.ambience}`)
  }
  if (scene.whatsHappening) {
    sceneInfoParts.push(`What's Happening: ${scene.whatsHappening}`)
  }
  if (scene.isBattle) {
    sceneInfoParts.push(`Combat/Battle: Yes`)
  }
  if (scene.energyLevel) {
    sceneInfoParts.push(`Energy Level: ${scene.energyLevel}`)
  }
  if (scene.timeWeather) {
    sceneInfoParts.push(`Time/Weather: ${scene.timeWeather}`)
  }
  if (scene.peopleCharacters) {
    sceneInfoParts.push(`People/Characters: ${scene.peopleCharacters}`)
  }
  if (scene.additionalNotes) {
    sceneInfoParts.push(`Additional Notes: ${scene.additionalNotes}`)
  }

  const sceneInfo = sceneInfoParts.join("\n")

  if (!sceneInfo.trim()) {
    throw new Error("Scene data is incomplete. Please ensure the scene contains information.")
  }

  // Use custom prompt or default
  const promptTemplate = customPrompt || defaultPrompts.musicPromptGeneration
  const promptWithSceneInfo = promptTemplate.replace("{summary}", sceneInfo)
  const selectedModel = model || defaultModels.musicPromptGeneration

  const result = await api.generateMusicPrompt(
    sceneInfo,
    promptWithSceneInfo,
    selectedModel
  )

  if (!result.success || !result.prompt) {
    throw new Error("Failed to generate music prompt")
  }

  return result.prompt
}

/**
 * Generate music prompts for multiple scenes in parallel
 */
export async function generateMusicPromptsForScenes(
  scenes: SceneDetails[],
  customPrompt?: string,
  model?: string,
  onProgress?: (index: number, scene: SceneDetails, prompt: string) => void
): Promise<void> {
  // Generate prompts for all scenes in parallel
  const promises = scenes.map(async (scene, index) => {
    try {
      scene.musicPromptGenerating = true
      const prompt = await generateMusicPromptForScene(scene, customPrompt, model)
      scene.musicPrompt = prompt
      scene.musicPromptGenerating = false
      
      if (onProgress) {
        onProgress(index, scene, prompt)
      }
    } catch (error) {
      scene.musicPromptGenerating = false
      scene.musicPromptError = error instanceof Error ? error.message : "Failed to generate prompt"
      throw error
    }
  })

  await Promise.allSettled(promises)
}
