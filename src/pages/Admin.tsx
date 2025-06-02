// src/pages/Admin.tsx
import { useState, useEffect } from 'react';
import './Styles/Admin.scss';
import { useNavigate } from 'react-router-dom';
import AnalyticsPanel from '../components/Admin/AnalyticsPanel';
import UserManagementPanel from '../components/Admin/UserManagementPanel';
import ProfileManagementPanel from '../components/Admin/ProfileManagementPanel';
import ContentManagementPanel from '../components/Admin/ContentManagementPanel';

enum panelMap {
    CONTENT = 'content',
    ANALYTICS = 'analytics',
    USERS = 'users',
    PROFILES = 'profiles'
}

function Admin() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [activePanel, setActivePanel] = useState<panelMap | null>();


    // Check if already authenticated
    useEffect(() => {
        const authToken = localStorage.getItem('admin_auth');
        if (authToken) {
            setIsAuthenticated(true);
        }
    }, []);

    // Simple hash function (for demo purposes - use a proper crypto library in production)
    // const hashPasskey = async (key: string) => {
    //     const encoder = new TextEncoder();
    //     const data = encoder.encode(key);
    //     const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    //     const hashArray = Array.from(new Uint8Array(hashBuffer));
    //     return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    // };


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${window.API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: username, password: password })
            });

            const data = await response.json();
            const date = new Date()
            date.setTime(date.getTime() + 43200000)

            if (response.ok) {
                localStorage.setItem('admin_token', data.token);
                document.cookie = `token=${data.token};expires=${date}`
                setIsAuthenticated(true);
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Authentication error');
        }
    };

    const handleLogout = async () => {
        localStorage.removeItem('admin_auth');
        setIsAuthenticated(false);

        const token = localStorage.getItem('admin_token');

        await window.apiCall('/api/sessions/kill', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,

            },
            body: JSON.stringify({ token: token })
        });
        navigate('/');
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-login">
                <div className="login-container">
                    <h1>Admin Access</h1>
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button type="submit">
                            Login
                        </button>
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
                        <button
                            className={activePanel === panelMap.CONTENT ? 'active' : ''}
                            onClick={() => setActivePanel(() => {
                                if (activePanel === panelMap.CONTENT) {
                                    return null;
                                }
                                return panelMap.CONTENT;
                            })}
                        >
                            {activePanel === panelMap.CONTENT ? 'Hide Content' : 'Manage Content'}
                        </button>
                        <button
                            className={activePanel === panelMap.PROFILES ? 'active' : ''}
                            onClick={() => setActivePanel(() => {
                                if (activePanel === panelMap.PROFILES) {
                                    return null;
                                }
                                return panelMap.PROFILES;
                            })}
                        >
                            {activePanel === panelMap.PROFILES ? 'Hide Profiles' : 'Manage Profiles'}
                        </button>
                        <button
                            className={activePanel === panelMap.USERS ? 'active' : ''}
                            onClick={() => setActivePanel(() => {
                                if (activePanel === panelMap.USERS) {
                                    return null;
                                }
                                return panelMap.USERS;
                            })}
                        >
                            {activePanel === panelMap.USERS ? 'Hide Users' : 'Manage Users'}
                        </button>
                        <button
                            className={activePanel === panelMap.ANALYTICS ? 'active' : ''}
                            onClick={() => setActivePanel(() => {
                                if (activePanel === panelMap.ANALYTICS) {
                                    return null;
                                }
                                return panelMap.ANALYTICS;
                            })}
                        >
                            {activePanel === panelMap.ANALYTICS ? 'Hide Analytics' : 'View Analytics'}
                        </button>
                    </div>
                </section>

                <section className="admin-section">
                    <h2>System Status</h2>
                    <div className="status-item">
                        <span className="status-label">Last Updated:</span>
                        <span className="status-value">{new Date().toLocaleString()}</span>
                    </div>
                </section>
            </div >

            {activePanel === panelMap.ANALYTICS && <AnalyticsPanel />}
            {activePanel === panelMap.USERS && <UserManagementPanel />}
            {activePanel === panelMap.PROFILES && <ProfileManagementPanel />}
            {activePanel === panelMap.CONTENT && <ContentManagementPanel />}
        </div >
    );
}

export default Admin;
