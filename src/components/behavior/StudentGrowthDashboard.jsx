import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  Schedule as InProgressIcon,
  TrendingUp as GrowthIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useStudents } from "../../contexts/StudentContext";
import { useBehavior } from "../../contexts/BehaviorContext";
import Loading from "../common/Loading";

const StudentGrowthDashboard = ({ studentId, studentName }) => {
  const { getGoals, addGoal, updateGoal, deleteGoal } = useStudents();
  const { getSkillsTaxonomy } = useBehavior();
  const skillsTaxonomy = getSkillsTaxonomy();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalForm, setGoalForm] = useState({
    skillName: "",
    description: "",
    targetDate: dayjs().add(1, "month"),
    status: "In Progress",
  });

  // Fetch goals on component mount
  useEffect(() => {
    if (studentId) {
      fetchGoals();
    }
  }, [studentId]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const studentGoals = await getGoals(studentId);
      setGoals(studentGoals);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setGoalForm({
      ...goalForm,
      [name]: value,
    });
  };

  // Handle date change
  const handleDateChange = (newDate) => {
    setGoalForm({
      ...goalForm,
      targetDate: newDate,
    });
  };

  // Open add goal dialog
  const handleOpenAddDialog = () => {
    setGoalForm({
      skillName: "",
      description: "",
      targetDate: dayjs().add(1, "month"),
      status: "In Progress",
    });
    setOpenAddDialog(true);
  };

  // Open edit goal dialog
  const handleOpenEditDialog = (goal) => {
    setSelectedGoal(goal);
    setGoalForm({
      skillName: goal.skillName,
      description: goal.description,
      targetDate: dayjs(goal.targetDate.toDate()),
      status: goal.status,
    });
    setOpenEditDialog(true);
  };

  // Handle add goal
  const handleAddGoal = async () => {
    try {
      const goalData = {
        ...goalForm,
        targetDate: goalForm.targetDate.toDate(),
      };
      await addGoal(studentId, goalData);
      setOpenAddDialog(false);
      fetchGoals();
    } catch (err) {
      setError(err.message || "Failed to add goal");
    }
  };

  // Handle edit goal
  const handleEditGoal = async () => {
    try {
      const updatedData = {
        ...goalForm,
        targetDate: goalForm.targetDate.toDate(),
      };
      await updateGoal(studentId, selectedGoal.id, updatedData);
      setOpenEditDialog(false);
      fetchGoals();
    } catch (err) {
      setError(err.message || "Failed to update goal");
    }
  };

  // Handle delete goal
  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteGoal(studentId, goalId);
      fetchGoals();
    } catch (err) {
      setError(err.message || "Failed to delete goal");
    }
  };

  // Mark goal as complete
  const handleCompleteGoal = async (goal) => {
    try {
      await updateGoal(studentId, goal.id, { status: "Completed" });
      fetchGoals();
    } catch (err) {
      setError(err.message || "Failed to update goal");
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "success";
      case "In Progress":
        return "primary";
      default:
        return "default";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CompleteIcon color="success" />;
      case "In Progress":
        return <InProgressIcon color="primary" />;
      default:
        return <InProgressIcon />;
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    if (goals.length === 0) return 0;
    const completedGoals = goals.filter(goal => goal.status === "Completed").length;
    return (completedGoals / goals.length) * 100;
  };

  if (loading) {
    return <Loading message="Loading student goals..." />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Growth Goals - {studentName}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add Goal
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Progress Overview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Progress Overview
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <GrowthIcon sx={{ mr: 1 }} />
              <Typography variant="body1">
                {goals.filter(g => g.status === "Completed").length} of {goals.length} goals completed
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={calculateProgress()} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {Math.round(calculateProgress())}% Complete
            </Typography>
          </CardContent>
        </Card>

        {/* Goals List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Active Goals
            </Typography>
            {goals.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                No goals set yet. Click "Add Goal" to get started!
              </Typography>
            ) : (
              <List>
                {goals.map((goal, index) => (
                  <React.Fragment key={goal.id}>
                    <ListItem alignItems="flex-start">
                      <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
                        {getStatusIcon(goal.status)}
                      </Box>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle1">
                              {goal.skillName}
                            </Typography>
                            <Chip 
                              label={goal.status} 
                              size="small" 
                              color={getStatusColor(goal.status)}
                            />
                          </Box>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2">
                              {goal.description}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              Target: {dayjs(goal.targetDate.toDate()).format("MMM DD, YYYY")}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                      <ListItemSecondaryAction>
                        {goal.status !== "Completed" && (
                          <IconButton
                            edge="end"
                            onClick={() => handleCompleteGoal(goal)}
                            sx={{ mr: 1 }}
                            title="Mark as Complete"
                          >
                            <CompleteIcon />
                          </IconButton>
                        )}
                        <IconButton
                          edge="end"
                          onClick={() => handleOpenEditDialog(goal)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < goals.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Add Goal Dialog */}
        <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Growth Goal</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Skill Area</InputLabel>
                  <Select
                    name="skillName"
                    value={goalForm.skillName}
                    onChange={handleFormChange}
                    label="Skill Area"
                  >
                    {Object.entries(skillsTaxonomy).map(([category, skills]) => [
                      <MenuItem key={category} disabled sx={{ fontWeight: "bold" }}>
                        {category}
                      </MenuItem>,
                      ...skills.map(skill => (
                        <MenuItem key={skill} value={skill} sx={{ pl: 4 }}>
                          {skill}
                        </MenuItem>
                      ))
                    ]).flat()}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Goal Description"
                  value={goalForm.description}
                  onChange={handleFormChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="What specific behavior or skill will the student work on?"
                />
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="Target Date"
                  value={goalForm.targetDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAddGoal}
              variant="contained"
              disabled={!goalForm.skillName || !goalForm.description}
            >
              Add Goal
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Goal Dialog */}
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Growth Goal</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Skill Area</InputLabel>
                  <Select
                    name="skillName"
                    value={goalForm.skillName}
                    onChange={handleFormChange}
                    label="Skill Area"
                  >
                    {Object.entries(skillsTaxonomy).map(([category, skills]) => [
                      <MenuItem key={category} disabled sx={{ fontWeight: "bold" }}>
                        {category}
                      </MenuItem>,
                      ...skills.map(skill => (
                        <MenuItem key={skill} value={skill} sx={{ pl: 4 }}>
                          {skill}
                        </MenuItem>
                      ))
                    ]).flat()}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Goal Description"
                  value={goalForm.description}
                  onChange={handleFormChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="Target Date"
                  value={goalForm.targetDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={goalForm.status}
                    onChange={handleFormChange}
                    label="Status"
                  >
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button
              onClick={handleEditGoal}
              variant="contained"
              disabled={!goalForm.skillName || !goalForm.description}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default StudentGrowthDashboard;