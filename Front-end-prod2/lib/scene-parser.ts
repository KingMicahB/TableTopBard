/**
 * Scene Parser Utility
 * Parses structured scene data from summary text
 */

import type { SceneData } from "./types"
import { SceneDetails } from "./scene-details"

/**
 * Valid energy level options (must match scene-panel.tsx)
 */
const VALID_ENERGY_LEVELS = ["calm", "moderate", "energetic", "frantic", "intense", "relaxed"] as const

/**
 * Normalize energy level to one of the valid options
 * Returns the first valid match or empty string
 */
function normalizeEnergyLevel(value: string): string {
  if (!value) return ""
  
  const normalized = value.trim().toLowerCase()
  
  // Remove any extra text after the energy level (e.g., "moderate energy" -> "moderate")
  const words = normalized.split(/\s+/)
  const firstWord = words[0]
  
  // Exact match on first word
  const validLevels: readonly string[] = VALID_ENERGY_LEVELS
  if (validLevels.includes(firstWord)) {
    return firstWord
  }
  
  // Exact match on full normalized value
  if (validLevels.includes(normalized)) {
    return normalized
  }
  
  // Partial match - check if any valid level is contained in the value
  for (const level of VALID_ENERGY_LEVELS) {
    if (normalized.includes(level)) {
      return level
    }
    // Also check if the value is contained in a level (for abbreviations)
    if (level.includes(normalized) && normalized.length >= 3) {
      return level
    }
  }
  
  // Try to map common variations
  const mappings: Record<string, string> = {
    "low": "calm",
    "medium": "moderate",
    "high": "energetic",
    "very energetic": "energetic",
    "very calm": "calm",
    "extreme": "frantic",
    "peaceful": "calm",
    "chill": "relaxed",
    "laid back": "relaxed",
    "laid-back": "relaxed",
    "intense": "intense", // already valid
  }
  
  // Check full value first
  if (mappings[normalized]) {
    return mappings[normalized]
  }
  
  // Check first word
  if (mappings[firstWord]) {
    return mappings[firstWord]
  }
  
  // If we still can't determine, return empty string
  // (The UI will handle empty energy level)
  return ""
}

/**
 * Parse a single scene from scene text
 * Helper function used by parseAllScenes and parseLastScene
 */
function parseSceneFromText(sceneText: string): SceneDetails | null {
  if (!sceneText || sceneText.trim().length === 0) {
    return null
  }

  const trimmedText = sceneText.trim()

  // Extract scene name from patterns like "Scene 1: Name" or "Scene: Name"
  let sceneName: string | undefined = undefined
  const sceneNamePatterns = [
    /Scene\s+\d+:\s*(.+?)(?:\n|$)/i,  // "Scene 1: Name"
    /Scene:\s*(.+?)(?:\n|$)/i,        // "Scene: Name"
    /###\s+Scene[:\s]+(.+?)(?:\n|$)/i, // "### Scene: Name"
    /##\s+Scene[:\s]+(.+?)(?:\n|$)/i,  // "## Scene: Name"
    /#\s+Scene[:\s]+(.+?)(?:\n|$)/i,   // "# Scene: Name"
  ]
  
  for (const pattern of sceneNamePatterns) {
    const match = trimmedText.match(pattern)
    if (match && match[1]) {
      sceneName = match[1].trim()
      break
    }
  }

  // Field label patterns - used to detect when a new field starts
  const fieldLabelPattern = /^\s*(?:Location\/Setting|Location:|Setting:|Vibe\/Mood|Vibe:|Mood:|Ambience:|What's Happening|What's happening|Happening:|Energy Level|Energy:|Time\/Weather|Time:|Weather:|People\/Characters|People:|Characters:)/im

  // Extract structured fields using regex patterns
  // Handles multi-line values by matching until next field label or end of text
  const extractField = (label: string, patterns: RegExp[]): string => {
    for (const pattern of patterns) {
      const match = trimmedText.match(pattern)
      if (match && match[1]) {
        let value = match[1]
        
        // Handle multi-line values: continue until we hit a field label or scene divider
        const lines = value.split('\n')
        const cleanedLines: string[] = []
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // If this line starts with a field label, stop here
          if (fieldLabelPattern.test(line) && i > 0) {
            break
          }
          // If this line is a scene divider, stop before it
          if (/^---+\s*$/.test(line.trim()) && i > 0) {
            break
          }
          cleanedLines.push(line)
        }
        
        value = cleanedLines.join('\n')
        
        // Clean up the extracted text
        return value
          .replace(/^:\s*/, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim()
      }
    }
    return ""
  }

  // Extract fields
  const location = extractField("Location", [
    /Location\/Setting:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|Time|People|$|\n---))/i,
    /Location:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|Time|People|$|\n---))/i,
    /Setting:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|Time|People|$|\n---))/i,
  ])

  const vibeMood = extractField("Vibe/Mood", [
    /Vibe\/Mood:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|Time|People|$|\n---))/i,
    /Vibe:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|Time|People|$|\n---))/i,
    /Mood:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|Time|People|$|\n---))/i,
  ])

  const ambience = extractField("Ambience", [
    /Ambience:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|Time|People|$|\n---))/i,
  ])

  const whatsHappening = extractField("What's Happening", [
    /What's Happening:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|Energy|Time|People|$|\n---))/i,
    /What's happening:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|Energy|Time|People|$|\n---))/i,
    /Happening:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|Energy|Time|People|$|\n---))/i,
  ])

  // Energy level should be single-line (one of the valid options)
  let energyLevelRaw = ""
  const patterns = [
    /Energy Level:\s*([^\n]+)/i,
    /Energy:\s*([^\n]+)/i,
  ]
  
  for (const pattern of patterns) {
    const match = trimmedText.match(pattern)
    if (match && match[1]) {
      energyLevelRaw = match[1].trim()
      const nextFieldMatch = energyLevelRaw.match(/^(.+?)(?:\s+Location|\s+Vibe|\s+Ambience|\s+What's|\s+Time|\s+People)/i)
      if (nextFieldMatch && nextFieldMatch[1]) {
        energyLevelRaw = nextFieldMatch[1].trim()
      }
      break
    }
  }
  
  const energyLevel = normalizeEnergyLevel(energyLevelRaw)

  const timeWeather = extractField("Time/Weather", [
    /Time\/Weather:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|People|$|\n---))/i,
    /Time:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|People|$|\n---))/i,
    /Weather:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|People|$|\n---))/i,
  ])

  const peopleCharacters = extractField("People/Characters", [
    /People\/Characters:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|Time|$|\n---))/i,
    /People:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|Time|$|\n---))/i,
    /Characters:\s*([\s\S]+?)(?=\n\s*(?:Location|Vibe|Ambience|What's|Energy|Time|$|\n---))/i,
  ])

  // Check for battle indicators
  const isBattle =
    /battle|combat|fighting|attack|defend|war|conflict/i.test(trimmedText) ||
    /Is Battle:\s*(yes|true|1)/i.test(trimmedText)

  // If no structured fields found, return null
  if (!location && !vibeMood && !ambience && !whatsHappening && !sceneName) {
    return null
  }

  const sceneData: SceneData = {
    name: sceneName,
    location: location || "",
    vibeMood: vibeMood || "",
    ambience: ambience || "",
    whatsHappening: whatsHappening || "",
    isBattle,
    energyLevel: energyLevel,
    timeWeather: timeWeather || undefined,
    peopleCharacters: peopleCharacters || undefined,
    additionalNotes: undefined,
  }

  return new SceneDetails(sceneData)
}

