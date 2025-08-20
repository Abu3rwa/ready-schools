import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Grid,
  Divider,
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

const EnhancedStudentCard = ({
  student,
  onEdit,
  onDelete,
  onContact,
  onViewDetails,
  showAnalytics = true,
  compact = false,
}) => {
  // Calculate student status based on various metrics
  const getStudentStatus = () => {
    // This would be calculated from actual data
    const attendanceRate = student.attendanceRate || 95;
    const gpa = student.gpa || 3.2;
    const behaviorScore = student.behaviorScore || 85;

    if (attendanceRate < 90 || gpa < 2.0 || behaviorScore < 70) {
      return { status: "at-risk", color: "error", icon: <WarningIcon /> };
    } else if (attendanceRate >= 95 && gpa >= 3.5 && behaviorScore >= 90) {
      return {
        status: "excellent",
        color: "success",
        icon: <CheckCircleIcon />,
      };
    } else {
      return { status: "good", color: "info", icon: <PersonIcon /> };
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`;
  };

  const getAvatarColor = (id) => {
    const colors = [
      "#1976d2", // blue
      "#dc004e", // pink
      "#4caf50", // green
      "#ff9800", // orange
      "#9c27b0", // purple
      "#00bcd4", // cyan
      "#795548", // brown
      "#607d8b", // blue grey
    ];
    const index = parseInt(id?.replace(/\D/g, "") || "0") % colors.length;
    return colors[index];
  };

  const status = getStudentStatus();

  if (compact) {
    return (
      <Card
        sx={{
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: 4,
          },
        }}
        onClick={onViewDetails}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: getAvatarColor(student.id),
                width: 48,
                height: 48,
              }}
            >
              {getInitials(student.firstName, student.lastName)}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" noWrap>
                {student.firstName} {student.lastName}
              </Typography>
              <Typography variant="body2" color="textSecondary" noWrap>
                Grade {student.gradeLevel || "N/A"} • ID:{" "}
                {student.studentId || student.id}
              </Typography>
            </Box>
            <Chip
              icon={status.icon}
              label={status.status}
              color={status.color}
              size="small"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header with Avatar and Status */}
        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: getAvatarColor(student.id),
              width: 64,
              height: 64,
              mr: 2,
            }}
          >
            {getInitials(student.firstName, student.lastName)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" gutterBottom>
              {student.firstName} {student.lastName}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Grade {student.gradeLevel || "N/A"} • Student ID:{" "}
              {student.studentId || student.id}
            </Typography>
            <Chip
              icon={status.icon}
              label={status.status}
              color={status.color}
              size="small"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Contact Information */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Contact Information
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2" noWrap>
                  {student.parentEmail1 || "No parent email provided"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2" noWrap>
                  {student.studentEmail || student.email || "No student email provided"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2" noWrap>
                  {student.phone || "No phone provided"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Academic Summary */}
        {showAnalytics && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Academic Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" color="primary">
                    {student.gpa || "N/A"}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    GPA
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" color="success.main">
                    {student.attendanceRate || "N/A"}%
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Attendance
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Progress Indicators */}
        {showAnalytics && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Performance Trends
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="caption">Academic</Typography>
              <LinearProgress
                variant="determinate"
                value={student.academicProgress || 75}
                sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption">
                {student.academicProgress || 75}%
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="caption">Behavior</Typography>
              <LinearProgress
                variant="determinate"
                value={student.behaviorScore || 85}
                sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                color={student.behaviorScore < 70 ? "error" : "success"}
              />
              <Typography variant="caption">
                {student.behaviorScore || 85}%
              </Typography>
            </Box>
          </Box>
        )}

        {/* Special Indicators */}
        {(student.specialNeeds || student.medicalNotes) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Special Considerations
            </Typography>
            {student.specialNeeds && (
              <Chip
                label="Special Needs"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ mr: 1, mb: 1 }}
              />
            )}
            {student.medicalNotes && (
              <Chip
                label="Medical Notes"
                size="small"
                color="error"
                variant="outlined"
                sx={{ mr: 1, mb: 1 }}
              />
            )}
          </Box>
        )}
      </CardContent>

      {/* Action Buttons */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
          <Tooltip title="Contact Parent">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onContact(student);
              }}
            >
              <EmailIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(student);
              }}
            >
              <SchoolIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Edit Student">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(student);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Student">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(student);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default EnhancedStudentCard;
