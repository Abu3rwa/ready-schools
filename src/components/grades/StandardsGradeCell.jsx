import React, { useState } from "react";
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Paper,
} from "@mui/material";
import {
  Edit as EditIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useStandardsGrading } from "../../contexts/StandardsGradingContext";

const StandardsGradeCell = ({
  studentId,
  assignmentId,
  standardId,
  standardCode,
  standardName,
  currentGrade,
  onGradeChange,
  proficiencyScale = "four_point",
  readOnly = false,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tempGrade, setTempGrade] = useState({
    proficiencyLevel: currentGrade?.proficiencyLevel || 0,
    score: currentGrade?.score || "",
    notes: currentGrade?.notes || "",
  });

  const { createStandardsGrade, updateStandardsGrade } = useStandardsGrading();

  // Proficiency level options based on scale
  const proficiencyLevels = proficiencyScale === "five_point" 
    ? [
        { value: 1, label: "1 - Beginning", color: "#d32f2f", description: "Student is beginning to understand the concept" },
        { value: 2, label: "2 - Developing", color: "#f57c00", description: "Student is developing understanding of the concept" },
        { value: 3, label: "3 - Proficient", color: "#1976d2", description: "Student demonstrates proficiency in the concept" },
        { value: 4, label: "4 - Advanced", color: "#2e7d32", description: "Student demonstrates advanced mastery of the concept" },
        { value: 5, label: "5 - Exemplary", color: "#388e3c", description: "Student demonstrates exemplary mastery of the concept" },
      ]
    : [
        { value: 1, label: "1 - Beginning", color: "#d32f2f", description: "Student is beginning to understand the concept" },
        { value: 2, label: "2 - Developing", color: "#f57c00", description: "Student is developing understanding of the concept" },
        { value: 3, label: "3 - Proficient", color: "#1976d2", description: "Student demonstrates proficiency in the concept" },
        { value: 4, label: "4 - Advanced", color: "#2e7d32", description: "Student demonstrates advanced mastery of the concept" },
      ];

  const getProficiencyInfo = (level) => {
    return proficiencyLevels.find(p => p.value === level) || proficiencyLevels[0];
  };

  const getMasteryIcon = (level) => {
    if (level >= 4) return <CheckCircleIcon sx={{ color: "#2e7d32" }} />;
    if (level >= 3) return <CheckCircleIcon sx={{ color: "#1976d2" }} />;
    if (level >= 2) return <WarningIcon sx={{ color: "#f57c00" }} />;
    return <ErrorIcon sx={{ color: "#d32f2f" }} />;
  };

  const handleGradeChange = async () => {
    try {
      const gradeData = {
        studentId,
        assignmentId,
        standardId,
        proficiencyLevel: tempGrade.proficiencyLevel,
        score: tempGrade.score || null,
        notes: tempGrade.notes || null,
        subject: "Mathematics", // This should come from the assignment
      };

      if (currentGrade?.id) {
        // Update existing grade
        await updateStandardsGrade(currentGrade.id, gradeData);
      } else {
        // Create new grade
        await createStandardsGrade(gradeData);
      }

      // Call parent callback
      if (onGradeChange) {
        onGradeChange({
          ...gradeData,
          id: currentGrade?.id,
        });
      }

      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error saving standards grade:", error);
      // You might want to show an error message here
    }
  };

  const handleQuickGrade = async (level) => {
    if (readOnly) return;

    try {
      const gradeData = {
        studentId,
        assignmentId,
        standardId,
        proficiencyLevel: level,
        score: null,
        notes: null,
        subject: "Mathematics", // This should come from the assignment
      };

      if (currentGrade?.id) {
        await updateStandardsGrade(currentGrade.id, gradeData);
      } else {
        await createStandardsGrade(gradeData);
      }

      if (onGradeChange) {
        onGradeChange({
          ...gradeData,
          id: currentGrade?.id,
        });
      }
    } catch (error) {
      console.error("Error saving quick grade:", error);
    }
  };

  const currentProficiency = getProficiencyInfo(currentGrade?.proficiencyLevel || 0);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1,
          minHeight: 40,
          border: "1px solid",
          borderColor: currentGrade?.proficiencyLevel ? currentProficiency.color : "divider",
          borderRadius: 1,
          backgroundColor: currentGrade?.proficiencyLevel ? `${currentProficiency.color}10` : "transparent",
        }}
      >
        {/* Quick Grade Buttons */}
        {!readOnly && (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {proficiencyLevels.map((level) => (
              <Tooltip key={level.value} title={level.label}>
                <IconButton
                  size="small"
                  onClick={() => handleQuickGrade(level.value)}
                  sx={{
                    p: 0.5,
                    minWidth: 24,
                    height: 24,
                    color: level.color,
                    border: currentGrade?.proficiencyLevel === level.value ? `2px solid ${level.color}` : "1px solid transparent",
                    "&:hover": {
                      backgroundColor: `${level.color}20`,
                    },
                  }}
                >
                  {level.value}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        )}

        {/* Current Grade Display */}
        {currentGrade?.proficiencyLevel ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            {getMasteryIcon(currentGrade.proficiencyLevel)}
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                color: currentProficiency.color,
              }}
            >
              {currentGrade.proficiencyLevel}
            </Typography>
            {currentGrade.notes && (
              <Tooltip title={currentGrade.notes}>
                <InfoIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              </Tooltip>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Not graded
          </Typography>
        )}

        {/* Edit Button */}
        {!readOnly && (
          <Tooltip title="Edit grade">
            <IconButton
              size="small"
              onClick={() => setEditDialogOpen(true)}
              sx={{ p: 0.5 }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6">Grade Standard</Typography>
            <Typography variant="body2" color="text.secondary">
              {standardCode} - {standardName}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Proficiency Level Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Proficiency Level
              </Typography>
              <Select
                value={tempGrade.proficiencyLevel}
                onChange={(e) => setTempGrade(prev => ({ ...prev, proficiencyLevel: e.target.value }))}
                displayEmpty
              >
                <MenuItem value={0} disabled>
                  Select proficiency level
                </MenuItem>
                {proficiencyLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: level.color,
                        }}
                      />
                      <Typography>{level.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {tempGrade.proficiencyLevel > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  {getProficiencyInfo(tempGrade.proficiencyLevel).description}
                </Typography>
              )}
            </FormControl>

            {/* Optional Score */}
            <TextField
              fullWidth
              label="Optional Score (0-100)"
              type="number"
              value={tempGrade.score}
              onChange={(e) => setTempGrade(prev => ({ ...prev, score: e.target.value }))}
              sx={{ mb: 3 }}
              inputProps={{ min: 0, max: 100 }}
              helperText="Optional numeric score to supplement proficiency level"
            />

            {/* Notes */}
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={tempGrade.notes}
              onChange={(e) => setTempGrade(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes or comments about the student's performance..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleGradeChange}
            variant="contained"
            disabled={tempGrade.proficiencyLevel === 0}
          >
            Save Grade
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StandardsGradeCell; 