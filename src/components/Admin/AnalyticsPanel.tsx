// src/components/Admin/AnalyticsPanel.tsx
import { useState, useEffect } from 'react';
import './AnalyticsPanel.scss';
import { api } from '../../utils/api';

// Function to get the last 6 months
// Function to get the last 6 months
const getLast6Months = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result = [];
  const currentDate = new Date();

  for (let i = 5; i >= 0; i--) {
    const monthIndex = currentDate.getMonth() - i;
    const adjustedMonthIndex = monthIndex < 0 ? monthIndex + 12 : monthIndex;
    const year = currentDate.getFullYear() - (monthIndex < 0 ? 1 : 0);

    // Generate random visitor counts
    const visitors = Math.floor(Math.random() * 200) + 50;
    const uniqueVisitors = Math.floor(visitors * 0.7); // Assume ~70% are unique visitors

    result.push({
      date: months[adjustedMonthIndex],
      month: adjustedMonthIndex,
      year: year,
      visitors: visitors,
      uniqueVisitors: uniqueVisitors // Add this property
    });
  }

  return result;
};


interface AnalyticsData {
  date: string;
  month: number;
  year: number;
  visitors: number;
  uniqueVisitors: number;
}

interface AnalyticsTotals {
  uniqueVisitors: number;
  totalVisits: number;
}

const AnalyticsPanel = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [totals, setTotals] = useState<AnalyticsTotals>({ uniqueVisitors: 0, totalVisits: 0 });
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<{ x: number; y: number; data: AnalyticsData }[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = document.cookie;

        if (!token) {
          setLoading(false);
          return;
        }

        const response = await api.fetch(`/api/analytics/data`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();
        setAnalyticsData(data.monthly);
        setTotals(data.totals);
      
      } catch (err) {
        // Use mock data if real data fails
        const mockData = getLast6Months();
        setAnalyticsData(getLast6Months());
        const mockTotals = {
          uniqueVisitors: mockData.reduce((sum, item) => sum + item.uniqueVisitors, 0),
          totalVisits: mockData.reduce((sum, item) => sum + item.visitors, 0)
        };
        setTotals(mockTotals);

      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();    
  }, []);


  useEffect(() => {
    if (analyticsData.length > 0) {
      const maxVisitors = Math.max(...analyticsData.map(item => item.visitors));

      // Calculate points based on the data
      setPoints(analyticsData.map((item, index) => {
        // Use fixed positions that match the x-axis labels
        const x = index * ((analyticsData.length - 1));
        const y = 100 - ((item.visitors / maxVisitors) * 100);
        return { x, y, data: item };
      }));
    }
  }, [analyticsData]);



  // Generate SVG path
  const generatePath = () => {
    return points.map((point, i) =>
      `${i === 0 ? 'M' : 'L'} ${point.x}% ${point.y}%`
    ).join(' ');
  };

  // Generate area path (for gradient fill)
  const generateAreaPath = () => {
    return `${generatePath()} L 100% 100% L 0% 100% Z`;
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics data...</div>;
  }

  return (
    <div className="analytics-floating-panel" id='panel'>
      <h2>Site Analytics</h2>

      <div className="analytics-summary">
        <div className="summary-card">
          <div className="summary-value">{totals.uniqueVisitors}</div>
          <div className="summary-label">Unique Visitors</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{totals.totalVisits}</div>
          <div className="summary-label">Total Visits</div>
        </div>
      </div>

      <div className="analytics-container">
        <h3>Monthly Visitors (Last 6 Months)</h3>
        <div className="line-graph">
          <div className="graph-grid">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid-line"></div>
            ))}
          </div>

          <div className="line-path">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4a6cf7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#4a6cf7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={generatePath()} />
              <path className="area-path" d={generateAreaPath()} />
            </svg>
          </div>

          <div className="data-points">
            {points.map((point, i) => (
              <div
                key={i}
                className="point"
                style={{
                  bottom: `${100 - point.y}%`,
                  left: `${point.x}%`,
                  transform: 'translate(-50%, 50%)'
                }}
              >
                <div 
                  className="tooltip"
                  style={{
                    left: point.x > 80 ? 'auto' : '50%',
                    right: point.x > 80 ? '50%' : 'auto',
                    transform: point.x > 80 
                      ? 'translateX(50%) translateY(0)' 
                      : 'translateX(-50%) translateY(0)'
                  }}
                >
                  {point.data.date} {point.data.year}: {point.data.visitors} visitors
                </div>
              </div>
            ))}
          </div>

          <div className="x-axis">
            {analyticsData.map((item, i) => (
              <div
                key={i}
                className="label"
                style={{
                  position: 'absolute',
                  left: `${i * (100 / (analyticsData.length - 1))}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {item.date}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;