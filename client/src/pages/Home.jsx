import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useFetchLinks } from '../hooks/useFetchLinks';
import BentoCard from '../components/BentoCard';
import SkeletonGrid from '../components/SkeletonGrid';

const Home = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { links: initialLinks, loading, error } = useFetchLinks(`${apiUrl}/api/links`);
  const [links, setLinks] = useState([]);

  React.useEffect(() => {
    if (initialLinks) {
      setLinks(initialLinks);
    }
  }, [initialLinks]);

  const handleCardClick = async (item) => {
    // Open in a new tab immediately
    window.open(item.url, '_blank', 'noopener,noreferrer');
    
    // Optimistically increment clickCount in UI
    setLinks(prev => prev.map(l => l._id === item._id ? { ...l, clickCount: l.clickCount + 1 } : l));

    try {
      // Send silent PATCH call to increment click count on server
      await axios.patch(`${apiUrl}/api/links/click/${item._id}`);
    } catch (err) {
      console.error('Click tracking failed:', err);
    }
  };

  return (
    <div className="app-container">
      <nav className="nav-bar">
        <Link to="/dashboard" className="btn btn-primary">
          Admin Dashboard
        </Link>
      </nav>

      <header>
        <h1>⚡ Bento Link Hub</h1>
        <p>Your beautiful personal link ecosystem. Click a card to explore.</p>
      </header>

      {loading && <SkeletonGrid />}

      {error && (
        <div className="error-container">
          <h2>⚠️ Connection Error</h2>
          <p>Could not reach the server. Make sure your backend is running and the database is active.</p>
          <button onClick={() => window.location.reload()} className="btn">
            Retry Connection
          </button>
        </div>
      )}

      {!loading && !error && links.length === 0 && (
        <div className="error-container" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
          <h2>📭 No Links Available</h2>
          <p>The bento grid is currently empty. Login to the dashboard to add your first links.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: '10px' }}>
            Get Started
          </Link>
        </div>
      )}

      {!loading && !error && links.length > 0 && (
        <div className="bento-grid">
          {links.map((item) => (
            <BentoCard key={item._id} item={item} onClick={handleCardClick} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
