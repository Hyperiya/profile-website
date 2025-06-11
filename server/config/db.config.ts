import mongoose from 'mongoose';
import validator from 'validator';
import userSchema from '../models/user.model.ts';
import tokenSchema from '../models/token.model.ts';
import ProfileSchema from '../models/profile.model.ts';
import path from 'path';
import { VisitorSchema, DailyVisitSchema } from '../models/visitor.model.ts';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local' )});

console.log(`Using environment file: ${path.resolve(process.cwd(), '.env.local' )}`);

// Load environment variables
const USER_DB_URI = process.env.USER_DB_URI || '';
const SESSION_DB_URI = process.env.SESSION_DB_URI || '';
const PROFILE_DB_URI = process.env.PROFILE_DB_URI || '';

if (!USER_DB_URI) throw new Error('Missing environment variable: USER_DB_URI');
if (!SESSION_DB_URI) throw new Error('Missing environment variable: SESSION_DB_URI');
if (!PROFILE_DB_URI) throw new Error('Missing environment variable: PROFILE_DB_URI');

// Create connections
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

// Create models
export const User = userConnection.model('User', userSchema);
export const Token = sessionConnection.model('Token', tokenSchema);
export const Profile = profileConnection.model('Profile', ProfileSchema);
export const Visitor = userConnection.model('Visitor', VisitorSchema);
export const DailyVisit = userConnection.model('DailyVisit', DailyVisitSchema);