import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    image: { type: String, required: true },
    color: { type: String, default: '#4a6cf7' },
});

export default ProfileSchema;