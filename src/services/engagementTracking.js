import dayjs from 'dayjs';

const STORAGE_KEY = 'reportEngagementEvents';

// Event types
export const EVENT_TYPES = {
  EMAIL_OPEN: 'email_open',
  EMAIL_CLICK: 'email_click',
  REPORT_VIEW: 'report_view',
  REPORT_DOWNLOAD: 'report_download',
  REPORT_PRINT: 'report_print',
  REPORT_SHARE: 'report_share',
  PARENT_RESPONSE: 'parent_response',
  MEETING_REQUEST: 'meeting_request'
};

// Track a new engagement event
export const trackEvent = async (type, metadata = {}) => {
  try {
    const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const event = {
      id: Date.now().toString(),
      type,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        userAgent: window.navigator.userAgent,
        platform: window.navigator.platform,
        screenSize: `${window.screen.width}x${window.screen.height}`
      }
    };
    events.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return event;
  } catch (error) {
    console.error('Error tracking event:', error);
    return null;
  }
};

// Get engagement stats for a specific report
export const getReportEngagement = (reportId, startDate = null, endDate = null) => {
  try {
    const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      .filter(event => 
        (!reportId || event.metadata.reportId === reportId) &&
        (!startDate || dayjs(event.timestamp).isAfter(startDate)) &&
        (!endDate || dayjs(event.timestamp).isBefore(endDate))
      );

    // Calculate basic metrics
    const metrics = {
      totalEvents: events.length,
      uniqueUsers: new Set(events.map(e => e.metadata.userId)).size,
      eventTypes: Object.values(EVENT_TYPES).reduce((acc, type) => {
        acc[type] = events.filter(e => e.type === type).length;
        return acc;
      }, {}),
      avgTimeSpent: calculateAverageTimeSpent(events),
      responseRate: calculateResponseRate(events),
      downloadRate: calculateDownloadRate(events)
    };

    // Calculate trends
    const trends = {
      daily: calculateTrend(events, 'day'),
      weekly: calculateTrend(events, 'week'),
      monthly: calculateTrend(events, 'month')
    };

    return { metrics, trends, events };
  } catch (error) {
    console.error('Error getting engagement stats:', error);
    return null;
  }
};

// Helper functions for calculations
const calculateAverageTimeSpent = (events) => {
  const viewEvents = events.filter(e => e.type === EVENT_TYPES.REPORT_VIEW);
  if (viewEvents.length === 0) return 0;
  
  const totalTime = viewEvents.reduce((sum, event) => 
    sum + (event.metadata.duration || 0), 0);
  return Math.round(totalTime / viewEvents.length);
};

const calculateResponseRate = (events) => {
  const totalReports = new Set(events.map(e => e.metadata.reportId)).size;
  if (totalReports === 0) return 0;
  
  const responses = events.filter(e => 
    e.type === EVENT_TYPES.PARENT_RESPONSE || 
    e.type === EVENT_TYPES.MEETING_REQUEST
  ).length;
  
  return Math.round((responses / totalReports) * 100);
};

const calculateDownloadRate = (events) => {
  const views = events.filter(e => e.type === EVENT_TYPES.REPORT_VIEW).length;
  if (views === 0) return 0;
  
  const downloads = events.filter(e => 
    e.type === EVENT_TYPES.REPORT_DOWNLOAD || 
    e.type === EVENT_TYPES.REPORT_PRINT
  ).length;
  
  return Math.round((downloads / views) * 100);
};

const calculateTrend = (events, unit) => {
  const trend = {};
  
  events.forEach(event => {
    const key = dayjs(event.timestamp).format(
      unit === 'day' ? 'YYYY-MM-DD' :
      unit === 'week' ? 'YYYY-[W]WW' :
      'YYYY-MM'
    );
    trend[key] = (trend[key] || 0) + 1;
  });
  
  return Object.entries(trend)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

// Clear old engagement data
export const clearOldEvents = (daysToKeep = 90) => {
  try {
    const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const cutoffDate = dayjs().subtract(daysToKeep, 'day');
    
    const filteredEvents = events.filter(event => 
      dayjs(event.timestamp).isAfter(cutoffDate)
    );
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEvents));
    return true;
  } catch (error) {
    console.error('Error clearing old events:', error);
    return false;
  }
};
