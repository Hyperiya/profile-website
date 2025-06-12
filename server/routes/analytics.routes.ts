import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Visitor, DailyVisit } from '../config/db.config.ts';
import { permissionMap } from '../config/permissions.ts';
import { authenticateToken, getToken, getTokenPerms } from '../middleware/auth.middleware.ts';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd() + '\\.env.local' )});

const router = express.Router();

const RESTRICTED_STATES = process.env.RESTRICTED_STATES || '';
const RESTRICTED_TOWNS = process.env.RESTRICTED_TOWNS || '';
const ALLOWED_USERS = process.env.ALLOWED_USERS || '';

// Update the checkIfRestricted function to use environment variables
async function checkIfRestricted(ip: string): Promise<boolean> {
  try {
    // Use a free IP geolocation API
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName`);
    const data = await response.json();
    
    if (data.status !== 'success') return false;
    
    // Parse restricted states and towns from environment variables
    const restrictedStates = RESTRICTED_STATES.split(',').map(s => s.trim().toLowerCase());
    const restrictedTowns = RESTRICTED_TOWNS.split(',').map(t => t.trim().toLowerCase());
    
    // Check if location matches any restricted state and town combination
    return restrictedStates.includes(data.regionName.toLowerCase()) && 
           restrictedTowns.includes(data.city.toLowerCase());
  } catch (error) {
    console.error('IP geolocation error:', error);
    return false;
  }
}

// Update the visitor-metrics route
router.post('/visitor-metrics', async (req, res) => {
  try {
    const forwardedIps = req.headers['x-forwarded-for'] as string || '';
    const ip = forwardedIps.split(',')[0].trim();

    const userAgent = req.body.system || '';

    console.log('Visitor metrics request from IP:', ip, 'User-Agent:', userAgent);
    
    // Parse allowed users from environment variable
    const allowedUsers = ALLOWED_USERS.split(',').map(u => u.trim().toUpperCase());
    
    // Check if device is in allowed list
    const isAllowedDevice = allowedUsers.some(user => 
      userAgent.toUpperCase().includes(user)
    );
    
    // Check if IP is from restricted location
    let isRestricted = false;
    if (typeof ip === 'string' && !isAllowedDevice) {
      isRestricted = await checkIfRestricted(ip);
    }
    
    // Return generic-looking analytics data
    res.json({
      session_id: uuidv4(),
      display_config: isRestricted ? 'special_ne1' : 'default',
      metrics_recorded: true,
      page_load: Math.floor(Math.random() * 500) + 300,
      viewport: req.body.screen || '1920x1080'
    });
  } catch (err) {
    res.json({ 
      metrics_recorded: false,
      error_code: 'analytics_error'
    });
  }
});


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

        // Sanitize visitorId before sending in response
        const safeVisitorId = typeof visitorId === 'string' ? visitorId.replace(/[^a-zA-Z0-9\-]/g, '') : '';
        res.json({ visitorId: safeVisitorId });
    } catch (error) {
        
        console.error('Error recording visit:', error);
        res.status(500).json({ message: 'Failed to record visit' });
    }
});

router.get('/data', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = getToken(authHeader);

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

    // Get monthly data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Aggregate monthly data
    const monthlyData = await DailyVisit.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          visitors: { $sum: "$visitors" },
          uniqueVisitors: { $sum: "$uniqueVisitors" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Format the data for the frontend
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedData = monthlyData.map(item => ({
      date: months[item._id.month - 1],
      month: item._id.month - 1,
      year: item._id.year,
      visitors: item.visitors,
      uniqueVisitors: item.uniqueVisitors
    }));

    // Get total stats
    const totalVisitors = await Visitor.countDocuments();
    const totalVisits = await Visitor.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$visits" }
        }
      }
    ]);

    res.json({
      monthly: formattedData,
      totals: {
        uniqueVisitors: totalVisitors,
        totalVisits: totalVisits.length > 0 ? totalVisits[0].total : 0
      }
    });
  } catch (error) {
    
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});


export default router;