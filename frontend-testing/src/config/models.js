/**
 * OpenAI Model Configuration
 * Default to least expensive models
 */

export const defaultModels = {
  transcription: 'whisper-1', // Only option for transcription
  summarization: 'gpt-3.5-turbo', // Default model
  musicPromptGeneration: 'gpt-3.5-turbo', // Default model
  musicGeneration: 'V5', // Default Suno model
};

export const availableModels = {
  transcription: [
    { value: 'whisper-1', label: 'Whisper-1 (Default)' },
  ],
  summarization: [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Default)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
  ],
  musicPromptGeneration: [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Default)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
  ],
  musicGeneration: [
    { value: 'V5', label: 'V5 - Latest Model (Default)' },
    { value: 'V4_5PLUS', label: 'V4.5 Plus - Richer Tones' },
    { value: 'V4_5ALL', label: 'V4.5 All - Better Song Structure' },
    { value: 'V4_5', label: 'V4.5 - Smart Prompts' },
    { value: 'V4', label: 'V4 - Improved Vocals' },
    { value: 'V3_5', label: 'V3.5 - Older Model' },
  ],
};
