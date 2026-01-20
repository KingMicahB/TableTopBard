/**
 * User prompts for AI services
 * These are the actual instructions sent to the AI
 * System prompts are managed on the backend in systemPrompts.js
 */

export const defaultPrompts = {
  summarization: 'Please summarize the following transcribed text. Make a special note of:\n\n- Location/Setting: Where they likely are (indoor/outdoor, specific place, environment)\n- Vibe/Mood: The emotional tone and atmosphere (tense, relaxed, mysterious, joyful, etc.)\n- Ambience: The surrounding environment sounds and atmosphere (busy, quiet, natural, urban, etc.)\n- What\'s Happening: Key actions, events, or activities taking place\n- Energy Level: The intensity or pace of the scene (calm, energetic, frantic, etc.)\n- Time/Weather: Time of day, weather conditions, or environmental factors if mentioned\n- People/Characters: Who is involved and their roles or relationships\n\nFocus on sensory details and emotional context that would help create appropriate background music.\n\n${text}',
  
  musicPromptGeneration: 'Based on the following summary, create a detailed music generation prompt for Suno AI:\n\n${summary}\n\nGenerate a prompt that captures the essence and mood of this content.',
  
  musicGeneration: 'Generate music based on the following prompt:\n\n${prompt}',
};
