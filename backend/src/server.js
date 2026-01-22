import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config/env.js';
import audioRoutes from './routes/audio.js';
import historyRoutes from './routes/history.js';
import { setupWebSocket } from './routes/websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static audio files
app.use('/api/audio/files', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/audio', audioRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws/transcribe' });

// Setup WebSocket handlers
setupWebSocket(wss);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`WebSocket server available at ws://localhost:${config.port}/ws/transcribe`);
});

