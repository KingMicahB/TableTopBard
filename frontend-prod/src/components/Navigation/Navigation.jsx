import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          TableTopBard
        </Link>
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Live Recording
          </Link>
          <Link 
            to="/music" 
            className={`nav-link ${location.pathname === '/music' ? 'active' : ''}`}
          >
            Music Player
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
