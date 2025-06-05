import express from 'express';
import bcrypt from 'bcrypt';
import { User, Token } from '../config/db.config.ts';
import { permissionMap } from '../config/permissions.ts';
import { authenticateToken, getTokenPerms } from '../middleware/auth.middleware.ts';
import { requestLimiter } from '../middleware/rateLimiter.middleware.ts';

const router = express.Router();

function sanitizeUsername(username: string): string {
    if (!username) return '';

    // Remove any HTML tags, special characters, and trim whitespace
    return username
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[^\w\s.-]/g, '') // Remove special characters except underscore, period, and hyphen
        .trim() // Remove leading/trailing whitespace
        .replace(/\s+/g, '_'); // Replace spaces with underscores
}

router.get('/', requestLimiter, authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check permissions
        const requiredPerms = [permissionMap.USER_VIEW];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            res.status(403).json({ message: 'Insufficient permissions' });
        }

        const users = await User.find();
        const safeUsers = users.map(user => {
            const { passwordHash, ...userWithoutPassword } = user.toObject();
            return userWithoutPassword;
        });
        res.json(safeUsers);
        return;
    } catch (error) {
        console.error('User list error:', error);
        res.status(500).json('User list error');
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
        const requiredPerms = [permissionMap.USER_DELETE];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }

        const { username } = req.body
        if (!username) {
            res.status(400).json({ message: `Username is required, you gave ${username}` });
            return;
        };
        const user = await User.findOne({ username });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        await user.deleteOne();

        // Removing session so removed user can no longer do anything!
        const session = await Token.findOne({ username });
        if (session) {
            await session.deleteOne();
        }

        res.json({ message: 'User deleted.' });
        return;

    } catch (error) {
        console.error('User deletion error:', error);
        res.status(500).json("User deletion error");
        return;
    }
});


router.post('/edit', requestLimiter, authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check permissions
        const requiredPerms = [permissionMap.USER_EDIT];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }

        const { newUsername, username, password } = req.body
        const user = await User.findOne({ username });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let change = false
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            if (passwordHash !== user.passwordHash) {
                user.passwordHash = passwordHash;
                change = true
            }
        }

        // Sanitize and validate newUsername before using it
        if (newUsername) {
            const sanitizedNewUsername = sanitizeUsername(newUsername);
            if (sanitizedNewUsername !== user.username) {
                user.username = sanitizedNewUsername;
                change = true
            }
        }

        const session = await Token.findOne({ username });
        if (session) {
            await session.deleteOne();
        }

        if (change) await user.save();

        res.json({ message: 'User edited' });
        return;
    } catch (error) {
        console.error('User edit error:', error);
        res.status(500).json(`Updating user failed.`);
        return;
    }
});

export default router;