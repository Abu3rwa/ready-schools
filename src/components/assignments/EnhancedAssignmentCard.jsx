import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Collapse,
  Grid,
  LinearProgress,
  Tooltip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";

const EnhancedAssignmentCard = ({
  assignment,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return "default";
      case "active":
        return "primary";
      case "completed":
        return "success";
      case "archived":
        return "secondary";
      default:
        return "default";
    }
  };

  const getDueDateStatus = () => {
    const dueDate = dayjs(assignment.dueDate);
    const now = dayjs();
    const daysUntilDue = dueDate.diff(now, "day");

    if (dueDate.isBefore(now)) {
      return { status: "overdue", color: "error", icon: <WarningIcon /> };
    } else if (daysUntilDue <= 1) {
      return { status: "due_soon", color: "warning", icon: <WarningIcon /> };
    } else if (daysUntilDue <= 3) {
      return { status: "upcoming", color: "info", icon: <InfoIcon /> };
    } else {
      return { status: "future", color: "success", icon: <CheckCircleIcon /> };
    }
  };

  const dueDateStatus = getDueDateStatus();

  const formatTimeEstimate = (minutes) => {
    if (!minutes) return "Not specified";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const renderGradingCriteria = () => {
    if (!assignment.gradingCriteria) return null;

    return (
      <Box mt={2}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Grading Criteria:
        </Typography>
        <Grid container spacing={1}>
          {Object.entries(assignment.gradingCriteria).map(
            ([criterion, weight]) => (
              <Grid item xs={6} key={criterion}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography
                    variant="body2"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {criterion.replace("_", " ")}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {weight}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={weight}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Grid>
            )
          )}
        </Grid>
      </Box>
    );
  };

  const renderLatePolicy = () => {
    if (!assignment.latePolicy) return null;

    const { allowed, penalty, gracePeriod } = assignment.latePolicy;

    return (
      <Box mt={2}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Late Policy:
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          {allowed ? (
            <>
              <InfoIcon fontSize="small" color="warning" />
              <Typography variant="body2">
                Late submissions allowed with {penalty}% penalty
                {gracePeriod > 0 && ` (${gracePeriod}h grace period)`}
              </Typography>
            </>
          ) : (
            <>
              <WarningIcon fontSize="small" color="error" />
              <Typography variant="body2">
                No late submissions accepted
              </Typography>
            </>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
        border:
          dueDateStatus.status === "overdue" ? "2px solid #f44336" : "none",
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box flex={1}>
            <Typography variant="h6" component="h3" gutterBottom noWrap>
              {assignment.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <SchoolIcon fontSize="small" color="action" />
              <Typography variant="body2" color="textSecondary">
                {assignment.subject}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            {assignment.difficultyLevel && (
              <Chip
                label={assignment.difficultyLevel}
                color={getDifficultyColor(assignment.difficultyLevel)}
                size="small"
                variant="outlined"
              />
            )}
            {assignment.status && (
              <Chip
                label={assignment.status}
                color={getStatusColor(assignment.status)}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Category and Points */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Chip
            icon={<AssignmentIcon />}
            label={assignment.category}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<GradeIcon />}
            label={`${assignment.points} pts`}
            size="small"
            color="secondary"
          />
        </Box>

        {/* Due Date with Status */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <ScheduleIcon fontSize="small" color="action" />
          <Typography variant="body2" color="textSecondary">
            Due: {dayjs(assignment.dueDate).format("MMM DD, YYYY")}
          </Typography>
          <Tooltip title={dueDateStatus.status.replace("_", " ")}>
            <Box display="flex" alignItems="center">
              {dueDateStatus.icon}
            </Box>
          </Tooltip>
        </Box>

        {/* Time Estimate */}
        {assignment.timeEstimate && (
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <TimerIcon fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary">
              Estimated time: {formatTimeEstimate(assignment.timeEstimate)}
            </Typography>
          </Box>
        )}

        {/* Description Preview */}
        {assignment.description && !compact && (
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {assignment.description}
          </Typography>
        )}

        {/* Expandable Content */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />

          {/* Instructions */}
          {assignment.instructions && (
            <Box mb={2}>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                Instructions:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {assignment.instructions}
              </Typography>
            </Box>
          )}

          {/* Learning Objectives */}
          {assignment.learningObjectives &&
            assignment.learningObjectives.length > 0 && (
              <Box mb={2}>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Learning Objectives:
                </Typography>
                <List dense>
                  {assignment.learningObjectives.map((objective, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <TrendingUpIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={objective}
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

          {/* Required Materials */}
          {assignment.requiredMaterials &&
            assignment.requiredMaterials.length > 0 && (
              <Box mb={2}>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Required Materials:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {assignment.requiredMaterials.map((material, index) => (
                    <Chip
                      key={index}
                      label={material}
                      size="small"
                      variant="outlined"
                      color="default"
                    />
                  ))}
                </Box>
              </Box>
            )}

          {/* Grading Criteria */}
          {renderGradingCriteria()}

          {/* Late Policy */}
          {renderLatePolicy()}

          {/* Additional Metadata */}
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  Created: {dayjs(assignment.createdAt).format("MMM DD, YYYY")}
                </Typography>
              </Grid>
              {assignment.updatedAt && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Updated:{" "}
                    {dayjs(assignment.updatedAt).format("MMM DD, YYYY")}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Collapse>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ pt: 0, justifyContent: "space-between" }}>
        <Box display="flex" gap={1}>
          {showActions && (
            <>
              <Tooltip title="Edit Assignment">
                <IconButton size="small" onClick={() => onEdit(assignment)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Assignment">
                <IconButton size="small" onClick={() => onDelete(assignment)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>

        <Box display="flex" alignItems="center">
          <Tooltip title={expanded ? "Show less" : "Show more"}>
            <IconButton
              size="small"
              onClick={handleExpandClick}
              sx={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default EnhancedAssignmentCard;
