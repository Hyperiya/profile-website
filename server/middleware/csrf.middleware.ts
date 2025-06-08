import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare module 'express-session' {
    interface SessionData {
        csrfToken?: string;
    }
}

// Generate a random CSRF token
export const generateToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

// Middleware to set CSRF token
export const setCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session) {
        res.status(500).json({ error: 'Session middleware required' });
        return;
    }

    // Generate a new token if one doesn't exist
    
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateToken();
    }

    // Set the CSRF token in a cookie with appropriate security settings
    res.cookie('XSRF-TOKEN', req.session.csrfToken, {
        httpOnly: false, // Client-side JavaScript needs to read this
        secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
        sameSite: 'lax',
        path: '/'
    });

    next();
};

// Middleware to validate CSRF token
export const validateCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session) {
        res.status(500).json({ error: 'Session middleware required' });
        return;
    }

    // Skip CSRF check for GET, HEAD, OPTIONS requests as they should be idempotent
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        next();
        return;
    }

    const token = req.headers['x-xsrf-token'] || req.body._csrf;
    const sessionToken = req.session.csrfToken;

    
    if (!token || !sessionToken || token !== sessionToken) {
        res.status(403).json({ error: 'Invalid CSRF token' });
        return;
    }

    next();
};