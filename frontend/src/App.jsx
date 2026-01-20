import React from 'react';
import AudioRecorder from './components/AudioRecorder';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>TableTopBard</h1>
        <p>Transform your voice into music</p>
      </header>
      <main>
        <AudioRecorder />
      </main>
    </div>
  );
}

export default App;

