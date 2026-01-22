
/**
 * AI Model Configuration
 * Default to least expensive models
 */

export const defaultModels = {
  summarization: 'gpt-3.5-turbo',
  musicPromptGeneration: 'gpt-3.5-turbo',
  musicGeneration: 'V5',
}

export const availableModels = {
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
}
