import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import validator from 'validator';
import https from 'https';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

import rateLimit from 'express-rate-limit';

import { v4 as uuidv4 } from 'uuid';

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

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `image-${uniqueSuffix}${ext}`);
    }
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: 'Too many login attempts, please try again after 5 minutes' },
  skipSuccessfulRequests: false, // Count all requests
});

const requestLimiter = rateLimit({ 
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: 'Too many requests, please try again later' },
    skipSuccessfulRequests: false, // Count all requests
});


// File filter to only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Serve uploaded files statically

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5;
const JWT_SECRET = process.env.JWT_SECRET || '';
const USER_DB_URI = process.env.USER_DB_URI || '';
const SESSION_DB_URI = process.env.SESSION_DB_URI || '';
const PROFILE_DB_URI = process.env.PROFILE_DB_URI || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const CSRF_SECRET = process.env.CSRF_SECRET || '';

if (!PORT) throw new Error('Missing environment variable: PORT');
if (!JWT_SECRET) throw new Error('Missing environment variable: JWT_SECRET');
if (!USER_DB_URI) throw new Error('Missing environment variable: USER_DB_URI');
if (!SESSION_DB_URI) throw new Error('Missing environment variable: SESSION_DB_URI');
if (!ADMIN_PASSWORD) throw new Error('Missing environment variable: ADMIN_PASSWORD');
if (!CSRF_SECRET) throw new Error('Missing environment variable: CSRF_SECRET');



// Connect to MongoDB
const userConnection = mongoose.createConnection(USER_DB_URI);
const sessionConnection = mongoose.createConnection(SESSION_DB_URI);
const profileConnection = mongoose.createConnection(PROFILE_DB_URI);

// Log connection status
userConnection.on('connected', () => console.info('Connected to User MongoDB'));
userConnection.on('error', (err) => console.error('User MongoDB connection error:', validator.escape(err)));

sessionConnection.on('connected', () => console.info('Connected to Session MongoDB'));
sessionConnection.on('error', (err) => console.error('Session MongoDB connection error:', validator.escape(err)));

profileConnection.on('connected', () => console.info('Connected to Profile MongoDB'));
profileConnection.on('error', (err) => console.error('Profile MongoDB connection error:', validator.escape(err)));


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

const ProfileSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    image: { type: String, required: true },
    color: { type: String, default: '#4a6cf7' },
});

const VisitorSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, unique: true },
  firstVisit: { type: Date, required: true },
  lastVisit: { type: Date, required: true },
  visits: { type: Number, default: 1 },
  // Optional: track additional data
  referrer: { type: String },
  userAgent: { type: String }
});

const DailyVisitSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  visitors: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 }
});

// Create User model
const User = userConnection.model('User', userSchema);
const Token = sessionConnection.model('Token', tokenSchema);
const Profile = profileConnection.model('Profile', ProfileSchema);
const Visitor = userConnection.model('Visitor', VisitorSchema);
const DailyVisit = userConnection.model('DailyVisit', DailyVisitSchema);


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
app.use('/uploads', express.static(uploadsDir));

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
            console.error(err)
            res.status(403).json({ message: 'Forbidden' });
            return; // Return void here
        }

        req.user = user;
        next(); // Call next() to continue to the route handler
    });
};

async function storeToken(token: string, username: string, permissions: string[], createdAt: number, expiresAt: number, role: string) {
    const sanitizedUsername = await validator.escape(username)
    const existingToken = await Token.findOne({ username: sanitizedUsername });
    if (existingToken) {
        await existingToken.deleteOne();
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
    const existingToken = await Token.findOne({ token: sanitizedToken });
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

// Login route
app.post('/api/login', loginLimiter, async (req: express.Request, res: express.Response) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        console.log(username, user)
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials (Username)' })
            return;
        };

        // Check password
        console.log(password)
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
        console.log(token)

        return;
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/register', requestLimiter, authenticateToken, async (req: express.Request, res: express.Response) => {
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
        res.status(500).json('Registration error');
    }
});

app.get('/api/users/', requestLimiter, authenticateToken, async (req: express.Request, res: express.Response) => {
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
        res.status(500).json('Registration error');
    }
})

