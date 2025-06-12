import { useState, useEffect } from 'react';
import './Styles/Admin.scss';
import { useNavigate } from 'react-router-dom';
import AnalyticsPanel from '../components/Admin/AnalyticsPanel';
import UserManagementPanel from '../components/Admin/UserManagementPanel';
import ProfileManagementPanel from '../components/Admin/ProfileManagementPanel';
import ContentManagementPanel from '../components/Admin/ContentManagementPanel';
import { api } from '../utils/api';

enum panelMap {
    CONTENT = 'content',
    ANALYTICS = 'analytics',
    USERS = 'users',
    PROFILES = 'profiles'
}


function AdminDashboard() {
    const navigate = useNavigate();
    const [activePanel, setActivePanel] = useState<panelMap | null>();

    useEffect(() => {
        localStorage.setItem('admin_auth', 'true');
    })

    const handleLogout = async () => {
        localStorage.removeItem('admin_auth');

        const token = localStorage.getItem('admin_token');

        await api.fetch('/api/sessions/kill', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,

            },
            body: JSON.stringify({ token: token })
        });
        navigate('/');
    };

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

export default AdminDashboard;
