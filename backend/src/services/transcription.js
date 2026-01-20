import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export const transcribeAudio = async (audioFilePath, model = 'whisper-1') => {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  try {
    // Read the audio file
    const audioFile = fs.createReadStream(audioFilePath);
    
    // Get file extension for proper format detection
    const ext = path.extname(audioFilePath).toLowerCase();
    
    // Ensure the stream has a path property with correct extension
    // OpenAI SDK uses this to determine the file format
    if (!ext || ext === '') {
      // If no extension, default to .webm
      audioFile.path = audioFilePath + '.webm';
    } else {
      // Ensure path has the extension
      audioFile.path = audioFilePath;
    }

    // Call OpenAI Whisper API
    // The SDK will use the path property to determine the format
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: model,
      language: 'en', // Optional: specify language for better accuracy
    });

    return {
      text: transcription.text,
      language: transcription.language,
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
};
