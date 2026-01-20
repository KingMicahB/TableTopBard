# How to Launch Frontend and Backend

## Prerequisites

Before launching, you need to:
1. ✅ Complete `npm install` in both directories (if it's still timing out, see troubleshooting below)
2. ✅ Set up your `.env` file in the `backend/` directory with your OpenAI API key

## Step-by-Step Launch Instructions

### Terminal 1: Backend Server

1. Open a terminal/PowerShell window
2. Navigate to backend directory:
   ```powershell
   cd backend
   ```
3. Make sure `.env` file exists with your OpenAI API key:
   ```powershell
   # Check if .env exists
   Test-Path .env
   
   # If it doesn't exist, copy from template
   Copy-Item env.template .env
   
   # Then edit .env and add your OPENAI_API_KEY
   ```
4. Start the backend server:
   ```powershell
   npm run dev
   ```
5. You should see: `Server running on port 3001`

### Terminal 2: Frontend Server

1. Open a **second** terminal/PowerShell window (keep the backend running!)
2. Navigate to frontend directory:
   ```powershell
   cd frontend
   ```
3. Start the frontend development server:
   ```powershell
   npm run dev
   ```
4. You should see something like:
   ```
   VITE v5.x.x  ready in xxx ms
   
   ➜  Local:   http://localhost:3000/
   ➜  Network: use --host to expose
   ```

### Testing Transcription

1. Open your browser and go to: `http://localhost:3000`
2. Click "Start Recording"
3. Allow microphone access
4. Speak into your microphone
5. Click "Stop Recording"
6. The app will automatically:
   - Upload the audio
   - Transcribe it using OpenAI Whisper
   - Show the transcription on screen

## Troubleshooting npm install Timeout

If `npm install` is still timing out, try these alternatives:

### Option 1: Install packages one at a time

**Backend:**
```powershell
cd backend
npm install express
npm install cors
npm install dotenv
npm install multer
npm install openai
```

**Frontend:**
```powershell
cd frontend
npm install react react-dom
npm install vite @vitejs/plugin-react --save-dev
```

### Option 2: Use yarn instead of npm

```powershell
# Install yarn globally first
npm install -g yarn

# Then use yarn
cd backend
yarn install

cd ../frontend
yarn install
```

### Option 3: Use a different registry with longer timeout

```powershell
cd backend
npm install --registry https://registry.npmjs.org/ --fetch-timeout=600000 --fetch-retries=10
```

## Quick Check Commands

**Check if dependencies are installed:**
```powershell
# Backend
cd backend
Test-Path node_modules

# Frontend
cd frontend
Test-Path node_modules
```

**Check if servers are running:**
- Backend: Visit `http://localhost:3001/health` (should return `{"status":"ok"}`)
- Frontend: Visit `http://localhost:3000` (should show the app)

## Important Notes

- **Keep both terminals open** - you need both servers running simultaneously
- **Backend must be running first** - the frontend connects to it
- **OpenAI API Key is required** - transcription won't work without it
- **Ports must be free** - make sure nothing else is using ports 3000 or 3001
