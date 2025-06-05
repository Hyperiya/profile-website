// src/components/Admin/ContentManagementPanel.tsx
import { useState, useEffect, useRef } from 'react';
import './ContentManagementPanel.scss';
import DOMPurify from 'dompurify';
import { api } from '../../utils/api';

interface UploadedImage {
    filename: string;
    path: string;
}



const ContentManagementPanel = () => {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch all uploaded images
    const fetchImages = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');

            if (!token) {
                setError('Authentication required');
                setLoading(false);
                return;
            }

            const response = await api.fetch(`/api/upload/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch images');
            }

            // import DOMPurify from 'dompurify';
            // DOMPurify is used to sanitize the JSON data to prevent XSS attacks
            const jsonData = await response.text();
            const sanitizedData = DOMPurify.sanitize(jsonData);
            const data = JSON.parse(sanitizedData);

            setImages(data);
        
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
            setUploadLoading(true);
            const token = localStorage.getItem('admin_token');

            if (!token) {
                setError('Authentication required');
                setUploadLoading(false);
                return;
            }

            const response = await api.fetch(`/api/upload/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            // Refresh the image list
            fetchImages();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setUploadLoading(false);
            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Handle image deletion
    const handleDeleteImage = async (image: UploadedImage) => {
        if (!window.confirm(`Are you sure you want to delete this image?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');

            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await api.fetch(`/api/upload/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ filename: image.filename })
            });

            if (!response.ok) {
                throw new Error('Failed to delete image');
            }

            // Refresh the image list
            fetchImages();

            // Clear selection if the deleted image was selected
            if (selectedImage && selectedImage.filename === image.filename) {
                setSelectedImage(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    if (loading) {
        return <div className="content-management-loading">Loading content...</div>;
    }

    return (
        <div className="content-management-panel" id='panel'>
            <div className="panel-header">
                <h2>Content Management</h2>
                <div className="upload-container">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    <button
                        className="upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadLoading}
                    >
                        {uploadLoading ? 'Uploading...' : 'Upload New Image'}
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="content-section">
                <h3>Uploaded Images</h3>
                {images.length === 0 ? (
                    <p className="no-content">No images uploaded yet.</p>
                ) : (
                    <div className="images-grid">
                        {images.map((image) => (
                            <div
                                key={image.filename}
                                className={`image-card ${selectedImage?.filename === image.filename ? 'selected' : ''}`}
                                onClick={() => setSelectedImage(image)}
                            >
                                <div className="image-preview">
                                    <img src={image.path} alt={image.filename} />
                                </div>
                                <div className="image-info">
                                    <div className="image-name">{image.filename}</div>
                                    <button
                                        className="delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteImage(image);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedImage && (
                <div className="image-details">
                    <h3>Image Details</h3>
                    <div className="details-content">
                        <div className="large-preview">
                            <img src={selectedImage.path} alt={selectedImage.filename} />
                        </div>
                        <div className="details-info">
                            <div className="detail-item">
                                <span className="detail-label">URL:</span>
                                <div className="url-container">
                                    <span className="detail-value">{selectedImage.path}</span>
                                    <button
                                        className="copy-btn"
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedImage.path);
                                            alert('URL copied to clipboard!');
                                        }}
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Filename:</span>
                                <span className="detail-value">{selectedImage.filename}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Path:</span>
                                <span className="detail-value">{selectedImage.path}</span>
                            </div>
                            <div className="detail-item">
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteImage(selectedImage)}
                                >
                                    Delete Image
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentManagementPanel;
