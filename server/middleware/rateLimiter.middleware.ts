import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: 'Too many login attempts, please try again after 5 minutes' },
    skipSuccessfulRequests: false, // Count all requests
});

export const requestLimiter = rateLimit({ 
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: 'Too many requests, please try again later' },
    skipSuccessfulRequests: false, // Count all requests
});