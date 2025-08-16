import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useBehavior } from "../../contexts/BehaviorContext";

const ReflectionConference = ({ 
  open, 
  onClose, 
  behaviorRecord, 
  studentName 
}) => {
  const { addReflection } = useBehavior();
  const [reflectionForm, setReflectionForm] = useState({
    studentResponse: "",
    teacherNotes: "",
    conferenceDate: dayjs(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle form input changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setReflectionForm({
      ...reflectionForm,
      [name]: value,
    });
  };

  // Handle date change
  const handleDateChange = (newDate) => {
    setReflectionForm({
      ...reflectionForm,
      conferenceDate: newDate,
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      const reflectionData = {
        ...reflectionForm,
        conferenceDate: reflectionForm.conferenceDate.toISOString(),
      };

      await addReflection(behaviorRecord.id, reflectionData);
      
      // Reset form
      setReflectionForm({
        studentResponse: "",
        teacherNotes: "",
        conferenceDate: dayjs(),
      });
      
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save reflection");
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    setReflectionForm({
      studentResponse: "",
      teacherNotes: "",
      conferenceDate: dayjs(),
    });
    setError("");
    onClose();
  };

  if (!behaviorRecord) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Reflection Conference
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Behavior Context */}
          <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Behavior Record Context
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Student:</strong> {studentName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Date:</strong> {dayjs(behaviorRecord.date).format("MMM DD, YYYY")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Description:</strong> {behaviorRecord.description}
            </Typography>
            {behaviorRecord.skills && behaviorRecord.skills.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Skills:</strong> {behaviorRecord.skills.map(s => `${s.skill} (${s.type})`).join(", ")}
              </Typography>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <DateTimePicker
                label="Conference Date & Time"
                value={reflectionForm.conferenceDate}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="studentResponse"
                label="Student's Perspective & Reflection"
                value={reflectionForm.studentResponse}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={4}
                placeholder="What did the student share about the situation? How do they feel about it? What did they learn?"
                helperText="Record the student's own words and reflections about the behavior incident"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="teacherNotes"
                label="Teacher Notes & Next Steps"
                value={reflectionForm.teacherNotes}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={4}
                placeholder="Key insights from the conversation, agreed-upon goals, and follow-up actions..."
                helperText="Document insights, agreements, and planned follow-up actions"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !reflectionForm.studentResponse.trim()}
          >
            {loading ? "Saving..." : "Save Reflection"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ReflectionConference;