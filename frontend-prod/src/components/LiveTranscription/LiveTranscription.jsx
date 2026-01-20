import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppState } from '../../context/AppContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { defaultModels } from '../../config/models';
import './LiveTranscription.css';

const LiveTranscription = () => {
  const { transcription, setTranscription, isRecording, setIsRecording } = useAppState();
  const [model, setModel] = useState(defaultModels.transcription);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const transcriptionEndRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastCompletedTextRef = useRef('');
  
  // Use useCallback to prevent handleWebSocketMessage from being recreated on every render
  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'transcription') {
      setTranscription((prev) => {
        if (data.isPartial) {
          // For partial transcripts, show completed text + current partial
          return lastCompletedTextRef.current + (data.text || '');
        } else {
          // For completed transcripts, append to the full text
          lastCompletedTextRef.current = prev ? `${prev} ${data.text}` : data.text;
          return lastCompletedTextRef.current;
        }
      });
      setIsTranscribing(data.isPartial);
    } else if (data.type === 'error') {
      console.error('[LiveTranscription] WebSocket error:', data.message);
      setIsTranscribing(false);
    } else if (data.type === 'connected') {
      console.log('[LiveTranscription] Connected to Realtime API');
      lastCompletedTextRef.current = ''; // Reset on new connection
    }
  }, []); // Empty deps - function doesn't depend on any props/state

  const { isConnected, sendAudioPCM, start, stop, commitAudio } = useWebSocket(handleWebSocketMessage);

  const startRecording = async () => {
    try {
      // Get user media with specific requirements for Realtime API
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono
          sampleRate: 24000, // 24kHz required by OpenAI Realtime API
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      // Create AudioContext for processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000,
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      isProcessingRef.current = true;
      
      processor.onaudioprocess = (event) => {
        if (!isProcessingRef.current) return;

        const inputData = event.inputBuffer.getChannelData(0);
        // Convert Float32Array to Int16Array (PCM16)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Clamp and convert to 16-bit integer
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Send audio data to backend/OpenAI
        if (sendAudioPCM && isConnected) {
          sendAudioPCM(pcm16.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      processorRef.current = processor;
      setIsRecording(true);
      setIsTranscribing(true);
      setTranscription(''); // Clear previous transcription
      lastCompletedTextRef.current = ''; // Reset completed text

      if (isConnected) {
        start();
        // Don't commit immediately - let server VAD handle speech detection
        // Audio will be committed automatically when speech is detected
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    // Stop processing first
    isProcessingRef.current = false;
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsTranscribing(false);
    
    if (isConnected) {
      commitAudio(); // Commit final audio buffer
      stop();
    }
  };

  // Auto-scroll to bottom when transcription updates
  useEffect(() => {
    if (transcriptionEndRef.current) {
      transcriptionEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcription]);

  return (
    <div className="live-transcription glass-card">
      <div className="section-header">
        <h2>Live Transcription</h2>
        <div className="status-indicator">
          {isRecording && (
            <span className="recording-dot"></span>
          )}
          <span className="status-text">
            {isRecording ? 'Recording...' : isConnected ? 'Ready' : 'Connecting...'}
          </span>
        </div>
      </div>

      <div className="controls">
        {!isRecording ? (
          <button 
            className="btn btn-primary" 
            onClick={startRecording}
            disabled={!isConnected}
          >
            Start Recording
          </button>
        ) : (
          <button 
            className="btn" 
            onClick={stopRecording}
          >
            Stop Recording
          </button>
        )}
      </div>

      <div className="transcription-display">
        {transcription ? (
          <div className="transcription-text">
            {transcription}
            {isTranscribing && <span className="typing-indicator">...</span>}
            <div ref={transcriptionEndRef} />
          </div>
        ) : (
          <div className="transcription-placeholder">
            {isConnected 
              ? 'Click "Start Recording" to begin transcribing audio in real-time...'
              : 'Connecting to transcription service...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTranscription;
