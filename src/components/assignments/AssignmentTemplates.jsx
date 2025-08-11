import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Save as SaveIcon,
  Assignment as AssignmentIcon,
  Timer as TimerIcon,
  Grade as GradeIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";

const AssignmentTemplates = ({
  open,
  onClose,
  templates,
  onUseTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  categories,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customizationForm, setCustomizationForm] = useState({});
  const [showCustomization, setShowCustomization] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setCustomizationForm({
      name: template.name,
      subject: "",
      dueDate: dayjs().add(7, "day").toDate(),
      points: template.points,
      timeEstimate: template.timeEstimate,
      difficultyLevel: template.difficultyLevel,
      instructions: template.instructions,
      description: "",
    });
    setShowCustomization(true);
  };

  const handleCustomizationChange = (field, value) => {
    setCustomizationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUseTemplate = () => {
    if (!customizationForm.name || !customizationForm.subject) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields",
        severity: "error",
      });
      return;
    }

    const assignmentData = {
      ...selectedTemplate,
      ...customizationForm,
      createdAt: new Date().toISOString(),
      status: "draft",
    };

    onUseTemplate(assignmentData);
    setShowCustomization(false);
    setSelectedTemplate(null);
    setCustomizationForm({});
    onClose();
  };

  const handleSaveAsTemplate = () => {
    if (!customizationForm.name) {
      setSnackbar({
        open: true,
        message: "Please provide a template name",
        severity: "error",
      });
      return;
    }

    const templateData = {
      ...selectedTemplate,
      ...customizationForm,
      id: `template-${Date.now()}`,
    };

    onSaveTemplate(templateData);
    setSnackbar({
      open: true,
      message: "Template saved successfully",
      severity: "success",
    });
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

  const formatTimeEstimate = (minutes) => {
    if (!minutes) return "Not specified";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const renderTemplateCard = (template) => (
    <Card
      key={template.id}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
      onClick={() => handleTemplateSelect(template)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Typography variant="h6" component="h3" gutterBottom>
            {template.name}
          </Typography>
          <Chip
            label={template.difficultyLevel}
            color={getDifficultyColor(template.difficultyLevel)}
            size="small"
            variant="outlined"
          />
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Chip
            icon={<AssignmentIcon />}
            label={template.category}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<GradeIcon />}
            label={`${template.points} pts`}
            size="small"
            color="secondary"
          />
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <TimerIcon fontSize="small" color="action" />
          <Typography variant="body2" color="textSecondary">
            {formatTimeEstimate(template.timeEstimate)}
          </Typography>
        </Box>

        {template.instructions && (
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {template.instructions}
          </Typography>
        )}

        {template.gradingCriteria && (
          <Box mt={2}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Grading Criteria:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {Object.entries(template.gradingCriteria).map(
                ([criterion, weight]) => (
                  <Chip
                    key={criterion}
                    label={`${criterion.replace("_", " ")}: ${weight}%`}
                    size="small"
                    variant="outlined"
                  />
                )
              )}
            </Box>
          </Box>
        )}
      </CardContent>

      <CardActions>
        <Button
          size="small"
          startIcon={<CopyIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handleTemplateSelect(template);
          }}
        >
          Use Template
        </Button>
      </CardActions>
    </Card>
  );

  const renderCustomizationForm = () => (
    <Dialog
      open={showCustomization}
      onClose={() => setShowCustomization(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Customize Assignment from Template</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Assignment Name *"
              value={customizationForm.name || ""}
              onChange={(e) =>
                handleCustomizationChange("name", e.target.value)
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Subject *</InputLabel>
              <Select
                value={customizationForm.subject || ""}
                onChange={(e) =>
                  handleCustomizationChange("subject", e.target.value)
                }
                label="Subject *"
              >
                {Object.keys(categories).map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Points"
              type="number"
              value={customizationForm.points || ""}
              onChange={(e) =>
                handleCustomizationChange("points", parseInt(e.target.value))
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Time Estimate (minutes)"
              type="number"
              value={customizationForm.timeEstimate || ""}
              onChange={(e) =>
                handleCustomizationChange(
                  "timeEstimate",
                  parseInt(e.target.value)
                )
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={customizationForm.difficultyLevel || ""}
                onChange={(e) =>
                  handleCustomizationChange("difficultyLevel", e.target.value)
                }
                label="Difficulty Level"
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={
                customizationForm.dueDate
                  ? dayjs(customizationForm.dueDate).format("YYYY-MM-DD")
                  : ""
              }
              onChange={(e) =>
                handleCustomizationChange("dueDate", new Date(e.target.value))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={customizationForm.description || ""}
              onChange={(e) =>
                handleCustomizationChange("description", e.target.value)
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Instructions"
              multiline
              rows={4}
              value={customizationForm.instructions || ""}
              onChange={(e) =>
                handleCustomizationChange("instructions", e.target.value)
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowCustomization(false)}>Cancel</Button>
        <Button
          onClick={handleSaveAsTemplate}
          startIcon={<SaveIcon />}
          variant="outlined"
        >
          Save as Template
        </Button>
        <Button
          onClick={handleUseTemplate}
          startIcon={<AddIcon />}
          variant="contained"
        >
          Create Assignment
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>Assignment Templates</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                {renderTemplateCard(template)}
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {renderCustomizationForm()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AssignmentTemplates;
