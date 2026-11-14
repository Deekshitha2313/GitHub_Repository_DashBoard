const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const getHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Insight-Dashboard',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
  }
  return headers;
};

app.get('/api/repo/:owner/:repo', async (req, res) => {
  const owner = req.params.owner;
  const repo = req.params.repo;
  const headers = getHeaders();

  const protocol = 'https://';
  const host = ['api', 'github', 'com'].join('.');
  const baseUrl = protocol + host + '/' + ['repos', owner, repo].join('/');
  const searchBase = protocol + host + '/' + ['search', 'issues'].join('/');

  try {
    const [repoRes, langRes, contribRes] = await Promise.all([
      axios.get(baseUrl, { headers }),
      axios.get(baseUrl + '/languages', { headers }),
      axios.get(baseUrl + '/contributors?per_page=8', { headers }),
    ]);

    let openIssuesCount = repoRes.data.open_issues_count || 0;
    let closedIssuesCount = 0;

    try {
      const openQuery = searchBase + '?q=repo:' + owner + '/' + repo + '+type:issue+state:open';
      const closedQuery = searchBase + '?q=repo:' + owner + '/' + repo + '+type:issue+state:closed';

      const [openRes, closedRes] = await Promise.all([
        axios.get(openQuery, { headers }),
        axios.get(closedQuery, { headers }),
      ]);
      openIssuesCount = openRes.data.total_count;
      closedIssuesCount = closedRes.data.total_count;
    } catch (issueErr) {
      console.warn('Search API limited, using fallback issue counts:', issueErr.message);
    }

    const languages = Object.entries(langRes.data).map(([name, bytes]) => ({
      name,
      bytes,
    }));

    const contributors = Array.isArray(contribRes.data)
      ? contribRes.data.map((c) => ({
          login: c.login,
          contributions: c.contributions,
          avatar: c.avatar_url,
          url: c.html_url,
        }))
      : [];

    res.json({
      info: {
        name: repoRes.data.full_name,
        description: repoRes.data.description,
        stars: repoRes.data.stargazers_count,
        forks: repoRes.data.forks_count,
        watchers: repoRes.data.watchers_count,
        openIssues: repoRes.data.open_issues_count,
        defaultBranch: repoRes.data.default_branch,
        url: repoRes.data.html_url,
      },
      languages,
      contributors,
      issuesAnalytics: [
        { name: 'Open Issues', count: openIssuesCount },
        { name: 'Closed Issues', count: closedIssuesCount },
      ],
    });
  } catch (error) {
    console.error('GitHub API Error:', error.response?.status, error.response?.data || error.message);
    const status = error.response?.status || 500;
    const message =
      status === 404
        ? 'Repository not found. Check the owner and repository name.'
        : status === 403
        ? 'GitHub API rate limit exceeded. Add a GITHUB_TOKEN in backend/.env.'
        : 'GitHub API Error: ' + (error.response?.data?.message || error.message);
    res.status(status).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log('Backend running on http://localhost:' + PORT);
});
