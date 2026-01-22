"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/transcription/header"
import { AudioControls } from "@/components/transcription/audio-controls"
import { CaptioningPanel } from "@/components/transcription/captioning-panel"
import { SettingsPanel } from "@/components/transcription/settings-panel"
import { ExportDialog } from "@/components/transcription/export-dialog"
import { SummaryPanel } from "@/components/summary/summary-panel"
import { MusicGenerationPanel } from "@/components/music/music-generation-panel"
import { MusicPlayer } from "@/components/music/music-player"
import { SongHistory } from "@/components/music/song-history"
import type { SceneData } from "@/lib/types"
import type { SceneDetails } from "@/lib/scene-details"
import { useTranscription } from "@/hooks/use-transcription"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { DEFAULT_CAPTION_SETTINGS } from "@/lib/transcription-store"
import { defaultModels, availableModels } from "@/lib/models"
import type { CaptionSettings } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"
import { defaultPrompts } from "@/lib/prompts"

export default function TranscriptionApp() {
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [captionSettings, setCaptionSettings] = useState<CaptionSettings>(
    DEFAULT_CAPTION_SETTINGS
  )
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [summary, setSummary] = useState("")
  const [generatedSongs, setGeneratedSongs] = useState<
    Array<{ id: string; title: string; audioUrl: string; imageUrl?: string }>
  >([])
  const [editedTranscription, setEditedTranscription] = useState("")
  const [sceneData, setSceneData] = useState<SceneData | null>(null)
  const [sceneDetails, setSceneDetails] = useState<SceneDetails | null>(null)
  const [prompts, setPrompts] = useState({
    summarization: defaultPrompts.summarization,
    musicPromptGeneration: defaultPrompts.musicPromptGeneration,
  })
  const [selectedModels, setSelectedModels] = useState({
    summarization: defaultModels.summarization,
    musicPromptGeneration: defaultModels.musicPromptGeneration,
    musicGeneration: defaultModels.musicGeneration,
  })

  const {
    status,
    isRecording,
    isPaused,
    segments,
    duration,
    audioDevices,
    selectedDevice,
    error,
    start,
    stop,
    pause,
    resume,
    reset,
    setSelectedDevice,
  } = useTranscription({
    language: selectedLanguage,
  })

  // Get full transcription text from segments (for initial population only)
  const transcriptionText = useMemo(() => {
    return segments
      .filter((s) => !s.isProvisional)
      .map((s) => s.text)
      .join(" ")
  }, [segments])

  // Initialize edited transcription with live transcription if empty
  useEffect(() => {
    if (!editedTranscription && transcriptionText) {
      setEditedTranscription(transcriptionText)
    }
  }, [transcriptionText, editedTranscription])

  // Use edited transcription as the source of truth
  const transcriptionForSummary = editedTranscription

  // Keyboard shortcuts
  const handleToggleRecording = useCallback(() => {
    if (!isRecording) {
      start()
    }
  }, [isRecording, start])

  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      resume()
    } else {
      pause()
    }
  }, [isPaused, pause, resume])

  useKeyboardShortcuts({
    onToggleRecording: handleToggleRecording,
    onStop: stop,
    onTogglePause: handleTogglePause,
    isRecording,
    isPaused,
  })

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex min-h-screen flex-col bg-background">
        {/* Skip Link for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>

        <Header
          audioDevices={audioDevices}
          selectedDevice={selectedDevice}
          onDeviceChange={setSelectedDevice}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          onSettingsOpen={() => setIsSettingsOpen(true)}
          onExportOpen={() => setIsExportOpen(true)}
        />

        <main
          id="main-content"
          className="flex flex-1 flex-col px-4 py-6"
          role="main"
          aria-label="Live transcription workspace"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Browser Support Notice */}
            {typeof window !== "undefined" &&
              !("webkitSpeechRecognition" in window) &&
              !("SpeechRecognition" in window) && (
                <Alert role="alert">
                  <Info className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>
                    Speech recognition is not supported in your browser. Please
                    use Chrome, Edge, or Safari for the best experience.
                  </AlertDescription>
                </Alert>
              )}

            {/* Audio Controls */}
            <section aria-label="Recording controls">
              <AudioControls
                status={status}
                isRecording={isRecording}
                isPaused={isPaused}
                duration={duration}
                onStart={start}
                onStop={stop}
                onPause={pause}
                onResume={resume}
                onReset={reset}
              />
            </section>

            {/* Live Captioning Panel (Editable) */}
            <CaptioningPanel
              segments={segments}
              settings={captionSettings}
              editedTranscript={editedTranscription}
              onTranscriptChange={setEditedTranscription}
              className="flex-1 min-h-[400px]"
            />

            {/* Summary Panel */}
            <SummaryPanel
              transcription={transcriptionForSummary}
              className="min-h-[300px]"
              onSummaryGenerated={setSummary}
              onSceneDataChange={setSceneData}
              onSceneDetailsChange={setSceneDetails}
              customPrompt={prompts.summarization}
              onPromptChange={(prompt) => setPrompts({ ...prompts, summarization: prompt })}
              musicPromptTemplate={prompts.musicPromptGeneration}
              musicPromptModel={selectedModels.musicPromptGeneration}
              selectedModel={selectedModels.summarization}
            />

            {/* Music Generation Panel */}
            <MusicGenerationPanel
              musicPrompt={sceneDetails?.musicPrompt || ""}
              sceneData={sceneData}
              sceneDetails={sceneDetails}
              className="min-h-[300px]"
              selectedModel={selectedModels.musicGeneration}
              onMusicGenerated={(songs) => {
                setGeneratedSongs((prev) => [...prev, ...songs])
              }}
              onSceneDetailsUpdate={(updated) => {
                setSceneDetails(updated)
              }}
            />

            {/* Music Player */}
            {generatedSongs.length > 0 && (
              <MusicPlayer songs={generatedSongs} className="min-h-[400px]" />
            )}

            {/* Song History */}
            <div className="space-y-4">
              <SongHistory
                onAddToPlaylist={(songs) => {
                  setGeneratedSongs((prev) => [...prev, ...songs])
                }}
              />
            </div>

            {/* Accessibility Information */}
            <section
              className="rounded-lg border border-border bg-muted/30 p-4"
              aria-labelledby="accessibility-info"
            >
              <h2
                id="accessibility-info"
                className="mb-2 text-sm font-semibold"
              >
                Accessibility Features
              </h2>
              <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                <li>
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    Tab
                  </kbd>{" "}
                  Navigate between controls
                </li>
                <li>
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    Space
                  </kbd>{" "}
                  Start/pause transcription
                </li>
                <li>
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    Esc
                  </kbd>{" "}
                  Stop transcription
                </li>
                <li>
                  Customize captions in{" "}
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-primary underline underline-offset-2 hover:no-underline focus-visible-ring"
                  >
                    Settings
                  </button>
                </li>
              </ul>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
          <p>
            Built with accessibility in mind. WCAG 2.1 AA compliant.
          </p>
        </footer>

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={captionSettings}
          onSettingsChange={setCaptionSettings}
          prompts={prompts}
          onPromptsChange={setPrompts}
          selectedModels={selectedModels}
          onModelsChange={setSelectedModels}
        />

        {/* Export Dialog */}
        <ExportDialog
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          segments={segments}
        />
      </div>
    </ThemeProvider>
  )
}
