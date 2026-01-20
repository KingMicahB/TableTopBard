import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  sunoApiKey: process.env.SUNO_API_KEY || '',
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`,
};

