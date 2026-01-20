# TableTopBard

An application that listens to audio via microphone, transcribes it, summarizes the content, generates music prompts, and creates music using Suno AI.

## Architecture

- **Frontend**: React with Vite
- **Backend**: Node.js with Express

## Setup

### Backend

1. Navigate to `backend/` directory
2. Install dependencies: `npm install`
3. Create `.env` file:
   - Copy `env.template` to `.env`: `cp env.template .env`
   - Or create `.env` manually with:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     PORT=3001
     SUNO_API_KEY=placeholder
     ```
   
   Note: If you don't have a Suno API key yet, you can set `SUNO_API_KEY=placeholder` and the app will show a placeholder message. Once you obtain your Suno API credentials, replace `placeholder` with your actual API key.
4. Run: `npm run dev`

### Frontend

1. Navigate to `frontend/` directory
2. Install dependencies: `npm install`
3. Run: `npm run dev`

## Features

The application implements a complete audio-to-music pipeline:

1. ✅ **Audio Recording** - Record audio from microphone using MediaRecorder API
2. ✅ **Audio Reception** - Backend receives and saves audio files
3. ✅ **Transcription** - Uses OpenAI Whisper API to transcribe audio
4. ✅ **Summarization** - Uses OpenAI GPT to create concise summaries
5. ✅ **Music Prompt Generation** - Uses OpenAI GPT to generate music prompts from summaries
6. ✅ **Suno API Integration** - Placeholder structure ready for Suno API integration
7. ✅ **Audio Playback** - Play generated music with download option

## Usage

1. Start the backend server (port 3001)
2. Start the frontend development server (port 3000)
3. Open the application in your browser
4. Click "Start Recording" to begin recording audio
5. Speak into your microphone
6. Click "Stop Recording" to process the audio
7. The app will automatically:
   - Upload the audio
   - Transcribe it
   - Summarize the transcription
   - Generate a music prompt
   - Attempt to generate music (placeholder until Suno API is configured)

## API Endpoints

- `POST /api/audio/record` - Upload audio file
- `POST /api/audio/transcribe` - Transcribe audio
- `POST /api/audio/summarize` - Summarize text
- `POST /api/audio/generate-prompt` - Generate music prompt
- `POST /api/audio/generate-music` - Generate music (placeholder)
- `GET /api/audio/files/:filename` - Serve audio files

## Notes

- The Suno API integration is currently a placeholder. The API key is already configured to be read from `.env`. To complete the integration:
  1. Obtain Suno API credentials
  2. Add your `SUNO_API_KEY` to the `.env` file (replace `placeholder` if you used that)
  3. Implement the actual API call in `backend/src/services/suno.js` (the structure and API key usage are already in place)
  4. The service will automatically use the API key from the environment configuration

- The codebase is structured to easily add Discord integration later through the abstracted audio input interface in `backend/src/services/audioInput/`

