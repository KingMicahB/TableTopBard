import { createRealtimeProxy } from '../services/realtimeTranscription.js';

// Store active connections
const connections = new Map();

export const setupWebSocket = (wss) => {
  wss.on('connection', (ws, req) => {
    const connectionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[WebSocket] New connection: ${connectionId}`);
    
    // Check if this is a realtime transcription request
    const url = new URL(req.url, `http://${req.headers.host}`);
    const useRealtime = url.searchParams.get('realtime') === 'true';
    
    if (useRealtime) {
      // Use OpenAI Realtime API proxy
      const openaiWs = createRealtimeProxy(ws, connectionId);
      if (openaiWs) {
        connections.set(connectionId, { ws, openaiWs, type: 'realtime' });
      }
    } else {
      // Fallback: send error for non-realtime connections
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Please use ?realtime=true parameter for transcription',
      }));
      ws.close();
    }

    ws.on('close', () => {
      console.log(`[WebSocket] Connection closed: ${connectionId}`);
      const connection = connections.get(connectionId);
      if (connection && connection.openaiWs) {
        connection.openaiWs.close();
      }
      connections.delete(connectionId);
    });

    ws.on('error', (error) => {
      console.error(`[WebSocket] Error on connection ${connectionId}:`, error);
      connections.delete(connectionId);
    });
  });
};
