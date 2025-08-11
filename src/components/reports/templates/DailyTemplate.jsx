import React from "react";
import { Box, Card, Grid, Typography, LinearProgress } from "@mui/material";
import dayjs from "dayjs";

export default function DailyTemplate({ data, date }) {
  const { attendance, behavior, grades, homework } = data;

  const getStatusColor = (value) => {
    if (value >= 80) return "success";
    if (value >= 60) return "warning";
    return "error";
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Daily Progress Report - {dayjs(date).format("MMMM D, YYYY")}
      </Typography>

      <Grid container spacing={3}>
        {/* Attendance */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Attendance
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography variant="body2" sx={{ minWidth: 100 }}>
                Status:
              </Typography>
              <Typography
                variant="body1"
                color={
                  attendance.status === "present"
                    ? "success.main"
                    : "error.main"
                }
              >
                {attendance.status.charAt(0).toUpperCase() +
                  attendance.status.slice(1)}
              </Typography>
            </Box>
            {attendance.status === "late" && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" sx={{ minWidth: 100 }}>
                  Minutes Late:
                </Typography>
                <Typography variant="body1">
                  {attendance.minutesLate}
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Behavior */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Behavior
            </Typography>
            {behavior.incidents.length === 0 ? (
              <Typography variant="body1" color="success.main">
                No incidents reported
              </Typography>
            ) : (
              behavior.incidents.map((incident, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="body2" color="error.main">
                    {incident.type}: {incident.description}
                  </Typography>
                </Box>
              ))
            )}
          </Card>
        </Grid>

        {/* New Grades */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              New Assessments
            </Typography>
            {grades.new.length === 0 ? (
              <Typography variant="body1">No new grades today</Typography>
            ) : (
              <Grid container spacing={2}>
                {grades.new.map((grade, index) => (
                  <Grid item xs={12} key={index}>
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body1">
                          {grade.subject} - {grade.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          color={getStatusColor(grade.percentage)}
                        >
                          {grade.score}/{grade.total} ({grade.percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={grade.percentage}
                        color={getStatusColor(grade.percentage)}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Card>
        </Grid>

        {/* Homework */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Homework Status
            </Typography>
            <Grid container spacing={2}>
              {homework.map((assignment, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body1">
                      {assignment.subject}
                    </Typography>
                    <Typography
                      variant="body1"
                      color={
                        assignment.completed ? "success.main" : "error.main"
                      }
                    >
                      {assignment.completed ? "Completed" : "Incomplete"}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
