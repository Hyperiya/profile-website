import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { kill } from 'process';

enum permissionMaps {
    USER_CREATE = 'user_create', // Create user
    USER_DELETE = 'user_delete', // Delete existing users
    USER_EDIT = 'user_edit', // Edit existing users
    USER_VIEW = 'user_view', // View existing users
    ANALYTICS_VIEW = 'analytics_view', // See Visit Analytics
    PROFILE_EDIT = 'profile_edit', // Profile Update (Existing IMGS, change links and text)
    CONTENT_CREATE = 'content_create', // Image Upload UPL
    CONTENT_DELETE = 'content_delete', // Image Upload DLT
    SETTINGS_EDIT = 'settings_edit', // Edit site settings
    SESSION_KILL = 'session_kill'
}

const permissions = {
    admin: [permissionMaps.USER_CREATE, permissionMaps.USER_DELETE, permissionMaps.USER_VIEW, permissionMaps.USER_EDIT, permissionMaps.ANALYTICS_VIEW, permissionMaps.PROFILE_EDIT, permissionMaps.CONTENT_CREATE, permissionMaps.CONTENT_DELETE, permissionMaps.SESSION_KILL],
    user: [permissionMaps.CONTENT_CREATE, permissionMaps.CONTENT_DELETE, permissionMaps.PROFILE_EDIT, permissionMaps.USER_VIEW, permissionMaps.ANALYTICS_VIEW],
}


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;
const USER_DB_URI = process.env.USER_DB_URI;
const SESSION_DB_URI = process.env.SESSION_DB_URI;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

// Connect to MongoDB
const userConnection = mongoose.createConnection(USER_DB_URI);
const sessionConnection = mongoose.createConnection(SESSION_DB_URI);

// Log connection status
userConnection.on('connected', () => console.log('Connected to User MongoDB'));
userConnection.on('error', (err) => console.error('User MongoDB connection error:', err));

sessionConnection.on('connected', () => console.log('Connected to Session MongoDB'));
sessionConnection.on('error', (err) => console.error('Session MongoDB connection error:', err));

// Define User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Number, default: Date.now() },
    permissions: { type: [String], required: true },
    role: { type: String, required: true }
});

const tokenSchema = new mongoose.Schema({
    username: { type: String, required: true },
    token: { type: String, required: true },
    permissions: { type: [String], required: true },
    createdAt: { type: Number, default: Date.now() },
    expiresAt: { type: Number, required: true },
    role: { type: String, required: true }
});

// Create User model
const User = userConnection.model('User', userSchema);
const Token = sessionConnection.model('Token', tokenSchema);

// Add type declaration for Express Request
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

// Middleware
app.use(cors());
app.use(express.json());

async function createUser(username: string, password: string) {
    const fixedUsername = sanitizeUsername(username)
    const user = await User.findOne({ username: fixedUsername })
    if (user) {
        // amazonq-ignore-next-line
        return Error('User already exists');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    return User.create({
        username,
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
            const newHash = await bcrypt.hash('securepassword', 10);
            existingUser.passwordHash = newHash;
            await existingUser.save();
            console.info('Admin user updated');
        }
    } catch (error) {
        console.error('Error setting up admin user:', error);

    }
}

// Call this function when the server starts
createInitialUser();

// Authentication middleware
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
};

async function storeToken(token: string, username: string, permissions: string[], createdAt: number, expiresAt: number, role: string) {
    const existingToken = await Token.findOne({ username });
    if (existingToken) {
        existingToken.deleteOne();
    }

    return Token.create({
        username: username,
        token: token,
        permissions: permissions,
        createdAt: createdAt,
        expiresAt: expiresAt,
        role: role
    });
}


