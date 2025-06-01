// src/components/Admin/ProfileManagementPanel.tsx
import { useState, useEffect } from 'react';
import './ProfileManagementPanel.scss';

interface Profile {
    id: string;
    title: string;
    url: string;
    image: string;
    color: string;
}

const ProfileManagementPanel = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<{ filename: string, path: string }[]>([]);

    // Form states
    const [id, setId] = useState('');
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [image, setImage] = useState('');
    const [color, setColor] = useState('#4a6cf7');

    const fetchImages = async () => {
        try {
            const token = localStorage.getItem('admin_token');

            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch('https://localhost:5000/api/images', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch images');
            }

            const data = await response.json();
            setUploadedImages(data);
        } catch (err) {
            console.error('Error fetching images:', err);
        }
    };

    // Fetch profiles
    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://localhost:5000/api/profiles');

            if (!response.ok) {
                throw new Error('Failed to fetch profiles');
            }

            const data = await response.json();
            setProfiles(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
        fetchImages(); // Add this line
    }, []);


    // Handle edit profile
    const handleEditProfile = (profile: Profile) => {
        setIsCreating(false);
        setEditingProfile(profile);
        setTitle(profile.title);
        setUrl(profile.url);
        setImage(profile.image);
        setColor(profile.color || '#4a6cf7');
    };

    // Handle create new profile
    const handleCreateProfile = () => {
        setEditingProfile(null);
        setIsCreating(true);
        setId('');
        setTitle('');
        setUrl('');
        setImage('');
        setColor('#4a6cf7');
    };

    const handleDeleteProfile = async (profileId: string) => {
        if (!window.confirm(`Are you sure you want to delete the "${profiles.find(p => p.id === profileId)?.title}" profile?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');

            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch('https://localhost:5000/api/profiles/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id: profileId })
            });

            if (!response.ok) {
                throw new Error('Failed to delete profile');
            }

            // Refresh profiles
            fetchProfiles();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    // Handle save profile
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('admin_token');

            if (!token) {
                setError('Authentication required');
                return;
            }

            let endpoint = 'https://localhost:5000/api/profiles/update';
            let body: any = {
                title,
                url,
                image,
                color
            };

            if (isCreating) {
                endpoint = 'https://localhost:5000/api/profiles/create';
                body.id = id.toLowerCase().replace(/\s+/g, '-');
            } else if (editingProfile) {
                body.id = editingProfile.id;
            } else {
                return;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`Failed to ${isCreating ? 'create' : 'update'} profile`);
            }

            // Reset form and refresh profiles
            setEditingProfile(null);
            setIsCreating(false);
            fetchProfiles();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    if (loading) {
        return <div className="profile-management-loading">Loading profiles...</div>;
    }

    return (
        <div className="profile-management-panel" id='panel'>
            <div className="panel-header">
                <h2>Profile Management</h2>
                <button
                    className="create-btn"
                    onClick={handleCreateProfile}
                >
                    Add New Profile
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="profiles-grid">
                {profiles.map(profile => (
                    <div
                        key={profile.id}
                        className="profile-card"
                        style={{ borderColor: profile.color }}
                    >
                        <img src={profile.image} alt={profile.title} />
                        <div className="profile-info">
                            <h3>{profile.title}</h3>
                            <p>{profile.url}</p>
                            <div className="color-indicator" style={{ backgroundColor: profile.color }}></div>
                        </div>
                        <div className="card-actions">
                            <button
                                className="edit-btn"
                                onClick={() => handleEditProfile(profile)}
                            >
                                Edit
                            </button>
                            <button
                                className="delete-btn"
                                onClick={() => handleDeleteProfile(profile.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {(editingProfile || isCreating) && (
                <div className="edit-profile-modal">
                    <div className="modal-content">
                        <h3>{isCreating ? 'Create New Profile' : `Edit Profile: ${editingProfile?.title}`}</h3>
                        <form onSubmit={handleSaveProfile}>
                            {isCreating && (
                                <div className="form-group">
                                    <label htmlFor="id">Profile ID</label>
                                    <input
                                        type="text"
                                        id="id"
                                        value={id}
                                        onChange={(e) => setId(e.target.value)}
                                        placeholder="unique-identifier"
                                        required
                                    />
                                    <small>Unique identifier for this profile (no spaces, lowercase)</small>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="title">Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="image">Image</label>
                                <select
                                    id="image"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    required
                                    className="image-dropdown"
                                >
                                    <option value="">Select an image</option>
                                    {uploadedImages.map((img) => (
                                        <option key={img.filename} value={img.path}>
                                            {img.filename}
                                        </option>
                                    ))}
                                </select>
                                {image && (
                                    <div className="image-preview">
                                        <img src={image} alt="Selected" />
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="image">Image Path</label>
                                <input
                                    type="text"
                                    id="image"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="color">Color</label>
                                <input
                                    type="color"
                                    id="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="submit">{isCreating ? 'Create Profile' : 'Save Changes'}</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingProfile(null);
                                        setIsCreating(false);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileManagementPanel;
