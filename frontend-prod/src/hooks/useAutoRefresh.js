import { useEffect, useRef, useState, useCallback } from 'react';

// Simple hash function for change detection
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

export const useAutoRefresh = (sourceValue, refreshCallback, intervalMs = 30000, debounceMs = 2000) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const previousHashRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const intervalRef = useRef(null);

  // Debounced refresh function
  const debouncedRefresh = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const currentHash = hashString(sourceValue || '');
      
      // Only refresh if the value has changed
      if (currentHash !== previousHashRef.current && sourceValue) {
        previousHashRef.current = currentHash;
        setIsRefreshing(true);
        
        try {
          await refreshCallback(sourceValue);
          setLastRefresh(new Date());
        } catch (error) {
          console.error('Auto-refresh error:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    }, debounceMs);
  }, [sourceValue, refreshCallback, debounceMs]);

  // Set up interval for periodic refresh
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      debouncedRefresh();
    }, intervalMs);

    // Also refresh when source value changes
    debouncedRefresh();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sourceValue, intervalMs, debouncedRefresh]);

  // Manual refresh function
  const forceRefresh = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsRefreshing(true);
    try {
      await refreshCallback(sourceValue);
      setLastRefresh(new Date());
      previousHashRef.current = hashString(sourceValue || '');
    } catch (error) {
      console.error('Force refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [sourceValue, refreshCallback]);

  return {
    isRefreshing,
    lastRefresh,
    forceRefresh,
  };
};
