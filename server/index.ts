import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import validator from 'validator';
import https from 'https';
import fs from 'fs';
import { doubleCsrf } from 'csrf-csrf';
import cookieParser from 'cookie-parser';

enum permissionMap {
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
    admin: [
        permissionMap.USER_CREATE,
        permissionMap.USER_DELETE,
        permissionMap.USER_VIEW,
        permissionMap.USER_EDIT,
        permissionMap.ANALYTICS_VIEW,
        permissionMap.PROFILE_EDIT,
        permissionMap.CONTENT_CREATE,
        permissionMap.CONTENT_DELETE,
        permissionMap.SESSION_KILL
    ],
    user: [
        permissionMap.CONTENT_CREATE,
        permissionMap.CONTENT_DELETE,
        permissionMap.PROFILE_EDIT,
        permissionMap.USER_VIEW,
        permissionMap.ANALYTICS_VIEW
    ],
}


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5;
const JWT_SECRET = process.env.JWT_SECRET || '';
const USER_DB_URI = process.env.USER_DB_URI || '';
const SESSION_DB_URI = process.env.SESSION_DB_URI || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const CSRF_SECRET = process.env.CSRF_SECRET || '';

if (!PORT) throw new Error('Missing environment variable: PORT');
if (!JWT_SECRET) throw new Error('Missing environment variable: JWT_SECRET');
if (!USER_DB_URI) throw new Error('Missing environment variable: USER_DB_URI');
if (!SESSION_DB_URI) throw new Error('Missing environment variable: SESSION_DB_URI');
if (!ADMIN_PASSWORD) throw new Error('Missing environment variable: ADMIN_PASSWORD');
if (!CSRF_SECRET) throw new Error('Missing environment variable: CSRF_SECRET');

const options = {
    key: fs.readFileSync('path/to/private-key.pem'),
    cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server running on port ${PORT}`);
});

// Connect to MongoDB
const userConnection = mongoose.createConnection(USER_DB_URI);

const sessionConnection = mongoose.createConnection(SESSION_DB_URI);

// Log connection status
userConnection.on('connected', () => console.info('Connected to User MongoDB'));
userConnection.on('error', (err) => console.error('User MongoDB connection error:', validator.escape(err)));

sessionConnection.on('connected', () => console.info('Connected to Session MongoDB'));
sessionConnection.on('error', (err) => console.error('Session MongoDB connection error:', validator.escape(err)));

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
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const { generateCsrfToken, validateRequest } = doubleCsrf({
    getSecret: () => CSRF_SECRET,
    cookieName: 'x-csrf-token',
    cookieOptions: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getSessionIdentifier: (req) => req.cookies?.sessionID || ''
});

// Apply CSRF protection to all routes
app.use((req, res, next) => {
    // Skip CSRF validation for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    try {
        validateRequest(req);
        next();
    } catch (error) {
        res.status(403).json({ error: 'CSRF validation failed' });
    }
});


async function createUser(username: string, password: string) {
    const sanitizedUsername = validator.escape(username)
    const user = await User.findOne({ username: sanitizedUsername })
    if (user) {
        // amazonq-ignore-next-line
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
// amazonq-ignore-next-line
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
        throw new Error(`Error setting up admin user:, ${error}`);

    }
}

// Call this function when the server starts
createInitialUser();

// Authentication middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
        return; // Return void here
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            res.status(403).json({ message: 'Forbidden' });
            return; // Return void here
        }

        req.user = user;
        next(); // Call next() to continue to the route handler
    });
};

async function storeToken(token: string, username: string, permissions: string[], createdAt: number, expiresAt: number, role: string) {
    const sanitizedUsername = await validator.escape(username)
    const existingToken = await Token.findOne({ sanitizedUsername });
    if (existingToken) {
        existingToken.deleteOne();
    }

    return Token.create({
        username: sanitizedUsername,
        token: token,
        permissions: permissions,
        createdAt: createdAt,
        expiresAt: expiresAt,
        role: role
    });
}


async function getTokenPerms(token: string): Promise<permissionMap[]> {
    const sanitizedToken = await validator.escape(token)
    const existingToken = await Token.findOne({ sanitizedToken });
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
        const enumValue = Object.values(permissionMap).find(val => val === perm);
        if (!enumValue) {
            console.warn(`Unknown permission: ${validator.escape(perm)}`);
            return null;
        }
        return enumValue as permissionMap;
    }).filter(Boolean) as permissionMap[]; // Filter out any null values
}

app.get('/api/csrf-token', (req, res) => {
    const token = generateCsrfToken(req, res);
    res.json({ csrfToken: token });
    return;
});
// Login route
app.post('/api/login', async (req: express.Request, res: express.Response) => {
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


        res.json(await validator.escape(token));
        return;
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
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check permissions
        const requiredPerms = [permissionMap.USER_CREATE];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }
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
        res.status(500).json({ message: error });
    }
});

app.get('/api/users/', authenticateToken, async (req: express.Request, res: express.Response) => {
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
        console.error('Registration error:', error);
        res.status(500).json({ message: error });
    }
})

app.post('/api/users/delete', authenticateToken, async (req: express.Request, res: express.Response) => {
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
        console.error('Registration error:', error);
        res.status(500).json({ message: error });
        return;
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
        const passwordHash = await bcrypt.hash(password, 10);
        if (passwordHash !== user.passwordHash) {
            user.passwordHash = passwordHash;
            change = true
        }

        // Sanitize and validate newUsername before using it
        const sanitizedNewUsername = sanitizeUsername(newUsername); // 
        if (sanitizedNewUsername !== user.username) {
            user.username = sanitizedNewUsername;
            change = true
        }

        const session = await Token.findOne({ username });
        if (session) {
            await session.deleteOne();
        }

        if (change) await user.save();

        res.json({ message: 'User edited' });
        return;
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json(`Updating user failed.`);
        return;
    }

})

app.post('/api/sessions/kill', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check permissions
        const requiredPerms = [permissionMap.SESSION_KILL];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        };

        const { username } = req.body
        if (!username) {
            const { token } = req.body
            if (token) {
                const session = await Token.findOne({ token });
                if (!session) {
                    res.status(404).json({ message: 'Session not found' });
                    return;
                }
                await session.deleteOne();

                res.json({ message: 'Session killed' });
                return;
            }

            res.status(400).json({ message: 'Username or token is required' });
            return;
        };
        const session = await Token.findOne({ username });
        if (!session) {
            res.status(404).json({ message: 'Session not found' });
            return;
        };
        await session.deleteOne();

        res.json({ message: 'Session killed' });
        return;
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error });
        return;
    }
});

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
