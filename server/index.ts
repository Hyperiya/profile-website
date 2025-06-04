import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { uploadsDir } from './config/multer.config.ts';
import { requestLimiter } from './middleware/rateLimiter.middleware.ts';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

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
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Apply rate limiter to all routes
app.use(requestLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);

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