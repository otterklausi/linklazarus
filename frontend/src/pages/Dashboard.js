import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function Dashboard({ user, onLogout }) {
  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState('de');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [results, setResults] = useState([]);
  const [credits, setCredits] = useState(user.credits);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchResults = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/results`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setSelectedJob(jobId);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ keyword, region })
      });

      const data = await response.json();

      if (response.ok) {
        setCredits(data.user?.credits || credits - 1);
        setKeyword('');
        fetchJobs();
      } else {
        setError(data.error || 'Failed to create job');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="badge badge-warning">⏳ Pending</span>,
      processing: <span className="badge badge-info">🔄 Processing</span>,
      completed: <span className="badge badge-success">✅ Completed</span>,
      failed: <span className="badge badge-danger">❌ Failed</span>
    };
    return badges[status] || status;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-logo">🔗 LinkLazarus</div>
        <nav className="dashboard-nav">
          <div className="credits-badge">
            <span>⚡</span>
            <span>{credits} Credits</span>
          </div>
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </nav>
      </header>

      <main className="dashboard-content">
        {/* Job Form */}
        <div className="card job-form-card fade-in">
          <h2>🔍 Start New Search</h2>
          {error && <div className="login-error" style={{marginBottom: '1rem'}}>{error}</div>}
          
          <form onSubmit={handleSubmit} className="job-form">
            <div className="form-group" style={{marginBottom: 0}}>
              <label className="form-label">Keyword</label>
              <input
                type="text"
                className="form-input"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g., Paleo Diät, Low Carb Rezepte..."
                required
              />
            </div>
            
            <div className="form-group" style={{marginBottom: 0}}>
              <label className="form-label">Region</label>
              <select
                className="form-select"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="de">🇩🇪 Germany</option>
                <option value="us">🇺🇸 USA</option>
                <option value="uk">🇬🇧 UK</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !keyword}
            >
              {loading ? 'Starting...' : 'Start Search (1 Credit)'}
            </button>
          </form>
        </div>

        {/* Jobs List */}
        <div className="jobs-section">
          <h2>📋 Recent Searches</h2>
          <div className="jobs-list">
            {jobs.length === 0 ? (
              <div className="card empty-state">
                <div className="empty-state-icon">🔍</div>
                <p>No searches yet. Start your first search above!</p>
              </div>
            ) : (
              jobs.map(job => (
                <div
                  key={job.id}
                  className="job-item"
                  onClick={() => job.status === 'completed' && fetchResults(job.id)}
                  style={{ cursor: job.status === 'completed' ? 'pointer' : 'default' }}
                >
                  <div className="job-info">
                    <h3>{job.keyword}</h3>
                    <div className="job-meta">
                      <span>🌍 {job.region.toUpperCase()}</span>
                      <span>🕒 {new Date(job.created_at).toLocaleDateString()}</span>
                      {job.result_count > 0 && (
                        <span>💔 {job.result_count} broken links found</span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Results Table */}
        {selectedJob && results.length > 0 && (
          <div className="results-section fade-in">
            <h2>💔 Broken Links Found</h2>
            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Source Page</th>
                    <th>Broken Link</th>
                    <th>Anchor Text</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, idx) => (
                    <tr key={idx}>
                      <td className="source-cell">
                        <a href={result.source_url} target="_blank" rel="noopener noreferrer">
                          {new URL(result.source_url).hostname}
                        </a>
                      </td>
                      <td className="broken-link-cell">
                        {result.broken_url.substring(0, 50)}...
                      </td>
                      <td className="anchor-text">
                        {result.anchor_text || '—'}
                      </td>
                      <td>
                        <span className="badge badge-warning">{result.status_code}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;