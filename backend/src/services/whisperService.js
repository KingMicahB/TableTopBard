/**
 * Whisper Real-Time Transcription Service Client
 * Connects to the Python whisper_service.py service using Socket.IO
 */

import { io } from 'socket.io-client';

// Use 127.0.0.1 instead of localhost to force IPv4 (avoids IPv6 connection issues)
const WHISPER_SERVICE_URL = process.env.WHISPER_SERVICE_URL || 'http://127.0.0.1:5000';
const WHISPER_HTTP_URL = process.env.WHISPER_HTTP_URL || 'http://127.0.0.1:5000';

export const createWhisperProxy = (clientWs, connectionId) => {
  console.log(`[Whisper Proxy] Creating proxy for ${connectionId}`);
  
  // Connect to Python Whisper service using Socket.IO
  const socket = io(WHISPER_SERVICE_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  
  let isConnected = false;
  let sessionId = null;
  
  socket.on('connect', () => {
    console.log(`[Whisper Proxy] ✅ Socket.IO connected to Whisper service for ${connectionId}`);
    console.log(`[Whisper Proxy] Socket ID: ${socket.id}`);
    isConnected = true;
    sessionId = connectionId;
    
    // Send connected message to client
    console.log(`[Whisper Proxy] Sending 'connected' message to client`);
    clientWs.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to Whisper transcription service'
    }));
  });
  
  socket.on('connected', (data) => {
    // Service confirmed connection
    sessionId = data.session_id || connectionId;
    console.log(`[Whisper Proxy] ✅ Service confirmed connection, Session ID: ${sessionId}`);
    console.log(`[Whisper Proxy] Connected data:`, data);
  });
  
  socket.on('transcription', (data) => {
    console.log(`[Whisper Proxy] 📝 Received transcription for ${connectionId}`);
    console.log(`[Whisper Proxy] Transcription data:`, {
      text_length: data.text ? data.text.length : 0,
      current_length: data.current ? data.current.length : 0,
      is_partial: data.is_partial,
      is_final: data.is_final
    });
    // Forward transcription to client
    const clientMessage = {
      type: 'transcription',
      transcript: data.text,
      delta: data.current,
      isPartial: data.is_partial || false,
      isFinal: data.is_final || false
    };
    console.log(`[Whisper Proxy] Forwarding transcription to client`);
    clientWs.send(JSON.stringify(clientMessage));
  });
  
  socket.on('started', (data) => {
    console.log(`[Whisper Proxy] Transcription started for ${connectionId}`);
    clientWs.send(JSON.stringify({
      type: 'started',
      session_id: data.session_id
    }));
  });
  
  socket.on('stopped', (data) => {
    console.log(`[Whisper Proxy] Transcription stopped for ${connectionId}`);
    clientWs.send(JSON.stringify({
      type: 'stopped',
      session_id: data.session_id
    }));
  });
  
  socket.on('error', (error) => {
    console.error(`[Whisper Proxy] Whisper service error for ${connectionId}:`, error);
    clientWs.send(JSON.stringify({
      type: 'error',
      message: error.message || 'Transcription error'
    }));
  });
  
  socket.on('disconnect', () => {
    console.log(`[Whisper Proxy] Whisper service connection closed for ${connectionId}`);
    isConnected = false;
  });
  
  socket.on('connect_error', (error) => {
    console.error(`[Whisper Proxy] Connection error for ${connectionId}:`, error);
    clientWs.send(JSON.stringify({
      type: 'error',
      message: `Connection error: ${error.message}`
    }));
  });
  
  // Handle messages from client
  const handleClientMessage = (message) => {
    try {
      // Message is a Buffer from WebSocket, convert to string first
      let messageStr;
      if (Buffer.isBuffer(message)) {
        messageStr = message.toString('utf8');
      } else if (typeof message === 'string') {
        messageStr = message;
      } else {
        console.error(`[Whisper Proxy] Unknown message type: ${typeof message}`, message);
        return;
      }
      
      console.log(`[Whisper Proxy] Raw message (first 200 chars): ${messageStr.substring(0, 200)}`);
      console.log(`[Whisper Proxy] Message length: ${messageStr.length} bytes`);
      
      const data = JSON.parse(messageStr);
      console.log(`[Whisper Proxy] ✅ Parsed message type: ${data.type}`);
      console.log(`[Whisper Proxy] Message keys:`, Object.keys(data));
      
      if (data.type === 'start') {
        console.log(`[Whisper Proxy] Starting transcription for ${connectionId}`);
        console.log(`[Whisper Proxy] Connection status: ${isConnected ? 'connected' : 'not connected'}`);
        const startData = {
          model: data.model || 'base.en',
          phrase_timeout: data.phrase_timeout || 1.0
        };
        console.log(`[Whisper Proxy] Start data:`, startData);
        
        if (isConnected) {
          console.log(`[Whisper Proxy] Emitting 'start' event to Whisper service`);
          socket.emit('start', startData);
        } else {
          console.log(`[Whisper Proxy] Waiting for connection before starting...`);
          // Wait for connection
          socket.once('connect', () => {
            console.log(`[Whisper Proxy] Connection established, now emitting 'start' event`);
            socket.emit('start', startData);
          });
        }
      } else if (data.type === 'audio') {
        const audioDataLength = data.data ? data.data.length : 0;
        console.log(`[Whisper Proxy] Received audio chunk for ${connectionId}: ${audioDataLength} bytes (base64)`);
        console.log(`[Whisper Proxy] Connection status: ${isConnected ? 'connected' : 'NOT CONNECTED'}`);
        console.log(`[Whisper Proxy] Socket connected: ${socket.connected ? 'yes' : 'no'}`);
        console.log(`[Whisper Proxy] is_final: ${data.is_final || false}`);
        
        if (!isConnected) {
          console.log(`[Whisper Proxy] ⚠️ Not connected yet, waiting for ${connectionId}`);
          return;
        }
        
        if (!socket.connected) {
          console.log(`[Whisper Proxy] ⚠️ Socket not connected, cannot send audio`);
          return;
        }
        
        // Forward audio to Whisper service
        const audioPayload = {
          audio: data.data, // Already base64 from client
          is_final: data.is_final || false
        };
        console.log(`[Whisper Proxy] Emitting 'audio' event to Whisper service (${audioDataLength} bytes base64)`);
        socket.emit('audio', audioPayload);
        console.log(`[Whisper Proxy] ✅ Audio event emitted successfully`);
      } else if (data.type === 'stop') {
        console.log(`[Whisper Proxy] Stopping transcription for ${connectionId}`);
        if (isConnected) {
          console.log(`[Whisper Proxy] Emitting 'stop' event to Whisper service`);
          socket.emit('stop');
        } else {
          console.log(`[Whisper Proxy] ⚠️ Cannot stop - not connected`);
        }
      } else if (data.type === 'commit') {
        console.log(`[Whisper Proxy] Commit requested for ${connectionId}`);
        // For Whisper service, commits are handled automatically
        // But we can send the current buffer as final
        if (isConnected) {
          console.log(`[Whisper Proxy] Emitting empty audio with is_final=true`);
          socket.emit('audio', {
            audio: '', // Empty to trigger processing
            is_final: true
          });
        } else {
          console.log(`[Whisper Proxy] ⚠️ Cannot commit - not connected`);
        }
      } else {
        console.log(`[Whisper Proxy] Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error(`[Whisper Proxy] ❌ Error handling client message:`, error);
      console.error(`[Whisper Proxy] Error stack:`, error.stack);
    }
  };
  
  // Cleanup function
  const cleanup = () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  };
  
  return {
    handleMessage: handleClientMessage,
    cleanup
  };
};

/**
 * HTTP endpoint for transcribing audio (fallback)
 */
export const transcribeAudioHTTP = async (audioBase64, sessionId = 'default', isFinal = false) => {
  try {
    const response = await fetch(`${WHISPER_HTTP_URL}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        audio: audioBase64,
        is_final: isFinal
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Whisper Service] HTTP transcription error:', error);
    throw error;
  }
};
