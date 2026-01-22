import OpenAI from 'openai';
import { config } from '../config/env.js';
import { systemPrompts } from '../config/systemPrompts.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export const summarizeText = async (text, userPrompt = null, model = 'gpt-5-nano') => {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text is required for summarization');
  }

  if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
    throw new Error('User prompt is required for summarization');
  }

  // Use system prompt from backend config
  const systemPrompt = systemPrompts.summarization;
  let finalUserPrompt = userPrompt;

  // Replace ${text} or {text} placeholder with actual text
  if (finalUserPrompt.includes('${text}') || finalUserPrompt.includes('{text}')) {
    finalUserPrompt = finalUserPrompt.replace(/\$\{text\}|\{text\}/g, text);
  } else {
    // If no placeholder, append text at the end
    finalUserPrompt = `${finalUserPrompt}\n\n${text}`;
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
      temperature: 0.7,
      max_completion_tokens: 2000, // Increased to allow full summaries
    });

    const summary = completion.choices[0]?.message?.content?.trim();
    
    if (!summary) {
      throw new Error('No summary generated');
    }

    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
    };
  } catch (error) {
    console.error('Summarization error:', error);
    throw new Error(`Failed to summarize text: ${error.message}`);
  }
};

