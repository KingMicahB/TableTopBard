import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext();

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [musicPrompt, setMusicPrompt] = useState('');
  const [songs, setSongs] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const addSong = useCallback((song) => {
    setSongs((prev) => [...prev, song]);
    setPlaylist((prev) => [...prev, song]);
  }, []);

  const removeSongFromPlaylist = useCallback((index) => {
    setPlaylist((prev) => prev.filter((_, i) => i !== index));
    if (currentSongIndex === index) {
      setCurrentSongIndex(null);
    } else if (currentSongIndex > index) {
      setCurrentSongIndex((prev) => prev - 1);
    }
  }, [currentSongIndex]);

  const reorderPlaylist = useCallback((fromIndex, toIndex) => {
    setPlaylist((prev) => {
      const newPlaylist = [...prev];
      const [removed] = newPlaylist.splice(fromIndex, 1);
      newPlaylist.splice(toIndex, 0, removed);
      return newPlaylist;
    });
  }, []);

  const value = {
    transcription,
    setTranscription,
    summary,
    setSummary,
    musicPrompt,
    setMusicPrompt,
    songs,
    setSongs,
    addSong,
    playlist,
    setPlaylist,
    removeSongFromPlaylist,
    reorderPlaylist,
    currentSongIndex,
    setCurrentSongIndex,
    isRecording,
    setIsRecording,
    isTranscribing,
    setIsTranscribing,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
