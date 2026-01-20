import OpenAI from 'openai';
import { config } from '../config/env.js';
import { systemPrompts } from '../config/systemPrompts.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export const generateMusicPrompt = async (summary, userPrompt = null, model = 'gpt-5-nano') => {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (!summary || summary.trim().length === 0) {
    throw new Error('Summary is required for prompt generation');
  }

  if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
    throw new Error('User prompt is required for music prompt generation');
  }

  // Use system prompt from backend config
  const systemPrompt = systemPrompts.musicPromptGeneration;
  let finalUserPrompt = userPrompt;

  // Replace ${summary} or {summary} placeholder with actual summary
  if (finalUserPrompt.includes('${summary}') || finalUserPrompt.includes('{summary}')) {
    finalUserPrompt = finalUserPrompt.replace(/\$\{summary\}|\{summary\}/g, summary);
  } else {
    // If no placeholder, append summary at the end
    finalUserPrompt = `${finalUserPrompt}\n\n${summary}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: finalUserPrompt,
        },
      ],
      temperature: 0.8,
      max_completion_tokens: 300,
    });

    const prompt = completion.choices[0]?.message?.content?.trim();
    
    if (!prompt) {
      throw new Error('No prompt generated');
    }

    return {
      prompt,
      originalSummary: summary,
    };
  } catch (error) {
    console.error('Prompt generation error:', error);
    throw new Error(`Failed to generate music prompt: ${error.message}`);
  }
};

