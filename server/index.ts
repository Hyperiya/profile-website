import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { uploadsDir } from './config/multer.config.ts';
import { requestLimiter } from './middleware/rateLimiter.middleware.ts';
import { setCsrfToken, validateCsrfToken } from './middleware/csrf.middleware.ts';
import session from 'express-session';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from './routes/auth.routes.ts';
import userRoutes from './routes/user.routes.ts';
import profileRoutes from './routes/profile.routes.ts'
import uploadRoutes from './routes/upload.routes.ts';
import analyticsRoutes from './routes/analytics.routes.ts';

// Load environment variables

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['https://hyperiya.com', 'https://www.hyperiya.com', 'http://localhost:5173', 'https://profile.hyperiya.com'],
    credentials: true
}));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Apply rate limiter to all routes
app.use(requestLimiter);

// Apply CSRF protection
app.use(setCsrfToken);
app.use(validateCsrfToken);

// Upload routes should be before json body parser to handle multipart form data correctly
app.use('/api/upload', uploadRoutes);

// Add body parsers after upload routes to prevent them from interfering with file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// Other API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/analytics', analyticsRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
