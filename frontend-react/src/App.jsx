import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  GitBranch,
  Star,
  GitFork,
  AlertCircle,
  Search,
  Users,
  Code2,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import './App.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function App() {
  const [repoInput, setRepoInput] = useState('facebook/react');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRepoInsights = async (targetRepo) => {
    const trimmed = targetRepo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    const parts = trimmed.split('/');

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError('Enter a valid repository format like "owner/repo" (e.g., facebook/react).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`http://localhost:5000/api/repo/${parts[0]}/${parts[1]}`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not connect to backend server on port 5000.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepoInsights('facebook/react');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchRepoInsights(repoInput);
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="brand">
          <GitBranch size={28} color="#3b82f6" />
          <h1>GitHub Repository Insight Dashboard</h1>
        </div>

        <form onSubmit={handleSubmit} className="search-form">
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="e.g., torvalds/linux or facebook/react"
          />
          <button type="submit" disabled={loading}>
            <Search size={18} />
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {data && (
        <main className="main-content">
          <section className="repo-banner">
            <div>
              <h2>
                {data.info.name}{' '}
                <a href={data.info.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} />
                </a>
              </h2>
              <p>{data.info.description || 'No description provided.'}</p>
            </div>
            <span className="branch-badge">Branch: {data.info.defaultBranch}</span>
          </section>

          <section className="kpi-grid">
            <div className="kpi-card">
              <Star size={24} color="#f59e0b" />
              <div>
                <span>Stars</span>
                <h3>{data.info.stars.toLocaleString()}</h3>
              </div>
            </div>

            <div className="kpi-card">
              <GitFork size={24} color="#3b82f6" />
              <div>
                <span>Forks</span>
                <h3>{data.info.forks.toLocaleString()}</h3>
              </div>
            </div>

            <div className="kpi-card">
              <AlertCircle size={24} color="#ef4444" />
              <div>
                <span>Open Issues</span>
                <h3>{data.info.openIssues.toLocaleString()}</h3>
              </div>
            </div>

            <div className="kpi-card">
              <Users size={24} color="#10b981" />
              <div>
                <span>Top Contributors</span>
                <h3>{data.contributors.length}</h3>
              </div>
            </div>
          </section>

          <section className="charts-grid">
            <div className="chart-card">
              <h3>
                <Users size={18} /> Top Contributors (Commits)
              </h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.contributors}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="login" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }}
                    />
                    <Bar dataKey="contributions" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3>
                <Code2 size={18} /> Language Distribution (Bytes)
              </h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.languages}
                      dataKey="bytes"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {data.languages.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card full-width">
              <h3>
                <AlertCircle size={18} /> Issue Analytics (Open vs Closed)
              </h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.issuesAnalytics} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={110} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
