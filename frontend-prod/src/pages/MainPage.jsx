import LiveTranscription from '../components/LiveTranscription/LiveTranscription';
import LiveSummary from '../components/LiveSummary/LiveSummary';
import LiveMusicPrompt from '../components/LiveMusicPrompt/LiveMusicPrompt';
import './MainPage.css';

const MainPage = () => {
  return (
    <div className="main-page">
      <div className="page-container">
        <div className="page-header">
          <h1>Live Audio-to-Music Pipeline</h1>
          <p className="page-subtitle">
            Record audio, get real-time transcription, auto-updating summaries, and music prompts
          </p>
        </div>

        <div className="content-grid">
          <LiveTranscription />
          <LiveSummary />
          <LiveMusicPrompt />
        </div>
      </div>
    </div>
  );
};

export default MainPage;
