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

export const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
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
        const enumValue = Object.values(permissionMap).find(val => val === perm);
        if (!enumValue) {
            console.warn(`Unknown permission: ${perm}`);
            return null;
        }
        return enumValue as permissionMap;
    }).filter(Boolean) as permissionMap[];
}

export async function storeToken(token: string, username: string, permissions: string[], createdAt: number, expiresAt: number, role: string) {
    const existingToken = await Token.findOne({ username });
    if (existingToken) {
        await existingToken.deleteOne();
    }

    return Token.create({
        username,
        token: token,
        permissions: permissions,
        createdAt: createdAt,
        expiresAt: expiresAt,
        role: role
    });
}