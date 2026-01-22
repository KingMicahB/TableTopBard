/**
 * API service for backend communication
 * Handles summarization, music prompt generation, and music generation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface SummarizeResponse {
  success: boolean
  summary: string
  originalLength: number
  summaryLength: number
}

export interface GeneratePromptResponse {
  success: boolean
  prompt: string
  originalSummary: string
}

export interface GenerateMusicResponse {
  success: boolean
  taskId: string
  message?: string
}

export interface PollMusicStatusResponse {
  success: boolean
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'SUCCESS' | 'COMPLETED' | 'FAILED' | 'FIRST_SUCCESS' | 'TEXT_SUCCESS'
  songs?: Array<{
    id: string
    title: string
    audioUrl?: string
    audio_url?: string
    imageUrl?: string
    image_url?: string
    duration?: number
  }>
  error?: string
}

export interface SongHistoryItem {
  id: number
  taskId: string
  title: string | null
  sceneName: string | null
  createdAt: number
  updatedAt: number
}

export interface HistoryResponse {
  success: boolean
  data: SongHistoryItem[]
  total: number
  limit: number
  offset: number
}

export interface FetchSongsResponse {
  success: boolean
  taskId: string
  status?: string
  songs?: Array<{
    id: string
    title: string
    audioUrl?: string
    audio_url?: string
    imageUrl?: string
    image_url?: string
    duration?: number
  }>
}

export const api = {
  /**
   * Summarize transcribed text
   */
  async summarizeText(
    text: string,
    prompt: string,
    model: string = 'gpt-3.5-turbo'
  ): Promise<SummarizeResponse> {
    const response = await fetch(`${API_BASE_URL}/audio/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, prompt, model }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to summarize text')
    }

    return response.json()
  },

  /**
   * Generate music prompt from summary
   */
  async generateMusicPrompt(
    summary: string,
    prompt: string,
    model: string = 'gpt-3.5-turbo'
  ): Promise<GeneratePromptResponse> {
    const response = await fetch(`${API_BASE_URL}/audio/generate-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ summary, prompt, model }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to generate music prompt')
    }

    return response.json()
  },

  /**
   * Generate music from prompt
   */
  async generateMusic(
    prompt: string,
    options: {
      model?: string
      instrumental?: boolean
      customMode?: boolean
      style?: string
      title?: string
      sceneName?: string
    } = {}
  ): Promise<GenerateMusicResponse> {
    const response = await fetch(`${API_BASE_URL}/audio/generate-music`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: options.model || 'V5',
        instrumental: options.instrumental ?? false,
        customMode: options.customMode ?? false,
        style: options.style || '',
        title: options.title || '',
        sceneName: options.sceneName || '',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to generate music')
    }

    return response.json()
  },

  /**
   * Poll for music generation status
   */
  async pollMusicStatus(taskId: string): Promise<PollMusicStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/audio/poll-music-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to poll music status')
    }

    return response.json()
  },

  /**
   * Get song history (all taskIds)
   */
  async getSongHistory(limit?: number, offset?: number): Promise<HistoryResponse> {
    const params = new URLSearchParams()
    if (limit) params.set('limit', limit.toString())
    if (offset) params.set('offset', offset.toString())

    const response = await fetch(`${API_BASE_URL}/history?${params.toString()}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get song history')
    }

    return response.json()
  },

  /**
   * Search song history
   */
  async searchSongHistory(query: string, limit?: number): Promise<{ success: boolean; data: SongHistoryItem[]; query: string }> {
    const params = new URLSearchParams({ q: query })
    if (limit) params.set('limit', limit.toString())

    const response = await fetch(`${API_BASE_URL}/history/search?${params.toString()}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to search song history')
    }

    return response.json()
  },

  /**
   * Fetch songs from Suno API using a taskId
   */
  async fetchSongsByTaskId(taskId: string): Promise<FetchSongsResponse> {
    const response = await fetch(`${API_BASE_URL}/history/${taskId}/fetch`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch songs')
    }

    return response.json()
  },

  /**
   * Fetch songs for multiple taskIds
   */
  async fetchMultipleSongs(taskIds: string[]): Promise<{ success: boolean; results: Array<FetchSongsResponse | { taskId: string; success: false; error: string }> }> {
    const response = await fetch(`${API_BASE_URL}/history/fetch-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskIds }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch multiple songs')
    }

    return response.json()
  },

  /**
   * Delete a taskId from history
   */
  async deleteSongFromHistory(taskId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/history/${taskId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete song from history')
    }

    return response.json()
  },
}
