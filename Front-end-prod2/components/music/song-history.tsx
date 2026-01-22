"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  History,
  Search,
  Trash2,
  Music,
  Loader2,
  AlertCircle,
  Plus,
  RefreshCw,
} from "lucide-react"
import { api, type SongHistoryItem, type FetchSongsResponse } from "@/lib/api"
import { formatTime } from "@/lib/transcription-store"

interface SongHistoryProps {
  onAddToPlaylist?: (songs: Array<{ id: string; title: string; audioUrl: string; imageUrl?: string }>) => void
}

export function SongHistory({ onAddToPlaylist }: SongHistoryProps) {
  const [history, setHistory] = useState<SongHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [fetchingTaskIds, setFetchingTaskIds] = useState<Set<string>>(new Set())
  const [fetchedSongs, setFetchedSongs] = useState<Map<string, FetchSongsResponse>>(new Map())

  // Load history on mount
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getSongHistory(100, 0)
      setHistory(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadHistory()
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await api.searchSongHistory(searchQuery, 50)
      setHistory(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search history")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchSongs = async (taskId: string) => {
    if (fetchingTaskIds.has(taskId)) return

    setFetchingTaskIds((prev) => new Set(prev).add(taskId))
    setError(null)

    try {
      const response = await api.fetchSongsByTaskId(taskId)
      setFetchedSongs((prev) => new Map(prev).set(taskId, response))

      // If we have songs, automatically add to playlist
      if (response.songs && response.songs.length > 0 && onAddToPlaylist) {
        const songsToAdd = response.songs.map((song) => ({
          id: song.id || taskId,
          title: song.title || "Untitled",
          audioUrl: song.audioUrl || song.audio_url || "",
          imageUrl: song.imageUrl || song.image_url,
        }))
        onAddToPlaylist(songsToAdd)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch songs")
    } finally {
      setFetchingTaskIds((prev) => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this song from history?")) {
      return
    }

    try {
      await api.deleteSongFromHistory(taskId)
      setHistory((prev) => prev.filter((item) => item.taskId !== taskId))
      setFetchedSongs((prev) => {
        const next = new Map(prev)
        next.delete(taskId)
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete song")
    }
  }

  const handleAddToPlaylist = (taskId: string) => {
    const fetched = fetchedSongs.get(taskId)
    if (fetched?.songs && fetched.songs.length > 0 && onAddToPlaylist) {
      const songsToAdd = fetched.songs.map((song) => ({
        id: song.id || taskId,
        title: song.title || "Untitled",
        audioUrl: song.audioUrl || song.audio_url || "",
        imageUrl: song.imageUrl || song.image_url,
      }))
      onAddToPlaylist(songsToAdd)
    } else {
      // Fetch first, then add
      handleFetchSongs(taskId)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const filteredHistory = searchQuery
    ? history.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sceneName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.taskId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Song History</h2>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, scene, or task ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
        <Button onClick={loadHistory} variant="outline" size="icon" disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && history.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Music className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? "No songs found matching your search." : "No song history yet."}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Generate some music to see it here!
          </p>
        </div>
      )}

      {/* History List */}
      {!isLoading && history.length > 0 && (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredHistory.map((item) => {
            const isFetching = fetchingTaskIds.has(item.taskId)
            const fetched = fetchedSongs.get(item.taskId)
            const hasSongs = fetched?.songs && fetched.songs.length > 0

            return (
              <div
                key={item.taskId}
                className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">
                      {item.title || item.sceneName || "Untitled Song"}
                    </h3>
                    {item.sceneName && item.title && (
                      <span className="text-xs text-muted-foreground">({item.sceneName})</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(item.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {item.taskId}
                  </p>
                  {hasSongs && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ {fetched.songs?.length} song(s) available
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!hasSongs && (
                    <Button
                      onClick={() => handleFetchSongs(item.taskId)}
                      variant="outline"
                      size="sm"
                      disabled={isFetching}
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Fetch
                        </>
                      )}
                    </Button>
                  )}
                  {hasSongs && (
                    <Button
                      onClick={() => handleAddToPlaylist(item.taskId)}
                      variant="default"
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add to Playlist
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(item.taskId)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
