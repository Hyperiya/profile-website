import express from 'express';
import path from 'path';
import fs from 'fs';
import { permissionMap } from '../config/permissions.ts';
import { authenticateToken, getTokenPerms } from '../middleware/auth.middleware.ts';
import { requestLimiter } from '../middleware/rateLimiter.middleware.ts';
import { upload, uploadsDir } from '../config/multer.config.ts';

// Add Multer types to Express Request


const router = express.Router();

router.post('/', requestLimiter, authenticateToken, upload.single('image'), async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check permissions
        const requiredPerms = [permissionMap.CONTENT_CREATE];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        // Get the server's base URL
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        // Return the full URL path
        res.json({
            filename: req.file.filename,
            path: `${baseUrl}/uploads/${req.file.filename}`
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            message: 'Failed to upload image'
        });
    }
});

router.get('/', requestLimiter, authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check permissions
        const requiredPerms = [permissionMap.CONTENT_CREATE];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }

        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        // Read the uploads directory
        fs.readdir(uploadsDir, (err, files) => {
            if (err) {
                console.error('Error reading uploads directory:', err);
                res.status(500).json({ message: 'Failed to read uploads directory' });
                return;
            }

            // Filter for image files
            const imageFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
            });

            // Create image objects with full URLs
            const images = imageFiles.map(file => ({
                filename: file,
                path: `${baseUrl}/uploads/${file}`
            }));

            res.json(images);
        });
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ message: 'Failed to fetch images' });
    }
});

router.post('/delete', requestLimiter, authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check permissions
        const requiredPerms = [permissionMap.CONTENT_DELETE];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }

        const { filename } = req.body;

        if (!filename) {
            res.status(400).json({ message: 'Filename is required' });
            return;
        }

        // Ensure the filename is safe (no path traversal)
        const safeName = path.basename(filename);
        const filePath = path.join(uploadsDir, safeName);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Delete the file
        fs.unlinkSync(filePath);
        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ message: 'Failed to delete image' });
    }
});

export default router;