app.post('/api/users/delete', requestLimiter, authenticateToken, async (req: express.Request, res: express.Response) => {
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
        res.status(500).json("Registration error");
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

app.post('/api/users/edit', requestLimiter, authenticateToken, async (req: express.Request, res: express.Response) => {
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

app.post('/api/sessions/kill', requestLimiter, authenticateToken, async (req: express.Request, res: express.Response) => {
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
        res.status(500).json('Registration error');
        return;
    }
});

// Protected route example
app.get('/api/admin/data', requestLimiter, authenticateToken, (req: express.Request, res: express.Response) => {
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

app.get('/api/profiles', requestLimiter, async (req, res) => {
    try {
        const profiles = await Profile.find();
        res.json(profiles);
    } catch (error) {
        console.error('Error fetching profiles:', error);
        res.status(500).json({ message: 'Failed to fetch profiles' });
    }
});

// Update a profile
app.post('/api/profiles/update', requestLimiter, authenticateToken, async (req, res) => {
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

        const { id, title, url, image, color, artist, artistUrl } = req.body;

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
        res.json({ message: 'Profile updated successfully', profile });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

// Create a new profile
app.post('/api/profiles/create', requestLimiter, authenticateToken, async (req, res) => {
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

app.post('/api/profiles/delete', requestLimiter, authenticateToken, async (req, res) => {
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

app.post('/api/upload', requestLimiter, authenticateToken, upload.single('image'), async (req: express.Request, res: express.Response) => {
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
// Add endpoint to get all uploaded images
app.get('/api/images', requestLimiter, authenticateToken, async (req: express.Request, res: express.Response) => {
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

// Add endpoint to delete an image
app.post('/api/images/delete', requestLimiter, authenticateToken, async (req: express.Request, res: express.Response) => {
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

app.post('/api/analytics/record-visit', async (req: express.Request, res: express.Response) => {
  try {
    const { visitorId, referrer, userAgent } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let isNewVisitor = false;
    
    // If no visitor ID provided, generate a new one
    if (!visitorId) {
      isNewVisitor = true;
      const newVisitor = await Visitor.create({
        visitorId: uuidv4(),
        firstVisit: new Date(),
        lastVisit: new Date(),
        referrer,
        userAgent
      });
      
      // Update daily stats for new visitor
      await DailyVisit.findOneAndUpdate(
        { date: today },
        { $inc: { visitors: 1, uniqueVisitors: 1 } },
        { upsert: true, new: true }
      );
      
      res.json({ visitorId: newVisitor.visitorId });
      return;
    }
    
    // Existing visitor
    const visitor = await Visitor.findOne({ visitorId });
    
    if (!visitor) {
      // Visitor ID provided but not found in DB (could be from old session)
      isNewVisitor = true;
      const newVisitor = await Visitor.create({
        visitorId,
        firstVisit: new Date(),
        lastVisit: new Date(),
        referrer,
        userAgent
      });
      
      // Update daily stats for new visitor
      await DailyVisit.findOneAndUpdate(
        { date: today },
        { $inc: { visitors: 1, uniqueVisitors: 1 } },
        { upsert: true, new: true }
      );
      
    res.json({ visitorId });
    return;
    }
    
    // Check if this is a new visit for today
    const lastVisitDate = new Date(visitor.lastVisit);
    const isNewDailyVisit = lastVisitDate.toDateString() !== new Date().toDateString();
    
    // Update visitor record
    visitor.lastVisit = new Date();
    visitor.visits += 1;
    if (referrer) visitor.referrer = referrer;
    if (userAgent) visitor.userAgent = userAgent;
    await visitor.save();
    
    // Update daily stats
    await DailyVisit.findOneAndUpdate(
      { date: today },
      { 
        $inc: { 
          visitors: 1, 
          uniqueVisitors: isNewDailyVisit ? 1 : 0 
        } 
      },
      { upsert: true, new: true }
    );
    
    res.json({ visitorId });
  } catch (error) {
    console.error('Error recording visit:', error);
    res.status(500).json({ message: 'Failed to record visit' });
  }
});

// Add endpoint to get analytics data
app.get('/api/analytics/data', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Check permissions
    const requiredPerms = [permissionMap.ANALYTICS_VIEW];
    const userPerms = await getTokenPerms(token);

    const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
    if (!hasPermission) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    // Get monthly data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Aggregate monthly data
    const monthlyData = await DailyVisit.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          visitors: { $sum: "$visitors" },
          uniqueVisitors: { $sum: "$uniqueVisitors" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Format the data for the frontend
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedData = monthlyData.map(item => ({
      date: months[item._id.month - 1],
      month: item._id.month - 1,
      year: item._id.year,
      visitors: item.visitors,
      uniqueVisitors: item.uniqueVisitors
    }));

    // Get total stats
    const totalVisitors = await Visitor.countDocuments();
    const totalVisits = await Visitor.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$visits" }
        }
      }
    ]);

    res.json({
      monthly: formattedData,
      totals: {
        uniqueVisitors: totalVisitors,
        totalVisits: totalVisits.length > 0 ? totalVisits[0].total : 0
      }
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});



// Add these imports at the top of your file
import { execSync } from 'child_process';

// Add this function to generate self-signed certificates if they don't exist
function generateSelfSignedCertificates() {
    const certDir = path.join(import.meta.dirname, '../certs');
    const keyPath = path.join(import.meta.dirname, 'key.pem');
    const certPath = path.join(import.meta.dirname, 'cert.pem');

    if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
    }

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        console.log('Generating self-signed certificates for development...');

        execSync(`openssl req -x509 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/CN=localhost"`);
        console.log('Self-signed certificates generated successfully.');
    }

    return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
}

// Replace your existing server startup code with this
if (process.env.NODE_ENV === 'production') {
    // Use HTTPS in production with real certificates
    const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH || '/path/to/key.pem'),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/path/to/cert.pem')
    };

    https.createServer(options, app).listen(PORT, () => {
        console.log(`HTTPS Server running on port ${PORT}`);
    });
} else {
    // Use HTTPS in development with self-signed certificates
    const options = generateSelfSignedCertificates();

    https.createServer(options, app).listen(PORT, () => {
        console.log(`HTTPS Server running on port ${PORT} (Development Mode with self-signed certificate)`);
        console.log(`Access your server at https://localhost:${PORT}`);
    });
}