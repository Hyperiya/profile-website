import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Number, default: Date.now() },
    permissions: { type: [String], required: true },
    role: { type: String, required: true }
});

export default userSchema;