import sanitize from 'mongo-sanitize';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Token } from '../config/db.config.ts';
import { permissionMap } from '../config/permissions.ts';



const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET) throw new Error('Missing environment variable: JWT_SECRET');

// Add type declaration for Express Request
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const getToken = (tokenString?: string): string => {
    if (tokenString) {
        for (const part of tokenString.split(' ')) {
            if (part.startsWith('token=')) {
                return part.split('=')[1];
            }
            if (part.length === 196) {
                return part;
            }
        }
    }
    throw new Error('Token not given');
}

export const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    
    const authHeader = req.headers['authorization'];
    let token: string = '';
    console.log('Authenticating token:', authHeader);

    
    token = getToken(authHeader);

    if (!token) {
        token = authHeader?.split(' ')[1] ?? ''
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            console.error(err)
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        req.user = user;
        next();
    });
};

export async function getTokenPerms(token: string): Promise<permissionMap[]> {    
    console.log(token, 'Getting token permissions');
    
    const existingToken = await Token.findOne({ token: token });
    if (!existingToken) {
        throw new Error('Token Does Not Exist');
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
            
            
            console.warn(`Unknown permission: ${perm}`);
            return null;
        }
        return enumValue as permissionMap;
    }).filter(Boolean) as permissionMap[];
}

// Import the sanitize-mongo package to sanitize input for MongoDB queries
// This package helps prevent NoSQL injection attacks by escaping special characters


export async function storeToken(token: string, username: string, permissions: string[], createdAt: number, expiresAt: number, role: string) {
    const sanitizedUsername = sanitize(username);
    
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