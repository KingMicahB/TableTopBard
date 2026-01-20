/**
 * OpenAI Realtime API Proxy Service
 * Proxies WebSocket connection to OpenAI Realtime API for security (API key stays on backend)
 */

import { config } from '../config/env.js';
import WebSocket from 'ws';

export const createRealtimeProxy = (clientWs, connectionId) => {
  if (!config.openaiApiKey) {
    clientWs.send(JSON.stringify({
      type: 'error',
      message: 'OpenAI API key not configured',
    }));
    return null;
  }

  // Connect to OpenAI Realtime API
  // Use regular realtime endpoint with a model, then configure transcription via session.update
  // For transcription, we can use gpt-4o-realtime-preview or similar, then configure transcription
  const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
    headers: {
      'Authorization': `Bearer ${config.openaiApiKey}`,
      'OpenAI-Beta': 'realtime=v1',
    },
  });

  let sessionInitialized = false;
  let isOpenAIConnected = false;
  let audioBufferSize = 0; // Track audio buffer size in bytes (to estimate duration)
  // At 24kHz mono PCM16: 24000 samples/sec * 2 bytes/sample = 48000 bytes/sec
  // 100ms = 0.1 sec = 4800 bytes minimum
  const MIN_AUDIO_BYTES = 4800; // ~100ms of audio at 24kHz PCM16
  const messageQueue = []; // Queue messages until connection is ready

  openaiWs.on('open', () => {
    console.log(`[Realtime Proxy] Connected to OpenAI for ${connectionId}`);
    isOpenAIConnected = true;
    
    // For transcription sessions (intent=transcription), the session is already configured
    // We don't need to send session.update - just wait for session.created event
    // The transcription model and settings are handled automatically
    console.log(`[Realtime Proxy] Waiting for session initialization...`);
    
    // Process any queued messages once connected
    processMessageQueue();
  });
  
  const processMessageQueue = () => {
    if (!isOpenAIConnected || openaiWs.readyState !== WebSocket.OPEN || !sessionInitialized) {
      return;
    }
    
    // Process queued messages
    while (messageQueue.length > 0) {
      const queuedMessage = messageQueue.shift();
      try {
        handleClientMessage(queuedMessage);
      } catch (error) {
        console.error(`[Realtime Proxy] Error processing queued message:`, error);
      }
    }
  };
  
  const handleClientMessage = (message) => {
    console.log(`[Realtime Proxy] Received client message type: ${message.type} for ${connectionId}`);
    
    // Check if OpenAI WebSocket is ready
    if (!isOpenAIConnected || openaiWs.readyState !== WebSocket.OPEN) {
      console.log(`[Realtime Proxy] OpenAI WebSocket not ready (state: ${openaiWs.readyState}), queuing message for ${connectionId}`);
      messageQueue.push(message);
      return;
    }

    // Wait for session to be initialized before sending audio
    // But allow session.update to go through immediately
    if (!sessionInitialized && (message.type === 'audio' || message.type === 'start')) {
      console.log(`[Realtime Proxy] Session not initialized yet, queuing message for ${connectionId}`);
      messageQueue.push(message);
      return;
    }
    
    // Also handle session.update from client (though we send it server-side)
    if (message.type === 'session.update') {
      // Forward session.update to OpenAI
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(JSON.stringify(message));
        console.log(`[Realtime Proxy] Forwarded session.update from client for ${connectionId}`);
      }
      return;
    }
    
    if (message.type === 'audio') {
      // Only send non-empty audio data
      if (!message.data || message.data.length === 0) {
        console.log(`[Realtime Proxy] Skipping empty audio data for ${connectionId}`);
        return;
      }
      
      // Decode base64 to get actual byte length
      try {
        const audioBytes = Buffer.from(message.data, 'base64');
        audioBufferSize += audioBytes.length;
        
        // Log periodically (every ~1 second of audio = 48000 bytes)
        if (audioBufferSize % 48000 < audioBytes.length) {
          console.log(`[Realtime Proxy] Audio buffer size: ${audioBufferSize} bytes for ${connectionId}`);
        }
        
        // Send audio data to OpenAI
        openaiWs.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: message.data,
        }));
      } catch (error) {
        console.error(`[Realtime Proxy] Error processing audio data for ${connectionId}:`, error);
      }
    } else if (message.type === 'commit') {
      // Only commit if we have at least 100ms of audio (4800 bytes at 24kHz PCM16)
      // With server VAD, commits usually happen automatically when speech is detected
      // Manual commits are only needed in special cases
      if (audioBufferSize < MIN_AUDIO_BYTES) {
        console.log(`[Realtime Proxy] Skipping commit - buffer too small (${audioBufferSize} bytes, need ${MIN_AUDIO_BYTES}) for ${connectionId}`);
        return;
      }
      console.log(`[Realtime Proxy] Committing audio buffer (${audioBufferSize} bytes) for ${connectionId}`);
      // Commit audio buffer
      // Note: Server VAD will handle most commits automatically
      openaiWs.send(JSON.stringify({
        type: 'input_audio_buffer.commit',
      }));
      // Don't reset audioBufferSize here - wait for input_audio_buffer.committed event
    } else if (message.type === 'start') {
      // Start recording - reset audio buffer
      console.log(`[Realtime Proxy] Recording started for ${connectionId}`);
      audioBufferSize = 0; // Reset buffer size when starting new recording
      // Don't send empty audio buffer - wait for actual audio chunks
    } else if (message.type === 'stop') {
      // Stop recording - only commit if we have enough audio data (at least 100ms)
      console.log(`[Realtime Proxy] Stop received, buffer size: ${audioBufferSize} bytes for ${connectionId}`);
      if (audioBufferSize >= MIN_AUDIO_BYTES) {
        console.log(`[Realtime Proxy] Committing final audio buffer on stop for ${connectionId}`);
        openaiWs.send(JSON.stringify({
          type: 'input_audio_buffer.commit',
        }));
        // Don't reset audioBufferSize here - wait for input_audio_buffer.committed event
        // Note: Keep connection open to receive transcription events
        console.log(`[Realtime Proxy] Waiting for transcription events for ${connectionId}...`);
      } else {
        console.log(`[Realtime Proxy] Stop called but buffer too small (${audioBufferSize} bytes, need ${MIN_AUDIO_BYTES}) for ${connectionId}`);
      }
    }
  };

  openaiWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Log all message types for debugging
      if (message.type) {
        const isTranscriptionEvent = message.type.includes('input_audio_transcription');
        const isConversationEvent = message.type.includes('conversation');
        
        if (isTranscriptionEvent) {
          console.log(`[Realtime Proxy] Transcription event: ${message.type} for ${connectionId}`);
          // Log the full message structure for transcription events to debug
          console.log(`[Realtime Proxy] Transcription event data:`, JSON.stringify(message, null, 2));
        } else if (isConversationEvent) {
          console.log(`[Realtime Proxy] Conversation event: ${message.type} for ${connectionId}`);
          // Log conversation events to see their structure
          console.log(`[Realtime Proxy] Conversation event data:`, JSON.stringify(message, null, 2));
        } else {
          console.log(`[Realtime Proxy] Received event: ${message.type} for ${connectionId}`);
        }
      }
      
      // Handle conversation.item.created - transcription might be embedded here
      if (message.type === 'conversation.item.created') {
        console.log(`[Realtime Proxy] Item created, waiting for transcription events for ${connectionId}`);
        console.log(`[Realtime Proxy] Item content:`, JSON.stringify(message.item?.content, null, 2));
        // Check if transcription is already available in the created item
        const transcription = message.item?.input_audio_transcription;
        if (transcription) {
          const transcriptionText = transcription.text || transcription.transcript || '';
          if (transcriptionText) {
            console.log(`[Realtime Proxy] Found transcription in item.created: "${transcriptionText}" for ${connectionId}`);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'transcription',
                text: transcriptionText,
                isPartial: false,
              }));
              console.log(`[Realtime Proxy] Sent transcription to client for ${connectionId}`);
            }
            audioBufferSize = 0;
          }
        } else {
          console.log(`[Realtime Proxy] No transcription in item.created - waiting for separate transcription events for ${connectionId}`);
        }
      }
      
      // Forward transcription events to client
      if (
        message.type === 'conversation.item.input_audio_transcription.completed' ||
        message.type === 'conversation.item.input_audio_transcription.delta'
      ) {
        // Extract transcription text
        // According to docs: completed has 'text' in item.input_audio_transcription, delta has 'delta' field
        let transcriptionText = '';
        
        if (message.type === 'conversation.item.input_audio_transcription.completed') {
          // Completed event - transcript is at the top level according to OpenAI docs
          transcriptionText = message.transcript || '';
          console.log(`[Realtime Proxy] Completed transcription: "${transcriptionText}" for ${connectionId}`);
          // Server committed and processed this audio, reset our buffer counter
          audioBufferSize = 0;
        } else if (message.type === 'conversation.item.input_audio_transcription.delta') {
          // Delta event has 'delta' field with incremental text at the top level
          transcriptionText = message.delta || '';
          console.log(`[Realtime Proxy] Delta transcription: "${transcriptionText}" for ${connectionId}`);
        }

        if (transcriptionText) {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'transcription',
              text: transcriptionText,
              isPartial: message.type === 'conversation.item.input_audio_transcription.delta',
            }));
            console.log(`[Realtime Proxy] ✅ Sent transcription to client: "${transcriptionText}" for ${connectionId}`);
          } else {
            console.warn(`[Realtime Proxy] ⚠️ Client WebSocket not open (state: ${clientWs.readyState}) - transcription received but client disconnected: "${transcriptionText}" for ${connectionId}`);
            // Even if client disconnected, we should try to send it in case they reconnect
            // But for now, just log it
          }
        } else {
          console.warn(`[Realtime Proxy] Empty transcription text in ${message.type} for ${connectionId}`);
        }
      } else if (message.type === 'input_audio_buffer.committed') {
        // Server automatically committed the buffer (via VAD)
        console.log(`[Realtime Proxy] Server auto-committed audio buffer for ${connectionId}`);
        audioBufferSize = 0; // Reset counter
      } else if (message.type === 'error') {
        console.error(`[Realtime Proxy] OpenAI error for ${connectionId}:`, message);
        clientWs.send(JSON.stringify({
          type: 'error',
          message: message.error?.message || 'Unknown error',
        }));
      } else if (
        message.type === 'session.created' || 
        message.type === 'session.updated' ||
        message.type === 'transcription_session.created'
      ) {
        // Handle session.updated to confirm transcription is enabled
        if (message.type === 'session.updated') {
          const session = message.session || message;
          const transcriptionConfig = session?.input_audio_transcription;
          if (transcriptionConfig && transcriptionConfig.model) {
            console.log(`[Realtime Proxy] ✅ Transcription confirmed enabled: ${transcriptionConfig.model} for ${connectionId}`);
            console.log(`[Realtime Proxy] Session.updated config:`, JSON.stringify({
              input_audio_transcription: transcriptionConfig,
              turn_detection: session?.turn_detection,
            }, null, 2));
            
            // Now that transcription is confirmed enabled, send "connected" to client
            // Use a flag to track if we've sent "connected" already
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'connected',
                connectionId,
              }));
              console.log(`[Realtime Proxy] ✅ Sent "connected" message to client after transcription enabled for ${connectionId}`);
              sessionInitialized = true;
              // Process any queued messages now that session is ready
              processMessageQueue();
            }
          } else {
            console.warn(`[Realtime Proxy] ⚠️ Transcription still not enabled after update for ${connectionId}`);
            console.warn(`[Realtime Proxy] Session.updated structure:`, JSON.stringify(session, null, 2));
          }
        }
        
        // Session ready - handle both regular sessions and transcription sessions
        if (message.type === 'session.created' || message.type === 'transcription_session.created') {
          console.log(`[Realtime Proxy] Session created for ${connectionId}, ready for audio`);
          // Log the full message to see the actual structure
          console.log(`[Realtime Proxy] Full session event:`, JSON.stringify(message, null, 2));
          
          // Check if transcription is configured
          // Session structure is flat: input_audio_transcription (not audio.input.transcription)
          const session = message.session || message;
          const transcriptionConfig = session?.input_audio_transcription;
          
          if (transcriptionConfig && transcriptionConfig.model) {
            console.log(`[Realtime Proxy] ✅ Transcription already configured:`, JSON.stringify(transcriptionConfig, null, 2));
            // Transcription already enabled, send connected immediately
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'connected',
                connectionId,
              }));
              console.log(`[Realtime Proxy] ✅ Sent "connected" message (transcription already enabled) for ${connectionId}`);
            }
            sessionInitialized = true;
            // Process any queued messages now that session is ready
            processMessageQueue();
          } else {
            console.warn(`[Realtime Proxy] ⚠️ Transcription NOT configured - enabling it for ${connectionId}`);
            
            // Configure transcription via session.update
            // The session structure is flat, not nested - use input_audio_transcription directly
            // Also disable response creation for transcription-only mode
            // Don't send "connected" yet - wait for session.updated confirmation
            // Don't set sessionInitialized yet - wait for session.updated
            try {
              openaiWs.send(JSON.stringify({
                type: 'session.update',
                session: {
                  input_audio_transcription: {
                    model: 'gpt-4o-transcribe', // Use gpt-4o-transcribe for streaming delta events (more real-time)
                    language: 'en',
                  },
                  turn_detection: {
                    type: 'server_vad',
                    threshold: 0.2,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 10, // Reduced to 100ms for very fast commits after speech stops
                    create_response: false, // Disable AI responses for transcription-only
                    interrupt_response: false,
                  },
                },
              }));
              console.log(`[Realtime Proxy] Sent session.update to enable transcription (no responses) for ${connectionId}`);
              // Don't set sessionInitialized yet - wait for session.updated to confirm
            } catch (error) {
              console.error(`[Realtime Proxy] Error sending session.update:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error(`[Realtime Proxy] Error parsing message:`, error);
    }
  });

  openaiWs.on('error', (error) => {
    console.error(`[Realtime Proxy] OpenAI WebSocket error for ${connectionId}:`, error);
    isOpenAIConnected = false;
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'error',
        message: `Connection error: ${error.message}`,
      }));
    }
  });

  openaiWs.on('close', () => {
    console.log(`[Realtime Proxy] OpenAI connection closed for ${connectionId}`);
    isOpenAIConnected = false;
    sessionInitialized = false;
    audioBufferSize = 0;
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'disconnected',
      }));
    }
  });

  // Forward messages from client to OpenAI
  clientWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleClientMessage(message);
    } catch (error) {
      console.error(`[Realtime Proxy] Error parsing message:`, error);
    }
  });

  clientWs.on('close', () => {
    console.log(`[Realtime Proxy] Client disconnected for ${connectionId}`);
    // Clear message queue
    messageQueue.length = 0;
    // Close OpenAI connection if it's open
    if (openaiWs.readyState === WebSocket.OPEN || openaiWs.readyState === WebSocket.CONNECTING) {
      openaiWs.close();
    }
  });

  return openaiWs;
};
