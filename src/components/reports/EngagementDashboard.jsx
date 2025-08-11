import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  getReportEngagement,
  EVENT_TYPES,
} from "../../services/engagementTracking";
import dayjs from "dayjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function EngagementDashboard({ reportId }) {
  const [timeframe, setTimeframe] = useState("week");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const startDate = dayjs()
        .subtract(
          timeframe === "day" ? 7 : timeframe === "week" ? 4 : 12, // months
          timeframe === "day" ? "day" : timeframe === "week" ? "week" : "month"
        )
        .toISOString();

      const engagementData = await getReportEngagement(
        reportId,
        startDate,
        dayjs().toISOString()
      );
      setData(engagementData);
      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [reportId, timeframe]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Engagement Trends",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const chartData = {
    labels: data?.trends[
      timeframe === "day"
        ? "daily"
        : timeframe === "week"
        ? "weekly"
        : "monthly"
    ].map((item) => item.date),
    datasets: [
      {
        label: "Total Events",
        data: data?.trends[
          timeframe === "day"
            ? "daily"
            : timeframe === "week"
            ? "weekly"
            : "monthly"
        ].map((item) => item.count),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
    ],
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">Engagement Analytics</Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={timeframe}
            label="Timeframe"
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <MenuItem value="day">Daily</MenuItem>
            <MenuItem value="week">Weekly</MenuItem>
            <MenuItem value="month">Monthly</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="primary">
              {data?.metrics.uniqueUsers || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Unique Users
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="success.main">
              {data?.metrics.responseRate || 0}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Response Rate
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="info.main">
              {Math.round(data?.metrics.avgTimeSpent / 60 || 0)}m
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Avg. Time Spent
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="warning.main">
              {data?.metrics.downloadRate || 0}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Download Rate
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Trend Chart */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Line options={chartOptions} data={chartData} />
      </Card>

      {/* Event Breakdown */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Event Type</TableCell>
                <TableCell align="right">Count</TableCell>
                <TableCell align="right">% of Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(data?.metrics.eventTypes || {}).map(
                ([type, count]) => (
                  <TableRow key={type}>
                    <TableCell>
                      {type
                        .split("_")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </TableCell>
                    <TableCell align="right">{count}</TableCell>
                    <TableCell align="right">
                      {Math.round(
                        (count / (data?.metrics.totalEvents || 1)) * 100
                      )}
                      %
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Recent Events */}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.events || [])
                .slice(-5)
                .reverse()
                .map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      {dayjs(event.timestamp).format("MMM D, HH:mm")}
                    </TableCell>
                    <TableCell>
                      {event.type
                        .split("_")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </TableCell>
                    <TableCell>{event.metadata.userId}</TableCell>
                    <TableCell>{event.metadata.action || "-"}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
