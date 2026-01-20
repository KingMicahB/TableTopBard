import { useEffect, useRef, useState } from 'react';
import { RealtimeTranscriptionClient } from '../services/realtimeTranscription';

export const useRealtimeTranscription = (apiKey, onTranscriptionUpdate) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!apiKey) {
      console.warn('[useRealtimeTranscription] No API key provided');
      return;
    }

    const client = new RealtimeTranscriptionClient(
      apiKey,
      (update) => {
        if (onTranscriptionUpdate) {
          onTranscriptionUpdate(update);
        }
      },
      (err) => {
        setError(err);
        console.error('[useRealtimeTranscription] Error:', err);
      }
    );

    clientRef.current = client;

    client.connect()
      .then(() => {
        setIsConnected(true);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setIsConnected(false);
      });

    return () => {
      client.disconnect();
    };
  }, [apiKey, onTranscriptionUpdate]);

  const startRecording = async () => {
    if (clientRef.current && isConnected) {
      try {
        await clientRef.current.startRecording();
        setIsRecording(true);
        setError(null);
      } catch (err) {
        setError(err);
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (clientRef.current) {
      clientRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  return {
    isConnected,
    isRecording,
    error,
    startRecording,
    stopRecording,
  };
};
