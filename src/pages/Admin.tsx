// src/pages/Admin.tsx
import { useState, useEffect } from 'react';
import './Styles/Admin.scss';
import { useNavigate } from 'react-router-dom';
import { api, fetchCsrfToken } from '../utils/api';

function Admin() {
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Fetch CSRF token when component mounts
    useEffect(() => {
        fetchCsrfToken();
    }, []);


    // Check if already authenticated
    

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
            const response = await api.fetch(`/api/auth/login`, {
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
                navigate('/admin/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }

        } catch (err) {
            setError('Authentication error');
        }
    };

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


export default Admin;
