import { createRealtimeProxy } from '../services/realtimeTranscription.js';
import { createWhisperProxy } from '../services/whisperService.js';

// Store active connections
const connections = new Map();

export const setupWebSocket = (wss) => {
  wss.on('connection', (ws, req) => {
    const connectionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[WebSocket] New connection: ${connectionId}`);
    
    // Check which transcription service to use
    const url = new URL(req.url, `http://${req.headers.host}`);
    const useRealtime = url.searchParams.get('realtime') === 'true';
    const useWhisper = url.searchParams.get('whisper') === 'true' || !useRealtime;
    
    if (useWhisper) {
      // Use Python Whisper service
      console.log(`[WebSocket] Using Whisper service for ${connectionId}`);
      const whisperProxy = createWhisperProxy(ws, connectionId);
      if (whisperProxy) {
        connections.set(connectionId, { ws, proxy: whisperProxy, type: 'whisper' });
        
        // Forward messages from client to Whisper service
        ws.on('message', (message) => {
          console.log(`[WebSocket] Received message from client ${connectionId}, length: ${message.length} bytes`);
          try {
            const parsed = JSON.parse(message.toString());
            console.log(`[WebSocket] Message type: ${parsed.type}`);
            if (parsed.type === 'audio') {
              const audioSize = parsed.data ? parsed.data.length : 0;
              console.log(`[WebSocket] Audio data size: ${audioSize} bytes (base64)`);
            }
          } catch (e) {
            console.log(`[WebSocket] Message is not JSON, raw length: ${message.length}`);
          }
          
          const connection = connections.get(connectionId);
          if (connection && connection.proxy && connection.proxy.handleMessage) {
            console.log(`[WebSocket] Forwarding message to Whisper proxy`);
            connection.proxy.handleMessage(message);
          } else {
            console.log(`[WebSocket] ⚠️ No proxy handler found for ${connectionId}`);
          }
        });
      }
    } else if (useRealtime) {
      // Use OpenAI Realtime API proxy
      console.log(`[WebSocket] Using Realtime API for ${connectionId}`);
      const openaiWs = createRealtimeProxy(ws, connectionId);
      if (openaiWs) {
        connections.set(connectionId, { ws, openaiWs, type: 'realtime' });
      }
    } else {
      // Default to Whisper service
      console.log(`[WebSocket] Defaulting to Whisper service for ${connectionId}`);
      const whisperProxy = createWhisperProxy(ws, connectionId);
      if (whisperProxy) {
        connections.set(connectionId, { ws, proxy: whisperProxy, type: 'whisper' });
        
        ws.on('message', (message) => {
          console.log(`[WebSocket] Received message from client ${connectionId}, length: ${message.length} bytes`);
          try {
            const parsed = JSON.parse(message.toString());
            console.log(`[WebSocket] Message type: ${parsed.type}`);
            if (parsed.type === 'audio') {
              const audioSize = parsed.data ? parsed.data.length : 0;
              console.log(`[WebSocket] Audio data size: ${audioSize} bytes (base64)`);
            }
          } catch (e) {
            console.log(`[WebSocket] Message is not JSON, raw length: ${message.length}`);
          }
          
          const connection = connections.get(connectionId);
          if (connection && connection.proxy && connection.proxy.handleMessage) {
            console.log(`[WebSocket] Forwarding message to Whisper proxy`);
            connection.proxy.handleMessage(message);
          } else {
            console.log(`[WebSocket] ⚠️ No proxy handler found for ${connectionId}`);
          }
        });
      }
    }

    ws.on('close', () => {
      console.log(`[WebSocket] Connection closed: ${connectionId}`);
      const connection = connections.get(connectionId);
      if (connection) {
        if (connection.openaiWs) {
          connection.openaiWs.close();
        }
        if (connection.proxy && connection.proxy.cleanup) {
          connection.proxy.cleanup();
        }
      }
      connections.delete(connectionId);
    });

    ws.on('error', (error) => {
      console.error(`[WebSocket] Error on connection ${connectionId}:`, error);
      connections.delete(connectionId);
    });
  });
};
