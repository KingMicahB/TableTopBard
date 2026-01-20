import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient } from '../services/websocket';

export const useWebSocket = (onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Keep onMessage ref up to date without causing re-renders
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const client = new WebSocketClient();
    clientRef.current = client;

    const handleMessage = (data) => {
      console.log('[useWebSocket] Received message:', data.type, data);
      if (data.type === 'connected') {
        console.log('[useWebSocket] Setting isConnected to true');
        setIsConnected(true);
        setError(null);
      } else if (data.type === 'error') {
        console.error('[useWebSocket] Error message:', data.message);
        setError(data.message);
      }
      // Use ref to avoid dependency issues
      if (onMessageRef.current) {
        onMessageRef.current(data);
      }
    };

    client.on('message', handleMessage);

    client.connect()
      .then(() => {
        // WebSocket is connected, but wait for backend's "connected" message
        // which confirms the session is ready
        console.log('[useWebSocket] WebSocket connected, waiting for session...');
        // Don't set isConnected here - wait for "connected" message from backend
      })
      .catch((err) => {
        setError(err.message);
        setIsConnected(false);
      });

    return () => {
      // Clean up properly
      client.off('message', handleMessage);
      client.disconnect();
      clientRef.current = null;
    };
  }, []); // Empty deps - only run once on mount

  const sendAudio = useCallback((audioBlob, model) => {
    if (clientRef.current && isConnected) {
      clientRef.current.sendAudio(audioBlob, model);
    }
  }, [isConnected]);

  const sendAudioPCM = useCallback((audioBuffer) => {
    if (clientRef.current && isConnected) {
      clientRef.current.sendAudioPCM(audioBuffer);
    }
  }, [isConnected]);

  const commitAudio = useCallback(() => {
    if (clientRef.current && isConnected) {
      clientRef.current.commitAudio();
    }
  }, [isConnected]);

  const start = useCallback((model) => {
    if (clientRef.current && isConnected) {
      clientRef.current.start(model);
    }
  }, [isConnected]);

  const stop = useCallback(() => {
    if (clientRef.current && isConnected) {
      clientRef.current.stop();
    }
  }, [isConnected]);

  return {
    isConnected,
    error,
    sendAudio,
    sendAudioPCM,
    start,
    stop,
    commitAudio,
  };
};
