// src/components/Admin/ImageUploader.tsx
import { useState } from 'react';
import { api } from '../../utils/api';
import './ImageUploader.scss';

interface ImageUploaderProps {
    onUploadSuccess?: (imageData: { filename: string, path: string }) => void;
    onClose?: () => void;
    isOpen: boolean;
    anchorEl?: HTMLElement | null;
}

const ImageUploader = ({ onUploadSuccess, onClose, isOpen, anchorEl }: ImageUploaderProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);
            setError(null);

            const token = localStorage.getItem('admin_token');
            if (!token) {
                setError('Authentication required');
                setUploading(false);
                return;
            }

            // Create FormData object
            const formData = new FormData();
            formData.append('image', selectedFile);

            // Use native fetch for better control over FormData
            const response = await api.fetch(`/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Don't set Content-Type header, browser will set it with boundary for FormData
                },
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (onUploadSuccess) {
                onUploadSuccess(data);
            }
            
            setSelectedFile(null);
            // Reset the file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
            
            // Close the popup after successful upload
            if (onClose) {
                onClose();
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="image-uploader-popup">
            <div className="image-uploader-content">
                <div className="image-uploader-header">
                    <h3>Upload Image</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                
                <div className="image-uploader-body">
                    {error && <div className="upload-error">{error}</div>}
                    
                    <div className="upload-container">
                        <div className="file-input-container">
                            <input
                                type="file"
                                id="file-upload"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                            <label htmlFor="file-upload" className={uploading ? 'disabled' : ''}>
                                {selectedFile ? selectedFile.name : 'Choose file'}
                            </label>
                        </div>
                        
                        {selectedFile && (
                            <div className="file-preview">
                                <img 
                                    src={URL.createObjectURL(selectedFile)} 
                                    alt="Preview" 
                                />
                            </div>
                        )}
                        
                        <div className="button-group">
                            <button 
                                type="button" 
                                onClick={handleUpload}
                                disabled={!selectedFile || uploading}
                                className="upload-button"
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                            
                            <button 
                                type="button"
                                onClick={onClose}
                                className="cancel-button"
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                        </div>
                        
                        {uploading && (
                            <div className="progress-bar">
                                <div 
                                    className="progress" 
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageUploader;