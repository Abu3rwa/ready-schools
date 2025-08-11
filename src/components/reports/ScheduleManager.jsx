import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { useAuth } from "../../contexts/AuthContext";
import DeliveryMonitor from "./DeliveryMonitor";
import ScheduleRules from "./ScheduleRules";

const SCHEDULE_TYPES = [
  { value: "daily", label: "Daily (After School)" },
  { value: "weekly", label: "Weekly (Sunday/Thursday)" },
  { value: "monthly", label: "Monthly (End of Month)" },
];

const DEFAULT_TIME = "16:00"; // 4:00 PM

export default function ScheduleManager() {
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    type: "daily",
    time: DEFAULT_TIME,
    recipients: {
      students: true,
      parents: true,
      teachers: false,
    },
    reportConfig: {
      includeAttendance: true,
      includeBehavior: true,
      includeGrades: true,
      includeCharts: true,
    },
    rules: [],
  });

  const handleSaveSchedule = () => {
    const schedule = {
      ...newSchedule,
      id: Date.now().toString(),
      status: "active",
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
      lastRun: null,
      nextRun: calculateNextRun(newSchedule.type, newSchedule.time),
    };

    setSchedules([...schedules, schedule]);
    // Reset form
    setNewSchedule({
      type: "daily",
      time: DEFAULT_TIME,
      recipients: {
        students: true,
        parents: true,
        teachers: false,
      },
      reportConfig: {
        includeAttendance: true,
        includeBehavior: true,
        includeGrades: true,
        includeCharts: true,
      },
    });
  };

  const calculateNextRun = (type, time) => {
    const now = dayjs();
    const [hours, minutes] = time.split(":");
    let next = now.hour(parseInt(hours)).minute(parseInt(minutes)).second(0);

    if (next.isBefore(now)) {
      switch (type) {
        case "daily":
          next = next.add(1, "day");
          break;
        case "weekly":
          next = next.add(1, "week").day(5); // Friday
          break;
        case "monthly":
          next = next.add(1, "month").date(1); // First of next month
          break;
      }
    }

    return next.toISOString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Report Schedule Manager
      </Typography>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Create New Schedule
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Schedule Type</InputLabel>
              <Select
                value={newSchedule.type}
                label="Schedule Type"
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, type: e.target.value })
                }
              >
                {SCHEDULE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Time (24h)"
              type="time"
              value={newSchedule.time}
              onChange={(e) =>
                setNewSchedule({ ...newSchedule, time: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Recipients
            </Typography>
            <Grid container spacing={2}>
              {Object.keys(newSchedule.recipients).map((recipient) => (
                <Grid item key={recipient}>
                  <FormControl>
                    <InputLabel>
                      {recipient.charAt(0).toUpperCase() + recipient.slice(1)}
                    </InputLabel>
                    <Select
                      value={newSchedule.recipients[recipient]}
                      label={
                        recipient.charAt(0).toUpperCase() + recipient.slice(1)
                      }
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          recipients: {
                            ...newSchedule.recipients,
                            [recipient]: e.target.value,
                          },
                        })
                      }
                    >
                      <MenuItem value={true}>Yes</MenuItem>
                      <MenuItem value={false}>No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Report Contents
            </Typography>
            <Grid container spacing={2}>
              {Object.keys(newSchedule.reportConfig).map((config) => (
                <Grid item key={config}>
                  <FormControl>
                    <InputLabel>
                      {config.replace(/([A-Z])/g, " $1").trim()}
                    </InputLabel>
                    <Select
                      value={newSchedule.reportConfig[config]}
                      label={config.replace(/([A-Z])/g, " $1").trim()}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          reportConfig: {
                            ...newSchedule.reportConfig,
                            [config]: e.target.value,
                          },
                        })
                      }
                    >
                      <MenuItem value={true}>Yes</MenuItem>
                      <MenuItem value={false}>No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSchedule}
            >
              Create Schedule
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Typography variant="h6" gutterBottom>
        Active Schedules
      </Typography>
      {schedules.map((schedule) => (
        <Card key={schedule.id} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle1">
                {SCHEDULE_TYPES.find((t) => t.value === schedule.type)?.label}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {schedule.time}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2">
                Next run: {dayjs(schedule.nextRun).format("MMM D, YYYY HH:mm")}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  const updatedSchedules = schedules.map((s) =>
                    s.id === schedule.id
                      ? {
                          ...s,
                          status: s.status === "active" ? "paused" : "active",
                        }
                      : s
                  );
                  setSchedules(updatedSchedules);
                }}
              >
                {schedule.status === "active" ? "Pause" : "Resume"}
              </Button>
              <Button
                variant="outlined"
                color="error"
                sx={{ ml: 1 }}
                onClick={() => {
                  setSchedules(schedules.filter((s) => s.id !== schedule.id));
                }}
              >
                Delete
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Delivery Monitor for this schedule */}
          <DeliveryMonitor scheduleId={schedule.id} />
        </Card>
      ))}
    </Box>
  );
}
