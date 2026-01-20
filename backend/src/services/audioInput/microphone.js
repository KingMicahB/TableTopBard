import { AudioInput } from './index.js';

// Microphone audio input implementation
// For now, audio comes from frontend via HTTP upload
// This structure allows for future direct microphone access or Discord integration

export class MicrophoneInput extends AudioInput {
  constructor() {
    super('microphone');
  }

  async start() {
    // Implementation for direct microphone access would go here
    // Currently handled by frontend MediaRecorder
    return true;
  }

  async stop() {
    // Implementation for stopping microphone access
    return true;
  }

  async getAudioStream() {
    // Implementation for getting audio stream
    return null;
  }
}

