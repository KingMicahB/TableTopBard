"use client"

import { useEffect, useRef, useCallback } from "react"

interface UseAutoRefreshOptions {
  enabled: boolean
  interval: number // in milliseconds
  onRefresh: () => void | Promise<void>
  immediate?: boolean // Run immediately on mount
}

/**
 * Hook to automatically refresh data at a specified interval
 * Useful for live updates of summaries, prompts, etc.
 */
export function useAutoRefresh({
  enabled,
  interval,
  onRefresh,
  immediate = false,
}: UseAutoRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onRefreshRef = useRef(onRefresh)

  // Keep the callback ref up to date
  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  // Set up auto-refresh
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Run immediately if requested
    if (immediate) {
      onRefreshRef.current()
    }

    // Set up interval
    intervalRef.current = setInterval(() => {
      onRefreshRef.current()
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval, immediate])
}
