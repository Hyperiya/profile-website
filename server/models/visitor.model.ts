import mongoose from 'mongoose';

const VisitorSchema = new mongoose.Schema({
    visitorId: { type: String, required: true, unique: true },
    firstVisit: { type: Date, required: true },
    lastVisit: { type: Date, required: true },
    visits: { type: Number, default: 1 },
    // Optional: track additional data
    referrer: { type: String },
    userAgent: { type: String }
});

const DailyVisitSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    visitors: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 }
});

export { VisitorSchema, DailyVisitSchema };