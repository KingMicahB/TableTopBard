import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { transcribeAudio } from '../services/transcription.js';
import { summarizeText } from '../services/summarization.js';
import { generateMusicPrompt } from '../services/promptGeneration.js';
import { generateMusic, pollMusicStatus } from '../services/suno.js';
import { saveTaskId } from '../services/songHistory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer storage to preserve file extensions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Preserve original extension or default to .webm
    const ext = path.extname(file.originalname) || '.webm';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Configure multer for audio file uploads
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/flac', 'audio/oga'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Audio recording endpoint - receives audio from frontend
router.post('/record', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  res.json({
    success: true,
    message: 'Audio file received and saved',
    filePath: req.file.path,
    filename: req.file.filename,
    size: req.file.size,
  });
});

// Transcription endpoint
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  // Get model from form data (multipart/form-data)
  const model = req.body.model || 'whisper-1'; // Default to whisper-1

  try {
    const result = await transcribeAudio(req.file.path, model);
    res.json({
      success: true,
      transcription: result.text,
      language: result.language,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({
      error: 'Failed to transcribe audio',
      message: error.message,
    });
  }
});

// Summarization endpoint
router.post('/summarize', express.json(), async (req, res) => {
  const { text, prompt, model } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'User prompt is required' });
  }

  const modelToUse = model || 'gpt-5-nano'; // Default model

  try {
    const result = await summarizeText(text, prompt, modelToUse);
    res.json({
      success: true,
      summary: result.summary,
      originalLength: result.originalLength,
      summaryLength: result.summaryLength,
    });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({
      error: 'Failed to summarize text',
      message: error.message,
    });
  }
});

// Music prompt generation endpoint
router.post('/generate-prompt', express.json(), async (req, res) => {
  const { summary, prompt, model } = req.body;

  if (!summary || typeof summary !== 'string') {
    return res.status(400).json({ error: 'Summary is required' });
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'User prompt is required' });
  }

  const modelToUse = model || 'gpt-5-nano'; // Default model

  try {
    const result = await generateMusicPrompt(summary, prompt, modelToUse);
    res.json({
      success: true,
      prompt: result.prompt,
      originalSummary: result.originalSummary,
    });
  } catch (error) {
    console.error('Prompt generation error:', error);
    res.status(500).json({
      error: 'Failed to generate music prompt',
      message: error.message,
    });
  }
});

// Music generation endpoint
router.post('/generate-music', express.json(), async (req, res) => {
  const { prompt, customPrompt, model, instrumental, customMode, style, title, sceneName } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Build options object for Suno API
    const options = {
      model: model || 'V5',
      instrumental: instrumental || false,
      customMode: customMode || false,
      style: style || '',
      title: title || '',
    };

    const result = await generateMusic(prompt, options);
    
    // Save taskId to history if we have one
    if (result.taskId) {
      try {
        saveTaskId(result.taskId, title || null, sceneName || null);
      } catch (historyError) {
        // Log but don't fail the request if history save fails
        console.error('Failed to save taskId to history:', historyError);
      }
    }
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Music generation error:', error);
    res.status(500).json({
      error: 'Failed to generate music',
      message: error.message,
    });
  }
});

// Poll for music generation status endpoint
router.post('/poll-music-status', express.json(), async (req, res) => {
  const { taskId } = req.body;

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  try {
    // Poll once (maxAttempts = 1) to get current status
    const result = await pollMusicStatus(taskId, 1, 15000);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Polling error:', error);
    res.status(500).json({
      error: 'Failed to poll music status',
      message: error.message,
    });
  }
});

// Suno API callback endpoint (optional - we use polling, but API requires callBackUrl)
router.post('/suno-callback', express.json(), (req, res) => {
  console.log('Suno API callback received:', JSON.stringify(req.body, null, 2));
  // We use polling, so we just acknowledge the callback
  res.json({ received: true });
});

// Serve audio files
router.get('/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found' });
  }

  res.sendFile(filePath);
});

export default router;

