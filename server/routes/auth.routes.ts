import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../config/db.config.ts';
import { permissions } from '../config/permissions.ts';
import { loginLimiter } from '../middleware/rateLimiter.middleware.ts';
import { authenticateToken, storeToken } from '../middleware/auth.middleware.ts';
import validator from 'validator';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

if (!JWT_SECRET) throw new Error('Missing environment variable: JWT_SECRET');
if (!ADMIN_PASSWORD) throw new Error('Missing environment variable: ADMIN_PASSWORD');

async function createUser(username: string, password: string) {
    const sanitizedUsername = validator.escape(username)
    const user = await User.findOne({ username: sanitizedUsername })
    if (user) {
        return Error('User already exists');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    return User.create({
        username: sanitizedUsername,
        passwordHash,
        permissions: permissions.user,
        role: 'User'
    });
}

// Create initial admin user if it doesn't exist
async function createInitialUser() {
    try {
        const existingUser = await User.findOne({ username: 'Admin' });

        if (!existingUser) {
            const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
            await User.create({
                username: 'Admin',
                passwordHash,
                permissions: permissions.admin,
                role: 'Admin'
            });
            console.info('Admin user created');
        } else {
            // Update existing admin's password hash
            const newHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
            existingUser.passwordHash = newHash;
            await existingUser.save();
            console.info('Admin user updated');
        }
    } catch (error) {
        throw new Error(`Error setting up admin user:, ${error}`);
    }
}

// Call this function when the server starts
createInitialUser();

// Login route
router.post('/login', loginLimiter, async (req: express.Request, res: express.Response) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials (Username)' })
            return;
        };

        // Check password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            res.status(401).json({ message: 'Invalid credentials (Password)' })
            return;
        };

        // Generate token
        const token = jwt.sign({
            id: user._id,
            username: user.username
        }, JWT_SECRET, { expiresIn: '1h' });

        const userPermissions = user.permissions;

        await storeToken(
            token,
            user.username,
            userPermissions,
            Date.now(),
            Date.now() + 3600000, // 1 hour in milliseconds
            user.role
        );

        await res.json({ token: token });
        return;
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/register', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const { username, password } = req.body
        if (!username || !password) {
            res.status(400).json({ message: 'Username and password are required' });
            return;
        };
        createUser(username, password);
        res.json({ message: 'User created' });
        return;
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json('Registration error');
    }
});

export default router;