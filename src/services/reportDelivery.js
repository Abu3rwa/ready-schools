import { useAuth } from "../contexts/AuthContext";

export const scheduleReport = async (type, config) => {
  // For MVP, we'll use localStorage to store schedules
  try {
    const schedules = JSON.parse(
      localStorage.getItem("reportSchedules") || "[]"
    );
    schedules.push({
      id: Date.now().toString(),
      type,
      ...config,
      status: "active",
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("reportSchedules", JSON.stringify(schedules));
    return true;
  } catch (error) {
    console.error("Error scheduling report:", error);
    return false;
  }
};

export const cancelSchedule = async (scheduleId) => {
  try {
    const schedules = JSON.parse(
      localStorage.getItem("reportSchedules") || "[]"
    );
    const updatedSchedules = schedules.filter(
      (schedule) => schedule.id !== scheduleId
    );
    localStorage.setItem("reportSchedules", JSON.stringify(updatedSchedules));
    return true;
  } catch (error) {
    console.error("Error canceling schedule:", error);
    return false;
  }
};

export const pauseSchedule = async (scheduleId) => {
  try {
    const schedules = JSON.parse(
      localStorage.getItem("reportSchedules") || "[]"
    );
    const updatedSchedules = schedules.map((schedule) =>
      schedule.id === scheduleId
        ? {
            ...schedule,
            status: schedule.status === "active" ? "paused" : "active",
          }
        : schedule
    );
    localStorage.setItem("reportSchedules", JSON.stringify(updatedSchedules));
    return true;
  } catch (error) {
    console.error("Error toggling schedule:", error);
    return false;
  }
};

export const getSchedules = () => {
  try {
    return JSON.parse(localStorage.getItem("reportSchedules") || "[]");
  } catch (error) {
    console.error("Error getting schedules:", error);
    return [];
  }
};
