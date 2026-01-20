import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import MainPage from './pages/MainPage';
import MusicPage from './pages/MusicPage';
import Navigation from './components/Navigation/Navigation';
import './styles/theme.css';
import './styles/components.css';
import './App.css';

function App() {
  return (
    <AppProvider>
      <div className="app">
        <Navigation />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/music" element={<MusicPage />} />
        </Routes>
      </div>
    </AppProvider>
  );
}

export default App;
