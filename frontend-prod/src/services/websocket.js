export class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.connectionId = null;
  }

  connect(useRealtime = false) {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = '3001';
        // Use Whisper service by default (or Realtime API if explicitly requested)
        const serviceParam = useRealtime ? 'realtime=true' : 'whisper=true';
        const wsUrl = `${protocol}//${host}:${port}/ws/transcribe?${serviceParam}`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WebSocket] Raw message received:', data);
            this.handleMessage(data);
          } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  handleMessage(data) {
    console.log('[WebSocket] handleMessage called with:', data.type, data);
    if (data.type === 'connected') {
      this.connectionId = data.connectionId;
      console.log('[WebSocket] Set connectionId to:', this.connectionId);
    }

    // Notify all listeners for 'message' event
    const messageListeners = this.listeners.get('message') || [];
    console.log('[WebSocket] Notifying', messageListeners.length, 'message listeners');
    messageListeners.forEach((callback) => {
      if (typeof callback === 'function') {
        try {
          callback(data);
        } catch (error) {
          console.error('[WebSocket] Error in listener:', error);
        }
      } else {
        console.error('[WebSocket] Invalid listener (not a function):', callback);
      }
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    if (typeof callback === 'function') {
      this.listeners.get(event).push(callback);
    } else {
      console.error('[WebSocket] Attempted to add non-function listener:', callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Cannot send: connection not open');
    }
  }

  sendAudioPCM(audioBuffer) {
    // Send PCM16 audio data (for Realtime API)
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      console.log('[WebSocket Client] ⚠️ Empty audio buffer, skipping');
      return;
    }
    
    console.log(`[WebSocket Client] 📤 Sending audio chunk: ${audioBuffer.byteLength} bytes (PCM16)`);
    
    // Convert ArrayBuffer to base64
    const bytes = new Uint8Array(audioBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    console.log(`[WebSocket Client] Converted to base64: ${base64.length} characters`);
    
    const message = {
      type: 'audio',
      data: base64,
    };
    console.log(`[WebSocket Client] Sending message type: ${message.type}, data length: ${message.data.length}`);
    this.send(message);
    console.log(`[WebSocket Client] ✅ Message sent`);
  }

  sendAudio(audioBlob, model = 'whisper-1') {
    // Legacy method for webm chunks (kept for backward compatibility)
    if (!audioBlob || audioBlob.size === 0) {
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      this.send({
        type: 'audio',
        data: base64,
        model,
      });
    };
    reader.onerror = (error) => {
      console.error('[WebSocket] Error reading audio blob:', error);
    };
    reader.readAsDataURL(audioBlob);
  }

  start(model = 'whisper-1') {
    this.send({ type: 'start', model });
  }

  stop() {
    this.send({ type: 'stop' });
  }

  commitAudio() {
    // Commit audio buffer (for Realtime API)
    this.send({ type: 'commit' });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`[WebSocket] Reconnecting (attempt ${this.reconnectAttempts})...`);
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }
}
