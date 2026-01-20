import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { defaultPrompts } from '../config/prompts';
import { defaultModels, availableModels } from '../config/models';
import TranscriptionDisplay from './TranscriptionDisplay';
import SummaryDisplay from './SummaryDisplay';
import MusicPromptDisplay from './MusicPromptDisplay';
import AudioPlayer from './AudioPlayer';
import ModelSelector from './ModelSelector';
import './AudioRecorder.css';

function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [transcription, setTranscription] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [summarizationPrompt, setSummarizationPrompt] = useState(defaultPrompts.summarization);
  const [musicPromptGenerationPrompt, setMusicPromptGenerationPrompt] = useState(defaultPrompts.musicPromptGeneration);
  const [musicGenerationPrompt, setMusicGenerationPrompt] = useState(defaultPrompts.musicGeneration);
  const [transcriptionModel, setTranscriptionModel] = useState(defaultModels.transcription);
  const [summarizationModel, setSummarizationModel] = useState(defaultModels.summarization);
  const [musicPromptModel, setMusicPromptModel] = useState(defaultModels.musicPromptGeneration);
  const [musicGenerationModel, setMusicGenerationModel] = useState(defaultModels.musicGeneration);
  const [musicPrompt, setMusicPrompt] = useState(null);
  const [generatedSongs, setGeneratedSongs] = useState([]); // Array to store both songs
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptError, setPromptError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicError, setMusicError] = useState(null);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [savedAudioUrl, setSavedAudioUrl] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const [musicTaskId, setMusicTaskId] = useState(null); // Store taskId for re-polling
  const [isPolling, setIsPolling] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioBlobRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setUploadStatus(null);
      setTranscription(null);
      setTranscriptionError(null);
      setSummary(null);
      setSummaryError(null);
      setMusicPrompt(null);
      setPromptError(null);
      setAudioUrl(null);
      setMusicError(null);
      setIsPlaceholder(false);
      setSavedAudioUrl(null);
      setGeneratedSongs([]);
      setUploadedFilename(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioBlobRef.current = audioBlob;
        await handleUpload(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleUpload = async (audioBlob) => {
    try {
      setUploadStatus('Uploading...');
      const result = await api.recordAudio(audioBlob);
      setUploadStatus(`Success! Audio saved (${(audioBlob.size / 1024).toFixed(2)} KB)`);
      
      // Create local URL for playback
      const url = URL.createObjectURL(audioBlob);
      setSavedAudioUrl(url);
      setUploadedFilename(result.filename);
      
      console.log('Upload result:', result);
    } catch (err) {
      setError('Failed to upload audio: ' + err.message);
      setUploadStatus(null);
      console.error('Upload error:', err);
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlobRef.current) {
      setTranscriptionError('No audio file available. Please record audio first.');
      return;
    }
    
    try {
      setIsTranscribing(true);
      setTranscriptionError(null);
      const result = await api.transcribeAudio(audioBlobRef.current, transcriptionModel);
      setTranscription(result.transcription);
      console.log('Transcription result:', result);
    } catch (err) {
      setTranscriptionError(err.message);
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleManualTranscriptionChange = (text) => {
    setTranscription(text);
    // Clear any transcription errors when user manually enters text
    if (text && text.trim().length > 0) {
      setTranscriptionError(null);
    }
  };

  const handleSummarize = async () => {
    const textToSummarize = transcription || '';
    if (!textToSummarize || textToSummarize.trim().length === 0) {
      setSummaryError('No transcription available. Please enter transcription text first.');
      return;
    }
    
    try {
      setIsSummarizing(true);
      setSummaryError(null);
      const result = await api.summarizeText(textToSummarize, summarizationPrompt, summarizationModel);
      setSummary(result.summary);
      console.log('Summary result:', result);
    } catch (err) {
      setSummaryError(err.message);
      console.error('Summarization error:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSummarizationPromptChange = (userPrompt) => {
    // userPrompt is now just a string, not an object
    setSummarizationPrompt(userPrompt);
  };

  const handleManualSummaryChange = (text) => {
    setSummary(text);
  };

  const handleGeneratePrompt = async () => {
    const summaryToUse = summary || '';
    if (!summaryToUse || summaryToUse.trim().length === 0) {
      setPromptError('No summary available. Please enter summary text first.');
      return;
    }
    
    try {
      setIsGeneratingPrompt(true);
      setPromptError(null);
      const result = await api.generateMusicPrompt(summaryToUse, musicPromptGenerationPrompt, musicPromptModel);
      setMusicPrompt(result.prompt);
      console.log('Prompt generation result:', result);
    } catch (err) {
      setPromptError(err.message);
      console.error('Prompt generation error:', err);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleManualMusicPromptChange = (text) => {
    setMusicPrompt(text);
  };

  const handleMusicPromptGenerationPromptChange = (userPrompt) => {
    // userPrompt is now just a string, not an object
    setMusicPromptGenerationPrompt(userPrompt);
  };

  const handleGenerateMusic = async () => {
    if (!musicPrompt) {
      setMusicError('No music prompt available. Please generate prompt first.');
      return;
    }
    
    try {
      setIsGeneratingMusic(true);
      setMusicError(null);
      setAudioUrl(null);
      setIsPlaceholder(false);
      
      // Validate prompt length for non-custom mode (max 500 characters)
      if (musicPrompt.length > 500) {
        setMusicError(`Prompt is too long. Maximum 500 characters for non-custom mode. Current: ${musicPrompt.length} characters.`);
        return;
      }

      // Generate music using the music prompt
      // Non-custom mode: only prompt is required, instrumental: true
      const result = await api.generateMusic(musicPrompt, {
        model: musicGenerationModel, // Use selected model
        instrumental: true, // Instrumental music
        customMode: false, // Non-custom mode
      });
      
      console.log('Music generation result:', result);
      
      // Suno API returns 2 songs in the songs array
      if (result.songs && Array.isArray(result.songs) && result.songs.length > 0) {
        setGeneratedSongs(result.songs);
        // Set the first song's audio URL for the player
        const firstSong = result.songs[0];
        const audioUrl = firstSong.audio_url || firstSong.stream_audio_url || firstSong.source_audio_url;
        if (audioUrl) {
          setAudioUrl(audioUrl);
        } else {
          throw new Error('No audio URL found in generated songs');
        }
      } else if (result.audioUrl) {
        // Fallback for single URL (backwards compatibility)
        setAudioUrl(result.audioUrl);
        setGeneratedSongs([{ audio_url: result.audioUrl }]);
      } else {
        throw new Error('No songs received from Suno API');
      }
    } catch (err) {
      setMusicError(err.message);
      console.error('Music generation error:', err);
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const handleMusicGenerationPromptChange = (userPrompt) => {
    // userPrompt is now just a string, not an object
    setMusicGenerationPrompt(userPrompt);
  };

  const handlePollMusicStatus = async () => {
    if (!musicTaskId) {
      setMusicError('No task ID available. Please generate music first.');
      return;
    }

    try {
      setIsPolling(true);
      setMusicError(null);

      const result = await api.pollMusicStatus(musicTaskId);
      
      console.log('Poll result:', result);
      
      // Update songs if available
      if (result.songs && Array.isArray(result.songs) && result.songs.length > 0) {
        setGeneratedSongs(result.songs);
        const firstSong = result.songs[0];
        const audioUrl = firstSong.audio_url || firstSong.stream_audio_url || firstSong.source_audio_url;
        if (audioUrl) {
          setAudioUrl(audioUrl);
        }
      } else if (result.audioUrl) {
        setAudioUrl(result.audioUrl);
        setGeneratedSongs([{ audio_url: result.audioUrl }]);
      } else {
        setMusicError('Music is still generating. Please wait and try again.');
      }
    } catch (err) {
      setMusicError(err.message);
      console.error('Polling error:', err);
    } finally {
      setIsPolling(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-recorder">
      <div className="recorder-controls">
        {!isRecording ? (
          <button 
            className="record-button start" 
            onClick={startRecording}
            disabled={isRecording}
          >
            🎤 Start Recording
          </button>
        ) : (
          <button 
            className="record-button stop" 
            onClick={stopRecording}
          >
            ⏹ Stop Recording
          </button>
        )}
      </div>

      {isRecording && (
        <div className="recording-status">
          <div className="recording-indicator">
            <span className="pulse-dot"></span>
            Recording: {formatTime(recordingTime)}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {uploadStatus && (
        <div className="upload-status">
          {uploadStatus}
        </div>
      )}

      {/* Step 1: Saved Audio File */}
      {savedAudioUrl && (
        <div className="step-section">
          <h3>Step 1: Recorded Audio</h3>
          <div className="audio-preview">
            <audio controls src={savedAudioUrl}></audio>
            {uploadedFilename && (
              <p className="file-info">File: {uploadedFilename}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Transcription */}
      <div className="step-section">
        <div className="step-header">
          <h3>Step 2: Transcription</h3>
          <button 
            className="action-button"
            onClick={handleTranscribe}
            disabled={isTranscribing || !savedAudioUrl}
            title={!savedAudioUrl ? "Record or upload audio first to transcribe" : ""}
          >
            {isTranscribing ? 'Transcribing...' : '📝 Transcribe Audio'}
          </button>
        </div>
        <ModelSelector
          label="Transcription"
          value={transcriptionModel}
          onChange={setTranscriptionModel}
          options={availableModels.transcription}
          disabled={isTranscribing}
        />
        <TranscriptionDisplay
          transcription={transcription}
          isLoading={isTranscribing}
          error={transcriptionError}
          onTextChange={handleManualTranscriptionChange}
          allowEdit={true}
        />
      </div>

      {/* Step 3: Summary */}
      <div className="step-section">
        <div className="step-header">
          <h3>Step 3: Summary</h3>
          <button 
            className="action-button"
            onClick={handleSummarize}
            disabled={isSummarizing || !transcription || transcription.trim().length === 0}
            title={!transcription || transcription.trim().length === 0 ? "Enter transcription text first" : ""}
          >
            {isSummarizing ? 'Summarizing...' : '📄 Create Summary'}
          </button>
        </div>
        <ModelSelector
          label="Summarization"
          value={summarizationModel}
          onChange={setSummarizationModel}
          options={availableModels.summarization}
          disabled={isSummarizing}
        />
        <SummaryDisplay
          summary={summary}
          isLoading={isSummarizing}
          error={summaryError}
          transcription={transcription}
          prompt={summarizationPrompt}
          onPromptChange={handleSummarizationPromptChange}
          onManualInput={handleManualSummaryChange}
        />
      </div>

      {/* Step 4: Music Prompt */}
      <div className="step-section">
        <div className="step-header">
          <h3>Step 4: Music Prompt</h3>
          <button 
            className="action-button"
            onClick={handleGeneratePrompt}
            disabled={isGeneratingPrompt || !summary || summary.trim().length === 0}
            title={!summary || summary.trim().length === 0 ? "Enter summary text first" : ""}
          >
            {isGeneratingPrompt ? 'Generating...' : '🎵 Generate Prompt'}
          </button>
        </div>
        <ModelSelector
          label="Music Prompt Generation"
          value={musicPromptModel}
          onChange={setMusicPromptModel}
          options={availableModels.musicPromptGeneration}
          disabled={isGeneratingPrompt}
        />
        <MusicPromptDisplay
          prompt={musicPrompt}
          isLoading={isGeneratingPrompt}
          error={promptError}
          summary={summary}
          aiPrompt={musicPromptGenerationPrompt}
          onPromptChange={handleMusicPromptGenerationPromptChange}
          onManualInput={handleManualMusicPromptChange}
        />
      </div>

      {/* Step 5: Music Generation */}
      <div className="step-section">
        <div className="step-header">
          <h3>Step 5: Generated Music</h3>
          <div className="button-group">
            <button 
              className="action-button"
              onClick={handleGenerateMusic}
              disabled={isGeneratingMusic || !musicPrompt || musicPrompt.trim().length === 0}
              title={!musicPrompt || musicPrompt.trim().length === 0 ? "Enter music prompt first" : ""}
            >
              {isGeneratingMusic ? 'Generating...' : '🎶 Generate Music'}
            </button>
            {musicTaskId && (
              <button 
                className="action-button secondary"
                onClick={handlePollMusicStatus}
                disabled={isPolling || isGeneratingMusic}
                title="Check if music generation is complete"
              >
                {isPolling ? 'Polling...' : '🔄 Poll Status'}
              </button>
            )}
          </div>
        </div>
        <ModelSelector
          label="Music Generation"
          value={musicGenerationModel}
          onChange={setMusicGenerationModel}
          options={availableModels.musicGeneration}
          disabled={isGeneratingMusic}
        />
        <AudioPlayer
          audioUrl={audioUrl}
          isLoading={isGeneratingMusic}
          error={musicError}
          placeholder={isPlaceholder}
          musicPrompt={musicPrompt}
          aiPrompt={musicGenerationPrompt}
          onPromptChange={handleMusicGenerationPromptChange}
          model={musicGenerationModel}
          instrumental={true}
          customMode={false}
          songs={generatedSongs}
        />
      </div>
    </div>
  );
}

export default AudioRecorder;

