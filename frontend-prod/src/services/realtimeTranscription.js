/**
 * OpenAI Realtime API Transcription Service
 * Connects directly to OpenAI's Realtime API WebSocket for streaming transcription
 * 
 * Documentation: https://platform.openai.com/docs/guides/realtime-transcription
 */

export class RealtimeTranscriptionClient {
  constructor(apiKey, onTranscriptionUpdate, onError) {
    this.apiKey = apiKey;
    this.onTranscriptionUpdate = onTranscriptionUpdate;
    this.onError = onError;
    this.ws = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.isConnected = false;
    this.isRecording = false;
    this.sessionId = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        // OpenAI Realtime API WebSocket endpoint
        const wsUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-transcribe';
        
        this.ws = new WebSocket(wsUrl, [], {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'OpenAI-Beta': 'realtime=v1',
          },
        });

        this.ws.onopen = () => {
          console.log('[Realtime API] Connected');
          this.isConnected = true;
          this.initializeSession();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('[Realtime API] WebSocket error:', error);
          this.isConnected = false;
          if (this.onError) {
            this.onError(error);
          }
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[Realtime API] Disconnected');
          this.isConnected = false;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  initializeSession() {
    // Initialize the session with transcription configuration
    const config = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: 'You are a real-time transcription assistant. Transcribe the audio accurately.',
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        tools: [],
        tool_choice: 'auto',
        temperature: 0.8,
        max_response_output_tokens: 4096,
      },
    };

    this.send(config);
  }

  handleMessage(message) {
    console.log('[Realtime API] Message:', message.type);

    switch (message.type) {
      case 'session.created':
        this.sessionId = message.session.id;
        console.log('[Realtime API] Session created:', this.sessionId);
        break;

      case 'session.updated':
        console.log('[Realtime API] Session updated');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // Final transcription for a speech turn
        if (message.item?.input_audio_transcription?.text) {
          const text = message.item.input_audio_transcription.text;
          if (this.onTranscriptionUpdate) {
            this.onTranscriptionUpdate({
              type: 'completed',
              text: text,
            });
          }
        }
        break;

      case 'conversation.item.input_audio_transcription.delta':
        // Partial/streaming transcription (only with gpt-4o-transcribe model)
        if (message.delta) {
          if (this.onTranscriptionUpdate) {
            this.onTranscriptionUpdate({
              type: 'delta',
              text: message.delta,
            });
          }
        }
        break;

      case 'error':
        console.error('[Realtime API] Error:', message);
        if (this.onError) {
          this.onError(new Error(message.error?.message || 'Unknown error'));
        }
        break;

      default:
        // Ignore other event types
        break;
    }
  }

  async startRecording() {
    if (!this.isConnected) {
      throw new Error('Not connected to Realtime API');
    }

    try {
      // Get user media
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono
          sampleRate: 24000, // 24kHz required by OpenAI
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Create AudioContext for processing
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000,
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        if (!this.isRecording) return;

        const inputData = event.inputBuffer.getChannelData(0);
        // Convert Float32Array to Int16Array (PCM16)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Clamp and convert to 16-bit integer
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Send audio data to OpenAI
        this.sendAudio(pcm16.buffer);
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      this.processor = processor;
      this.isRecording = true;

      // Start the input audio
      this.send({
        type: 'input_audio_buffer.append',
        audio: '', // Will be sent via input_audio_buffer.append
      });

      this.send({
        type: 'input_audio_buffer.commit',
      });
    } catch (error) {
      console.error('[Realtime API] Error starting recording:', error);
      throw error;
    }
  }

  sendAudio(audioBuffer) {
    if (!this.isConnected || !this.isRecording) return;

    // Convert ArrayBuffer to base64
    const base64 = this.arrayBufferToBase64(audioBuffer);

    this.send({
      type: 'input_audio_buffer.append',
      audio: base64,
    });
  }

  stopRecording() {
    this.isRecording = false;

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Commit final audio buffer
    if (this.isConnected) {
      this.send({
        type: 'input_audio_buffer.commit',
      });
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[Realtime API] Cannot send: connection not open');
    }
  }

  disconnect() {
    this.stopRecording();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
