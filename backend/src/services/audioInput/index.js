// Abstract interface for audio input sources
// This allows easy addition of Discord integration later

export class AudioInput {
  constructor(source) {
    this.source = source;
  }

  async start() {
    throw new Error('start() must be implemented by subclass');
  }

  async stop() {
    throw new Error('stop() must be implemented by subclass');
  }

  async getAudioStream() {
    throw new Error('getAudioStream() must be implemented by subclass');
  }
}