/**
 * Parse all scenes from summary text
 * Returns an array of SceneDetails objects
 */
export function parseAllScenes(summary: string): SceneDetails[] {
  if (!summary || summary.trim().length === 0) {
    return []
  }

  // Try to split by scene markers
  const sceneMarkers = [
    /Scene \d+:/gi,
    /---+/g,
    /### Scene/gi,
    /## Scene/gi,
    /# Scene/gi,
    /\n\n(?=Location|Vibe|Ambience|What's|Energy|Time|People)/gi,
  ]

  let scenes: string[] = []
  let foundMarker = false

  // Try each marker pattern
  for (const marker of sceneMarkers) {
    const matches = Array.from(summary.matchAll(marker))
    if (matches.length > 0) {
      foundMarker = true
      // Found scenes, split by markers
      let startIndex = 0
      for (const match of matches) {
        if (match.index !== undefined && match.index > startIndex) {
          scenes.push(summary.substring(startIndex, match.index))
          startIndex = match.index
        }
      }
      // Add the last scene
      if (startIndex < summary.length) {
        scenes.push(summary.substring(startIndex))
      }
      break
    }
  }

  // If no scenes found, treat entire summary as one scene
  if (!foundMarker) {
    scenes = [summary]
  }

  // Parse each scene
  const parsedScenes: SceneDetails[] = []
  for (const sceneText of scenes) {
    const parsed = parseSceneFromText(sceneText)
    if (parsed) {
      parsedScenes.push(parsed)
    }
  }

  return parsedScenes
}

/**
 * Parse the last scene from summary text
 * Looks for structured format with field labels
 */
export function parseLastScene(summary: string): SceneDetails | null {
  // Use parseAllScenes and return the last one
  const allScenes = parseAllScenes(summary)
  return allScenes.length > 0 ? allScenes[allScenes.length - 1] : null
}

/**
 * Format scene data back to readable text
 */
export function formatSceneForDisplay(scene: SceneData): string {
  const parts: string[] = []

  if (scene.location) parts.push(`Location/Setting: ${scene.location}`)
  if (scene.vibeMood) parts.push(`Vibe/Mood: ${scene.vibeMood}`)
  if (scene.ambience) parts.push(`Ambience: ${scene.ambience}`)
  if (scene.whatsHappening) parts.push(`What's Happening: ${scene.whatsHappening}`)
  if (scene.isBattle) parts.push(`Is Battle: Yes`)
  if (scene.energyLevel) parts.push(`Energy Level: ${scene.energyLevel}`)
  if (scene.timeWeather) parts.push(`Time/Weather: ${scene.timeWeather}`)
  if (scene.peopleCharacters) parts.push(`People/Characters: ${scene.peopleCharacters}`)
  if (scene.additionalNotes) parts.push(`Additional Notes: ${scene.additionalNotes}`)

  return parts.join("\n")
}
