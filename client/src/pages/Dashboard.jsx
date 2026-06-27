import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [gridSpanX, setGridSpanX] = useState(1);
  const [gridSpanY, setGridSpanY] = useState(1);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${apiUrl}/api/links`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLinks(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch links. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    if (!title.trim() || !url.trim()) {
      setFormError('Title and URL are required.');
      setSubmitting(false);
      return;
    }

    if (!url.startsWith('http')) {
      setFormError('URL must start with http or https.');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${apiUrl}/api/links`, {
        title,
        url,
        gridSpanX: Number(gridSpanX),
        gridSpanY: Number(gridSpanY)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLinks(prev => [...prev, res.data]);
      setFormSuccess('Link added successfully!');
      
      // Reset form
      setTitle('');
      setUrl('');
      setGridSpanX(1);
      setGridSpanY(1);
    } catch (err) {
      if (err.response) {
        setFormError(err.response.data.message || 'Failed to create link.');
      } else {
        setFormError('Could not reach the server.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const prepareChartData = (linksArray) => {
    return [...linksArray]
      .sort((a, b) => b.clickCount - a.clickCount)
      .map(link => ({
        name: link.title,
        clicks: link.clickCount
      }));
  };

  return (
    <div className="app-container">
      <nav className="nav-bar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="btn">
          ← View Bento Hub
        </Link>
        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </nav>

      <header style={{ marginBottom: '30px', textAlign: 'left' }}>
        <h1>📊 Analytics Dashboard</h1>
        <p>Monitor your link click metrics and add new bento cards.</p>
      </header>

      {error && (
        <div className="error-container" style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>
          <h2>⚠️ Connection Error</h2>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading dashboard content...
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Chart Panel */}
          <div className="dashboard-panel">
            <h2>
              <span>📈 Click Performance</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sorted by popularity</span>
            </h2>
            
            {links.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>
                No performance data to display. Add some links to begin tracking clicks.
              </div>
            ) : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={prepareChartData(links)}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#12131c',
                        borderColor: 'rgba(168, 85, 247, 0.4)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                      cursor={{ fill: 'rgba(168, 85, 247, 0.05)' }}
                    />
                    <Bar dataKey="clicks" fill="url(#colorGlow)" radius={[6, 6, 0, 0]}>
                      {/* Gradient Fill */}
                      <defs>
                        <linearGradient id="colorGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Creation Form Panel */}
          <div className="dashboard-panel">
            <h2>➕ Add New Card</h2>
            
            {formError && (
              <div style={{ color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}
            
            {formSuccess && (
              <div style={{ color: '#86efac', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleAddLink}>
              <div className="form-group">
                <label htmlFor="title">CARD TITLE</label>
                <input
                  id="title"
                  type="text"
                  className="form-control"
                  placeholder="e.g. My Portfolio"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="url">TARGET URL</label>
                <input
                  id="url"
                  type="text"
                  className="form-control"
                  placeholder="e.g. https://portfolio.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label htmlFor="spanX">WIDTH (GRID SPAN X)</label>
                  <select
                    id="spanX"
                    className="form-control"
                    value={gridSpanX}
                    onChange={(e) => setGridSpanX(Number(e.target.value))}
                  >
                    <option value={1}>1 Column</option>
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                    <option value={4}>4 Columns</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="spanY">HEIGHT (GRID SPAN Y)</label>
                  <select
                    id="spanY"
                    className="form-control"
                    value={gridSpanY}
                    onChange={(e) => setGridSpanY(Number(e.target.value))}
                  >
                    <option value={1}>1 Row</option>
                    <option value={2}>2 Rows</option>
                    <option value={3}>3 Rows</option>
                    <option value={4}>4 Rows</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '10px' }}
                disabled={submitting}
              >
                {submitting ? 'Creating Card...' : 'Add Link Card'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
