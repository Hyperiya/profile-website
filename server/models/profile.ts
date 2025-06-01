// server/models/Profile.ts
import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    image: { type: String, required: true },
    color: { type: String, default: '#4a6cf7' },
    artist: { type: String },
    artistUrl: { type: String }
});

export const Profile = mongoose.model('Profile', ProfileSchema);
