import express from 'express';
import { Profile } from '../config/db.config.ts';
import { permissionMap } from '../config/permissions.ts';
import { authenticateToken, getTokenPerms } from '../middleware/auth.middleware.ts';
import { requestLimiter } from '../middleware/rateLimiter.middleware.ts';

const router = express.Router();

router.get('/', requestLimiter, async (req, res) => {
    try {
        
        const profiles = await Profile.find();
        res.json(profiles);
    } catch (error) {
        
        console.error('Error fetching profiles:', error);
        res.status(500).json({ message: 'Failed to fetch profiles' });
    }
});


router.post('/update', requestLimiter, authenticateToken, async (req, res) => {
    try {
        
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check permissions
        const requiredPerms = [permissionMap.PROFILE_EDIT];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }

        const { id, title, url, image, color } = req.body;

        if (!id) {
            res.status(400).json({ message: 'Profile ID is required' });
            return;
        }

        // Find and update the profile
        const profile = await Profile.findOne({ id });

        if (!profile) {
            res.status(404).json({ message: 'Profile not found' });
            return;
        }

        // Update fields if provided
        if (title) profile.title = title;
        if (url) profile.url = url;
        if (image) profile.image = image;
        if (color) profile.color = color;

        await profile.save();
        // Sanitize profile fields before sending to client
        const sanitizedProfile = {
            id: String(profile.id),
            title: String(profile.title),
            url: String(profile.url),
            image: String(profile.image),
            color: String(profile.color)
        };
        
        res.json({ message: 'Profile updated successfully', profile: sanitizedProfile });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});


router.post('/create', requestLimiter, authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check permissions
        const requiredPerms = [permissionMap.PROFILE_EDIT];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }

        const { id, title, url, image, color } = req.body;

        if (!id || !title || !url || !image) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }

        // Check if profile with this ID already exists
        const existingProfile = await Profile.findOne({ id });
        if (existingProfile) {
            res.status(409).json({ message: 'Profile with this ID already exists' });
            return;
        }

        // Create new profile
        const newProfile = await Profile.create({
            id,
            title,
            url,
            image,
            color: color || '#4a6cf7'
        });

        
        res.status(201).json({ message: 'Profile created successfully', profile: newProfile });
    } catch (error) {
        console.error('Error creating profile:', error);
        res.status(500).json({ message: 'Failed to create profile' });
    }
});


router.post('/delete', requestLimiter, authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check permissions
        const requiredPerms = [permissionMap.PROFILE_EDIT];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }

        const { id } = req.body;

        if (!id) {
            res.status(400).json({ message: 'Profile ID is required' });
            return;
        }

        // Find and delete the profile
        const profile = await Profile.findOne({ id });

        if (!profile) {
            res.status(404).json({ message: 'Profile not found' });
            return;
        }

        await profile.deleteOne();
        res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).json({ message: 'Failed to delete profile' });
    }
});

export default router;