async function getTokenPerms(token: string): Promise<permissionMaps[]> {
    const existingToken = await Token.findOne({ token });
    if (!existingToken) {
        throw new Error('Token Expired');
    }
    if (existingToken.expiresAt < Date.now()) {
        existingToken.deleteOne();
        throw new Error('Token Expired');
    }

    // Convert string permissions to enum values
    return existingToken.permissions.map(perm => {
        // Check if the permission string exists in the enum
        const enumValue = Object.values(permissionMaps).find(val => val === perm);
        if (!enumValue) {
            console.warn(`Unknown permission: ${perm}`);
            return null;
        }
        return enumValue as permissionMaps;
    }).filter(Boolean) as permissionMaps[]; // Filter out any null values
}
// Login route
app.post('/api/login', async (req: express.Request, res: express.Response) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: 'Invalid credentials (Username)' });

        // Check password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return res.status(401).json({ message: 'Invalid credentials (Password)' });

        // Generate token
        const token = jwt.sign({
            id: user._id,
            username: user.username
        }, JWT_SECRET, { expiresIn: '1h' });
        console.log(token)

        const userPermissions = user.permissions;

        await storeToken(
            token,
            user.username,
            userPermissions,
            Date.now(),
            Date.now() + 3600000, // 1 hour in milliseconds
            user.role
        );

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/register', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check permissions
        const requiredPerms = [permissionMaps.USER_CREATE];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        const { username, password } = req.body
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        };
        createUser(username, password);
        res.json({ message: 'User created' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error });
    }
});

app.get('/api/users/', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check permissions
        const requiredPerms = [permissionMaps.USER_VIEW];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        const users = await User.find();
        users.forEach(user => {
            user.passwordHash = undefined;
        });
        res.json(users);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error });
    }
})

app.post('/api/users/delete', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check permissions
        const requiredPerms = [permissionMaps.USER_DELETE];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        const { username } = req.body
        if (!username) {
            return res.status(400).json({ message: `Username is required, you gave ${username}` });
        };
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await user.deleteOne();

        // Removing session so removed user can no longer do anything!
        const session = await Token.findOne({ username });
        if (session) {
            await session.deleteOne();
        }

        res.json({ message: 'User deleted.' });


    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error });
    }
})

function sanitizeUsername(username: string): string {
  if (!username) return '';
  
  // Remove any HTML tags, special characters, and trim whitespace
  return username
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s.-]/g, '') // Remove special characters except underscore, period, and hyphen
    .trim() // Remove leading/trailing whitespace
    .replace(/\s+/g, '_'); // Replace spaces with underscores
}

app.post('/api/users/edit', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check permissions
        const requiredPerms = [permissionMaps.USER_EDIT];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        const { newUsername, username, password } = req.body
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        if (passwordHash !== user.passwordHash) {
            user.passwordHash = passwordHash;
        }

        // Sanitize and validate newUsername before using it
        const sanitizedNewUsername = sanitizeUsername(newUsername); // 
        if (sanitizedNewUsername !== user.username) {
            user.username = sanitizedNewUsername;
        }

        const session = await Token.findOne({ username });
        if (session) {
            await session.deleteOne();
        }

        await user.save();

        res.json({ message: 'User edited' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message });
    }

})

app.post('api/sessions/kill', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check permissions
        const requiredPerms = [permissionMaps.SESSION_KILL];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        const { username } = req.body
        if (!username) {
            const { token } = req.body
            if (token) {
                const session = await Token.findOne({ token });
                if (!session) {
                    return res.status(404).json({ message: 'Session not found' });
                }
                await session.deleteOne();

                return res.json({ message: 'Session killed' });
            }

            return res.status(400).json({ message: 'Username or token is required' });
        };
        const session = await Token.findOne({ username });
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        await session.deleteOne();

        res.json({ message: 'Session killed' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error });
    }
}
)

// Protected route example
app.get('/api/admin/data', authenticateToken, (req: express.Request, res: express.Response) => {
    res.json({
        message: 'Protected data',
        user: req.user,
        stats: {
            visitors: 1024,
            pageViews: 3500,
            uniqueUsers: 750
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
