"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcuts {
  onToggleRecording: () => void
  onStop: () => void
  onTogglePause: () => void
  isRecording: boolean
  isPaused: boolean
}

export function useKeyboardShortcuts({
  onToggleRecording,
  onStop,
  onTogglePause,
  isRecording,
  isPaused,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      switch (event.code) {
        case "Space":
          event.preventDefault()
          if (!isRecording) {
            onToggleRecording()
          } else {
            onTogglePause()
          }
          break
        case "Escape":
          if (isRecording) {
            event.preventDefault()
            onStop()
          }
          break
        case "KeyR":
          if (event.ctrlKey || event.metaKey) {
            // Don't interfere with browser refresh
            return
          }
          if (!isRecording) {
            event.preventDefault()
            onToggleRecording()
          }
          break
      }
    },
    [isRecording, isPaused, onToggleRecording, onStop, onTogglePause]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}
