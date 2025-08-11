import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Alert,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { useEmail } from "../../contexts/EmailContext";

const EmailStatus = () => {
  const { sending, progress, error, successMessage } = useEmail();

  if (!sending && !progress && !error && !successMessage) {
    return null;
  }

  const getStatusIcon = () => {
    if (error) return <ErrorIcon color="error" />;
    if (successMessage) return <CheckCircleIcon color="success" />;
    if (sending) return <SendIcon color="primary" />;
    return <ScheduleIcon color="action" />;
  };

  const getStatusColor = () => {
    if (error) return "error";
    if (successMessage) return "success";
    if (sending) return "primary";
    return "default";
  };

  const getStatusText = () => {
    if (error) return "Error";
    if (successMessage) return "Success";
    if (sending) return "Sending";
    if (progress) return "In Progress";
    return "Unknown";
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          {getStatusIcon()}
          <Typography variant="h6" color={getStatusColor()}>
            Email Status: {getStatusText()}
          </Typography>
          <Chip label={getStatusText()} color={getStatusColor()} size="small" />
        </Box>

        {progress && (
          <Box mb={2}>
            <Typography variant="body2" color="textSecondary" mb={1}>
              {progress.message}
            </Typography>
            {progress.status === "preparing" && <LinearProgress />}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailStatus;
