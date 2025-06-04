import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
    username: { type: String, required: true },
    token: { type: String, required: true },
    permissions: { type: [String], required: true },
    createdAt: { type: Number, default: Date.now() },
    expiresAt: { type: Number, required: true },
    role: { type: String, required: true }
});

export default tokenSchema;