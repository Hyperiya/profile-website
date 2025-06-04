import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Visitor, DailyVisit } from '../config/db.config.ts';
import { permissionMap } from '../config/permissions.ts';
import { authenticateToken, getTokenPerms } from '../middleware/auth.middleware.ts';

const router = express.Router();

router.post('/record-visit', async (req: express.Request, res: express.Response) => {
    try {
        const { visitorId, referrer, userAgent } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let isNewVisitor = false;
        
        // If no visitor ID provided, generate a new one
        if (!visitorId) {
            isNewVisitor = true;
            const newVisitor = await Visitor.create({
                visitorId: uuidv4(),
                firstVisit: new Date(),
                lastVisit: new Date(),
                referrer,
                userAgent
            });
            
            // Update daily stats for new visitor
            await DailyVisit.findOneAndUpdate(
                { date: today },
                { $inc: { visitors: 1, uniqueVisitors: 1 } },
                { upsert: true, new: true }
            );
            
            res.json({ visitorId: newVisitor.visitorId });
            return;
        }
        
        // Existing visitor
        const visitor = await Visitor.findOne({ visitorId });
        
        if (!visitor) {
            // Visitor ID provided but not found in DB (could be from old session)
            isNewVisitor = true;
            const newVisitor = await Visitor.create({
                visitorId,
                firstVisit: new Date(),
                lastVisit: new Date(),
                referrer,
                userAgent
            });
            
            // Update daily stats for new visitor
            await DailyVisit.findOneAndUpdate(
                { date: today },
                { $inc: { visitors: 1, uniqueVisitors: 1 } },
                { upsert: true, new: true }
            );
            
            res.json({ visitorId });
            return;
        }
        
        // Check if this is a new visit for today
        const lastVisitDate = new Date(visitor.lastVisit);
        const isNewDailyVisit = lastVisitDate.toDateString() !== new Date().toDateString();
        
        // Update visitor record
        visitor.lastVisit = new Date();
        visitor.visits += 1;
        if (referrer) visitor.referrer = referrer;
        if (userAgent) visitor.userAgent = userAgent;
        await visitor.save();
        
        // Update daily stats
        await DailyVisit.findOneAndUpdate(
            { date: today },
            { 
                $inc: { 
                    visitors: 1, 
                    uniqueVisitors: isNewDailyVisit ? 1 : 0 
                } 
            },
            { upsert: true, new: true }
        );
        
        res.json({ visitorId });
    } catch (error) {
        console.error('Error recording visit:', error);
        res.status(500).json({ message: 'Failed to record visit' });
    }
});

router.get('/data', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check permissions
        const requiredPerms = [permissionMap.ANALYTICS_VIEW];
        const userPerms = await getTokenPerms(token);

        const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
        if (!hasPermission) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }

        // Get analytics data
        const totalVisitors = await Visitor.countDocuments();
        const totalVisits = await Visitor.aggregate([
            { $group: { _id: null, total: { $sum: "$visits" } } }
        ]);
        const dailyStats = await DailyVisit.find().sort({ date: -1 }).limit(30);

        res.json({
            totalVisitors,
            totalVisits: totalVisits[0]?.total || 0,
            dailyStats
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Failed to fetch analytics data' });
    }
});

export default router;