// src/components/Admin/UserManagementPanel.tsx
import { useState, useEffect } from 'react';
import './UserManagementPanel.scss';

interface User {
    _id: string;
    username: string;
    role: string;
    createdAt: number;
}

const UserManagementPanel = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');

            if (!token) {
                setError('Authentication required');
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:5000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Add user
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');

            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username: newUsername, password: newPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add user');
            }

            // Reset form and refresh users
            setNewUsername('');
            setNewPassword('');
            await setShowAddForm(false);
            console.log('hide form')
            await fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    // Delete user
    const handleDeleteUser = async (username: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');

            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`http://localhost:5000/api/users/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username: username })
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            // Refresh users
            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    // Edit user
    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setNewUsername(user.username);
        setNewPassword('');
        setShowEditForm(true);
    };

    // Save edited user
    const handleSaveEdit = async (e: React.FormEvent, user: string) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            console.log(`orig un: ${user}, ${newUsername}`)
            const token = localStorage.getItem('admin_token');

            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`http://localhost:5000/api/users/edit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    newUsername: newUsername,
                    username: user,
                    password: newPassword || undefined // Only send password if it was changed
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update user');
            }

            // Reset form and refresh users
            setNewUsername('');
            setNewPassword('');
            setShowEditForm(false);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    if (loading) {
        return <div className="user-management-loading">Loading users...</div>;
    }

    return (
        <div className="user-management-panel">
            <div className="panel-header">
                <h2>User Management</h2>
                <button
                    className="add-user-btn"
                    onClick={() => {
                        setShowAddForm(!showAddForm);
                        setShowEditForm(false);
                    }}
                >
                    {showAddForm ? 'Cancel' : 'Add User'}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {showAddForm && (
                <div className="user-form">
                    <h3>Add New User</h3>
                    <form onSubmit={handleAddUser}>
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" >Add User</button>
                            <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {showEditForm && editingUser && (
                <div className="user-form">
                    <h3>Edit User</h3>
                    <form onSubmit={(e) => handleSaveEdit(e, editingUser.username)}>
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password (leave blank to keep unchanged)</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit">Save Changes</button>
                            <button type="button" onClick={() => setShowEditForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.username}</td>
                                    <td>{user.role}</td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="actions">
                                        <button
                                            className="edit-btn"
                                            onClick={() => handleEditUser(user)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteUser(user.username)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4}>No users found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagementPanel;
