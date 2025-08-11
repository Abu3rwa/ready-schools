import dayjs from "dayjs";

// For MVP, we'll use localStorage to store delivery logs
const STORAGE_KEY = "reportDeliveryLogs";

export const logDelivery = async (scheduleId, status, stats, errors = []) => {
  try {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const newLog = {
      id: Date.now().toString(),
      scheduleId,
      runDate: new Date().toISOString(),
      status, // 'success' | 'partial' | 'failed'
      stats: {
        attempted: stats.attempted || 0,
        succeeded: stats.succeeded || 0,
        failed: stats.failed || 0,
      },
      errors: errors.map((error) => ({
        studentId: error.studentId,
        error: error.message || error.toString(),
      })),
    };
    logs.push(newLog);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    return newLog;
  } catch (error) {
    console.error("Error logging delivery:", error);
    return null;
  }
};

export const getDeliveryLogs = (
  scheduleId = null,
  startDate = null,
  endDate = null
) => {
  try {
    let logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (scheduleId) {
      logs = logs.filter((log) => log.scheduleId === scheduleId);
    }

    if (startDate && endDate) {
      logs = logs.filter((log) =>
        dayjs(log.runDate).isBetween(startDate, endDate, "day", "[]")
      );
    }

    return logs;
  } catch (error) {
    console.error("Error getting delivery logs:", error);
    return [];
  }
};

export const getDeliveryStats = (scheduleId = null, days = 30) => {
  try {
    const logs = getDeliveryLogs(
      scheduleId,
      dayjs().subtract(days, "day").toISOString(),
      dayjs().toISOString()
    );

    const stats = {
      total: logs.length,
      success: logs.filter((log) => log.status === "success").length,
      partial: logs.filter((log) => log.status === "partial").length,
      failed: logs.filter((log) => log.status === "failed").length,
      totalAttempted: logs.reduce((sum, log) => sum + log.stats.attempted, 0),
      totalSucceeded: logs.reduce((sum, log) => sum + log.stats.succeeded, 0),
      totalFailed: logs.reduce((sum, log) => sum + log.stats.failed, 0),
      commonErrors: {},
    };

    // Analyze common errors
    logs.forEach((log) => {
      log.errors.forEach((error) => {
        const errorKey = error.error.toLowerCase();
        stats.commonErrors[errorKey] = (stats.commonErrors[errorKey] || 0) + 1;
      });
    });

    // Calculate success rate
    stats.successRate = stats.totalAttempted
      ? Math.round((stats.totalSucceeded / stats.totalAttempted) * 100)
      : 0;

    return stats;
  } catch (error) {
    console.error("Error calculating delivery stats:", error);
    return null;
  }
};

export const clearOldLogs = (daysToKeep = 90) => {
  try {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const cutoffDate = dayjs().subtract(daysToKeep, "day");

    const filteredLogs = logs.filter((log) =>
      dayjs(log.runDate).isAfter(cutoffDate)
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredLogs));
    return true;
  } catch (error) {
    console.error("Error clearing old logs:", error);
    return false;
  }
};
