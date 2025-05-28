// src/pages/Projects.tsx
import { useState, useEffect } from 'react';
import './Styles/Projects.scss';

interface Repository {
  id: number;
  name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  updated_at: string;
  topics: string[];
  fork: boolean;
}

function Projects() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://api.github.com/users/Hyperiya/repos?sort=updated&per_page=100');
        
        if (!response.ok) {
          throw new Error('Failed to fetch repositories');
        }
        
        const data: Repository[] = await response.json();
        
        // Filter repos updated in the last 6 months and not forked
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const recentRepos = data
          .filter(repo => !repo.fork && new Date(repo.updated_at) > sixMonthsAgo)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        
        setRepos(recentRepos);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      JavaScript: '#f1e05a',
      TypeScript: '#3178c6',
      Python: '#3572A5',
      HTML: '#e34c26',
      CSS: '#563d7c',
      C: '#555555',
      'C++': '#f34b7d',
      'C#': '#178600',
      Java: '#b07219',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Go: '#00ADD8',
      Rust: '#dea584',
      Dart: '#00B4AB',
      Kotlin: '#A97BFF',
      Swift: '#ffac45',
      Lua: '#000080',
    };
    
    return language ? colors[language] || '#858585' : '#858585';
  };

  if (loading) {
    return <div className="projects-loading">Loading projects...</div>;
  }

  if (error) {
    return <div className="projects-error">Error: {error}</div>;
  }

  return (
    <div className="projects-container">
      <h1>My Recent Projects</h1>
      <p className="projects-subtitle">Projects I've worked on in the last 6 months</p>
      
      <div className="projects-grid">
        {repos.length > 0 ? (
          repos.map(repo => (
            <a 
              href={repo.html_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="project-card" 
              key={repo.id}
            >
              <div className="project-header">
                <h2>{repo.name}</h2>
                <div 
                  className="language-dot" 
                  style={{ backgroundColor: getLanguageColor(repo.language) }}
                ></div>
                <span className="language-name">{repo.language || 'Unknown'}</span>
              </div>
              
              <p className="project-description">
                {repo.description || 'No description available'}
              </p>
              
              {repo.topics && repo.topics.length > 0 && (
                <div className="project-topics">
                  {repo.topics.slice(0, 3).map(topic => (
                    <span key={topic} className="topic-tag">{topic}</span>
                  ))}
                </div>
              )}
              
              <div className="project-footer">
                <div className="stars">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 .25a.75.75 0 0 1 .673.418l3.058 6.197 6.839.994a.75.75 0 0 1 .415 1.279l-4.948 4.823 1.168 6.811a.75.75 0 0 1-1.088.791L12 18.347l-6.117 3.216a.75.75 0 0 1-1.088-.79l1.168-6.812-4.948-4.823a.75.75 0 0 1 .416-1.28l6.838-.993L11.328.668A.75.75 0 0 1 12 .25z"></path>
                  </svg>
                  <span>{repo.stargazers_count}</span>
                </div>
                <span className="updated-at">
                  Updated {new Date(repo.updated_at).toLocaleDateString()}
                </span>
              </div>
            </a>
          ))
        ) : (
          <p className="no-repos">No recent projects found</p>
        )}
      </div>
    </div>
  );
}

export default Projects;
