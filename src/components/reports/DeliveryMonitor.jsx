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
  Chip,
} from "@mui/material";
import {
  getDeliveryStats,
  getDeliveryLogs,
} from "../../services/reportDeliveryLogs";
import dayjs from "dayjs";

export default function DeliveryMonitor({ scheduleId }) {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const newStats = await getDeliveryStats(scheduleId, 30);
      const logs = await getDeliveryLogs(
        scheduleId,
        dayjs().subtract(7, "day").toISOString(),
        dayjs().toISOString()
      );
      setStats(newStats);
      setRecentLogs(logs);
      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [scheduleId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "success";
      case "partial":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Delivery Monitor
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="primary">
              {stats?.successRate}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Success Rate
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="success.main">
              {stats?.totalSucceeded || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Successful Deliveries
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="warning.main">
              {stats?.partial || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Partial Deliveries
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="error.main">
              {stats?.totalFailed || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Failed Deliveries
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Logs */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Attempted</TableCell>
                <TableCell>Succeeded</TableCell>
                <TableCell>Failed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {dayjs(log.runDate).format("MMM D, YYYY HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.status}
                      color={getStatusColor(log.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.stats.attempted}</TableCell>
                  <TableCell>{log.stats.succeeded}</TableCell>
                  <TableCell>{log.stats.failed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Common Errors */}
      {stats?.commonErrors && Object.keys(stats.commonErrors).length > 0 && (
        <Card sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Common Errors
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Error</TableCell>
                  <TableCell align="right">Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(stats.commonErrors)
                  .sort(([, a], [, b]) => b - a)
                  .map(([error, count]) => (
                    <TableRow key={error}>
                      <TableCell>{error}</TableCell>
                      <TableCell align="right">{count}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
