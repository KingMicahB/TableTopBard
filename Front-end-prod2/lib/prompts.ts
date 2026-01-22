/**
 * User prompts for AI services
 * These are the actual instructions sent to the AI
 * System prompts are managed on the backend
 */

export const defaultPrompts = {
  summarization: `Please summarize the following transcribed text. Break it into distinct scenes, and for each scene provide the following information in a STRICT, PARSEABLE format.

CRITICAL: Use this EXACT format for each scene. Each field must be on its own line with the label followed by a colon and space, then the value:

Location/Setting: [description]
Vibe/Mood: [description]
Ambience: [description]
What's Happening: [description]
Energy Level: [MUST be exactly one of: calm, moderate, energetic, frantic, intense, or relaxed - use lowercase]
Time/Weather: [description if applicable]
People/Characters: [description if applicable]

IMPORTANT FORMATTING RULES:
- Each field label must be followed by a colon and space (": ")
- Each field must be on its own line
- Use the exact field names as shown above (case-sensitive)
- Energy Level MUST be exactly one of these values (lowercase): calm, moderate, energetic, frantic, intense, or relaxed
- If a field doesn't apply, you may omit it (except Energy Level should always be included)
- If the scene involves battle or combat, include "battle" or "combat" in the "What's Happening" field
- Separate each scene with "Scene X: scene name" label

Example format:
---
Location/Setting: Dark cavern with glowing crystals
Vibe/Mood: Tense and mysterious
Ambience: Echoing drips, distant rumbles
What's Happening: Party exploring ancient ruins, preparing for potential danger
Energy Level: moderate
Time/Weather: Night, underground
People/Characters: Party of 4 adventurers
---

Focus on sensory details and emotional context that would help create appropriate background music.

{text}`,
  musicPromptGeneration: `Using the following scene summary, write a detailed Suno AI music generation prompt that evokes the mood, setting, energy, and emotional tone of the scene. This scene is an excerpt from a Dungeons and Dragons campaign. Focus on genre/style, mood, tempo/energy, instrumentation, ambience, and optional vocals or production cues to guide Suno's output.

Template to use:
[GENRE/STYLE: …]
[MOOD/TONE: …]
[TEMPO/ENERGY: … BPM / descriptive energy (e.g., gentle, driving, intense)]
[INSTRUMENTATION: …]
[AMBIENCE/ATMOSPHERE: …]
[USE CASE: … background music for scene description]

{summary}`,
}
