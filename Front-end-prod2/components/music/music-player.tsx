"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Music,
  AlertCircle,
} from "lucide-react"
import { formatTime } from "@/lib/transcription-store"

interface Song {
  id: string
  title: string
  audioUrl: string
  imageUrl?: string
  duration?: number
}

interface MusicPlayerProps {
  songs: Song[]
  className?: string
}

export function MusicPlayer({ songs, className }: MusicPlayerProps) {
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLooping, setIsLooping] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [playlist, setPlaylist] = useState<Song[]>([])
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize playlist when songs change
  useEffect(() => {
    if (songs.length > 0) {
      setPlaylist(songs)
      if (currentSongIndex === null) {
        setCurrentSongIndex(0)
      }
    }
  }, [songs])

  // Update audio element when current song changes
  useEffect(() => {
    if (currentSongIndex !== null && playlist[currentSongIndex]) {
      const song = playlist[currentSongIndex]
      if (audioRef.current) {
        // Pause current audio before changing source
        audioRef.current.pause()
        audioRef.current.src = song.audioUrl
        audioRef.current.load()
        // Reset current time when switching songs
        setCurrentTime(0)
        // Use song's duration if available, otherwise reset to 0
        if (song.duration && song.duration > 0) {
          setDuration(song.duration)
        } else {
          setDuration(0)
        }
      }
    }
  }, [currentSongIndex, playlist])

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    
    const updateDuration = () => {
      // Only update if duration is valid (not NaN, not Infinity, and > 0)
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }
    
    // Also try to get duration when data is loaded
    const handleLoadedData = () => {
      updateDuration()
    }
    
    const handleEnded = () => {
      // Capture current playing state before any state changes
      const wasPlaying = isPlaying
      
      if (isLooping) {
        audio.currentTime = 0
        // Keep playing if we were playing
        if (wasPlaying) {
          audio.play().catch((err) => {
            console.error("Loop play error:", err)
            setIsPlaying(false)
          })
        }
      } else {
        // Move to next song and auto-play
        if (playlist.length === 0) {
          setIsPlaying(false)
          return
        }

        if (isShuffling) {
          const randomIndex = Math.floor(Math.random() * playlist.length)
          setCurrentSongIndex(randomIndex)
        } else {
          setCurrentSongIndex((prev) => {
            if (prev === null) return null
            const nextIndex = (prev + 1) % playlist.length
            // If we've looped back to the start, stop playing
            if (nextIndex === 0 && prev === playlist.length - 1) {
              setIsPlaying(false)
              return null
            }
            return nextIndex
          })
        }
        
        // Auto-play the next song if we were playing
        // The play/pause effect will handle the actual playback
        if (wasPlaying) {
          setIsPlaying(true)
        }
      }
    }
    
    const handleError = () => {
      setError("Failed to load audio")
      setIsPlaying(false)
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("durationchange", updateDuration)
    audio.addEventListener("loadeddata", handleLoadedData)
    audio.addEventListener("canplay", updateDuration)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("durationchange", updateDuration)
      audio.removeEventListener("loadeddata", handleLoadedData)
      audio.removeEventListener("canplay", updateDuration)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [isLooping, playlist, isShuffling, isPlaying])

  // Play/pause control
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Only control play/pause if we have a valid song
    if (currentSongIndex === null) {
      if (isPlaying) {
        setIsPlaying(false)
      }
      return
    }

    if (isPlaying) {
      // Check if audio is ready to play
      if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        audio.play().catch((err) => {
          console.error("Play error:", err)
          setError("Failed to play audio")
          setIsPlaying(false)
        })
      } else {
        // Wait for audio to be ready
        const handleCanPlay = () => {
          audio.play().catch((err) => {
            console.error("Play error:", err)
            setError("Failed to play audio")
            setIsPlaying(false)
          })
          audio.removeEventListener("canplay", handleCanPlay)
        }
        audio.addEventListener("canplay", handleCanPlay)
        return () => {
          audio.removeEventListener("canplay", handleCanPlay)
        }
      }
    } else {
      audio.pause()
    }
  }, [isPlaying, currentSongIndex])

  // Volume control
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  const handlePlayPause = () => {
    if (currentSongIndex === null && playlist.length > 0) {
      setCurrentSongIndex(0)
      setIsPlaying(true)
    } else {
      setIsPlaying(!isPlaying)
    }
  }

  const handleNext = () => {
    if (playlist.length === 0) return

    const wasPlaying = isPlaying // Preserve playing state

    if (isShuffling) {
      const randomIndex = Math.floor(Math.random() * playlist.length)
      setCurrentSongIndex(randomIndex)
    } else {
      setCurrentSongIndex((prev) => {
        if (prev === null) return 0
        return (prev + 1) % playlist.length
      })
    }

    // Auto-play if it was playing before
    if (wasPlaying) {
      setIsPlaying(true)
    }
  }

  const handlePrevious = () => {
    if (playlist.length === 0) return

    const wasPlaying = isPlaying // Preserve playing state

    setCurrentSongIndex((prev) => {
      if (prev === null) return 0
      return prev === 0 ? playlist.length - 1 : prev - 1
    })

    // Auto-play if it was playing before
    if (wasPlaying) {
      setIsPlaying(true)
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(value[0] === 0)
  }

  const handleToggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleRemoveFromPlaylist = (index: number) => {
    setPlaylist((prev) => {
      const newPlaylist = prev.filter((_, i) => i !== index)
      if (currentSongIndex === index) {
        setCurrentSongIndex(newPlaylist.length > 0 ? 0 : null)
        setIsPlaying(false)
      } else if (currentSongIndex !== null && currentSongIndex > index) {
        setCurrentSongIndex(currentSongIndex - 1)
      }
      return newPlaylist
    })
  }

  const currentSong = currentSongIndex !== null ? playlist[currentSongIndex] : null

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card",
        className
      )}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Music Player</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{playlist.length} song{playlist.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="m-4" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Player Controls */}
      {currentSong ? (
        <div className="p-6 space-y-6">
          {/* Current Song Info */}
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-lg">{currentSong.title}</h3>
            <p className="text-sm text-muted-foreground">
              {currentSongIndex !== null && `${currentSongIndex + 1} of ${playlist.length}`}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
              aria-label="Seek"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime * 1000)}</span>
              <span>{formatTime(duration * 1000)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsShuffling(!isShuffling)}
              className={cn(
                "focus-visible-ring",
                isShuffling && "bg-accent text-accent-foreground"
              )}
              aria-label={isShuffling ? "Disable shuffle" : "Enable shuffle"}
            >
              <Shuffle className="h-5 w-5" aria-hidden="true" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={playlist.length <= 1}
              className="h-12 w-12 focus-visible-ring"
              aria-label="Previous song"
            >
              <SkipBack className="h-6 w-6" aria-hidden="true" />
            </Button>

            <Button
              size="lg"
              onClick={handlePlayPause}
              className="h-16 w-16 rounded-full focus-visible-ring"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-7 w-7" aria-hidden="true" />
              ) : (
                <Play className="h-7 w-7" aria-hidden="true" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={playlist.length <= 1}
              className="h-12 w-12 focus-visible-ring"
              aria-label="Next song"
            >
              <SkipForward className="h-6 w-6" aria-hidden="true" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLooping(!isLooping)}
              className={cn(
                "focus-visible-ring",
                isLooping && "bg-accent text-accent-foreground"
              )}
              aria-label={isLooping ? "Disable loop" : "Enable loop"}
            >
              <Repeat className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMute}
              className="focus-visible-ring"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Volume2 className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="flex-1"
              aria-label="Volume"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-center text-muted-foreground">
            No music available. Generate music to start playing.
          </p>
        </div>
      )}

      {/* Playlist */}
      {playlist.length > 0 && (
        <div className="border-t border-border">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Playlist</h3>
          </div>
          <div className="max-h-[200px] overflow-y-auto p-2">
            <div className="space-y-1">
              {playlist.map((song, index) => (
                <div
                  key={song.id}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    currentSongIndex === index
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted/50"
                  )}
                >
                  <button
                    onClick={() => {
                      const wasPlaying = isPlaying || currentSongIndex === index
                      setCurrentSongIndex(index)
                      // Preserve play state if clicking the current song, otherwise start playing
                      setIsPlaying(wasPlaying)
                    }}
                    className="flex-1 text-left focus-visible-ring rounded px-2 py-1"
                    aria-label={`Play ${song.title}`}
                  >
                    <div className="font-medium">{song.title}</div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveFromPlaylist(index)}
                    className="focus-visible-ring"
                    aria-label={`Remove ${song.title} from playlist`}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="metadata" />
    </div>
  )
}
