const API_BASE_URL = '/api';

export const api = {
  async recordAudio(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch(`${API_BASE_URL}/audio/record`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload audio');
    }

    return response.json();
  },

  async transcribeAudio(audioBlob, model = 'whisper-1') {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('model', model);

    const response = await fetch(`${API_BASE_URL}/audio/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to transcribe audio');
    }

    return response.json();
  },

  async summarizeText(text, prompt, model = 'gpt-5-nano') {
    const response = await fetch(`${API_BASE_URL}/audio/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, prompt, model }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to summarize text');
    }

    return response.json();
  },

  async generateMusicPrompt(summary, prompt, model = 'gpt-5-nano') {
    const response = await fetch(`${API_BASE_URL}/audio/generate-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ summary, prompt, model }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate music prompt');
    }

    return response.json();
  },

  async generateMusic(musicPrompt, options = {}) {
    const response = await fetch(`${API_BASE_URL}/audio/generate-music`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: musicPrompt,
        model: options.model || 'V5',
        instrumental: options.instrumental || false,
        customMode: options.customMode || false,
        style: options.style || '',
        title: options.title || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate music');
    }

    return response.json();
  },

  async pollMusicStatus(taskId) {
    const response = await fetch(`${API_BASE_URL}/audio/poll-music-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to poll music status');
    }

    return response.json();
  },
};

