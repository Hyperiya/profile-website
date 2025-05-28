// src/pages/Admin.tsx
import { useState, useEffect } from 'react';
import './Styles/Admin.scss';
import { useNavigate } from 'react-router-dom';

// Use a strong hash (in a real app, this would be stored server-side)
// This is a SHA-256 hash of a complex passkey
const ADMIN_HASH = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8";

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if already authenticated
  useEffect(() => {
    const authToken = localStorage.getItem('admin_auth');
    if (authToken === ADMIN_HASH) {
      setIsAuthenticated(true);
    }
  }, []);

  // Simple hash function (for demo purposes - use a proper crypto library in production)
  const hashPasskey = async (key: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const hashedInput = await hashPasskey(passkey);
      
      if (hashedInput === ADMIN_HASH) {
        localStorage.setItem('admin_auth', ADMIN_HASH);
        setIsAuthenticated(true);
        setError('');
      } else {
        setError('Invalid passkey');
        // Add a small delay to prevent brute force attacks
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      setError('Authentication error');
    }
    
    setPasskey('');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h1>Admin Access</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="passkey">Passkey</label>
              <input
                type="password"
                id="passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit">Access</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
      
      <div className="admin-content">
        <section className="admin-section">
          <h2>Site Management</h2>
          <div className="admin-controls">
            <button>Update Profile</button>
            <button>Manage Content</button>
            <button>View Analytics</button>
          </div>
        </section>
        
        <section className="admin-section">
          <h2>System Status</h2>
          <div className="status-item">
            <span className="status-label">Last Updated:</span>
            <span className="status-value">{new Date().toLocaleString()}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Admin;
