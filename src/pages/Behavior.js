import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BarChart as ChartIcon,
  ViewList as ListView,
  CalendarMonth as CalendarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  Psychology as SkillsIcon,
  Comment as ReflectionIcon,
} from "@mui/icons-material";
import { useStudents } from "../contexts/StudentContext";
import { useBehavior } from "../contexts/BehaviorContext";
import Loading from "../components/common/Loading";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import SkillPicker from "../components/behavior/SkillPicker";
import ReflectionConference from "../components/behavior/ReflectionConference";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { getClassSkillsProfile } from "../services/analyticsService";
import SkillBadge from "../components/behavior/SkillBadge";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
  Legend
);

const Behavior = () => {
  const { students, loading: studentsLoading } = useStudents();
  const {
    behavior,
    loading: behaviorLoading,
    logBehavior,
    updateBehavior,
    deleteBehavior,
    getSkillsTaxonomy,
  } = useBehavior();

  // State for UI
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list", "chart", or "calendar"
  const [filterSkill, setFilterSkill] = useState("All");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openReflectionDialog, setOpenReflectionDialog] = useState(false);
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [behaviorForm, setBehaviorForm] = useState({
    studentId: "",
    date: dayjs(),
    description: "",
    skills: [],
    restorativeAction: "",
  });
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [analytics, setAnalytics] = useState(null);
  const computeSkillCounts = (records) => {
    const counts = {};
    const inferSkills = (record) => {
      if (Array.isArray(record.skills) && record.skills.length > 0) return record.skills;
      const desc = record?.description || "";
      if (/called out|interrupt|shout|disrupt/i.test(desc)) {
        return [{ skill: "Self-Regulation", type: "growth" }];
      }
      if (/helped|supported|team|group|collaborat/i.test(desc)) {
        return [{ skill: "Collaboration", type: "strength" }];
      }
      const legacyType = (record?.type || "").toLowerCase();
      return [{ skill: "Resilience", type: legacyType === "positive" ? "strength" : "growth" }];
    };
    (records || []).forEach((record) => {
      const skills = inferSkills(record) || [];
      skills.forEach((s) => {
        const key = s?.skill || "Unknown";
        counts[key] = (counts[key] || 0) + (s?.type === "strength" ? 2 : 1);
      });
    });
    return counts;
  };

  // Loading state
  const loading = studentsLoading || behaviorLoading;

  // Initialize form with first student when data loads
  useEffect(() => {
    if (!loading && students.length > 0 && !behaviorForm.studentId) {
      setBehaviorForm((prev) => ({
        ...prev,
        studentId: students[0].id,
      }));
    }
  }, [loading, students, behaviorForm.studentId]);

  // Load analytics for radar chart
  useEffect(() => {
    (async () => {
      try {
        const data = await getClassSkillsProfile();
        setAnalytics(data);
      } catch (e) {
        // non-fatal
      }
    })();
  }, []);

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  // Handle view mode change
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Handle filter changes
  const handleFilterSkillChange = (event) => {
    setFilterSkill(event.target.value);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter behavior records
  const getFilteredBehavior = () => {
    let filtered = behavior;

    // Filter by student if selected
    if (selectedStudent) {
      filtered = filtered.filter(
        (record) => record.studentId === selectedStudent.id
      );
    }

    // Filter by skill
    if (filterSkill !== "All") {
      filtered = filtered.filter((record) =>
        (record.skills || []).some((s) => s.skill === filterSkill)
      );
    }

    // Sort by date (newest first)
    return filtered.sort(
      (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    );
  };

  // Open add behavior dialog
  const handleOpenAddDialog = () => {
    setBehaviorForm({
      studentId: selectedStudent
        ? selectedStudent.id
        : students.length > 0
        ? students[0].id
        : "",
      date: dayjs(),
      description: "",
      skills: [],
      restorativeAction: "",
    });
    setOpenAddDialog(true);
  };

  // Close add behavior dialog
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  // Handle form input changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setBehaviorForm({
      ...behaviorForm,
      [name]: value,
    });
  };

  const handleSkillsChange = (newSkills) => {
    setBehaviorForm({
      ...behaviorForm,
      skills: newSkills,
    });
  };

  // Handle date change
  const handleDateChange = (newDate) => {
    setBehaviorForm({
      ...behaviorForm,
      date: newDate,
    });
  };

  // Submit add behavior form
  const handleAddBehavior = async () => {
    try {
      const newBehavior = {
        ...behaviorForm,
        date: behaviorForm.date.format("YYYY-MM-DD"),
      };

      await logBehavior(newBehavior);
      setOpenAddDialog(false);
      setSnackbar({
        open: true,
        message: "Behavior record added successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error adding behavior record: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Open edit behavior dialog
  const handleOpenEditDialog = (record) => {
    setSelectedBehavior(record);
    setBehaviorForm({
      studentId: record.studentId,
      date: dayjs(record.date),
      description: record.description,
      skills: record.skills || [],
      restorativeAction: record.restorativeAction || "",
    });
    setOpenEditDialog(true);
  };

  // Close edit behavior dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  // Submit edit behavior form
  const handleEditBehavior = async () => {
    try {
      const updatedBehavior = {
        ...behaviorForm,
        date: behaviorForm.date.format("YYYY-MM-DD"),
      };

      await updateBehavior(selectedBehavior.id, updatedBehavior);

      setOpenEditDialog(false);
      setSnackbar({
        open: true,
        message: "Behavior record updated successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error updating behavior record: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Open delete behavior dialog
  const handleOpenDeleteDialog = (record) => {
    setSelectedBehavior(record);
    setOpenDeleteDialog(true);
  };

  // Close delete behavior dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Submit delete behavior
  const handleDeleteBehavior = async () => {
    try {
      await deleteBehavior(selectedBehavior.id);

      setOpenDeleteDialog(false);
      setSnackbar({
        open: true,
        message: "Behavior record deleted successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting behavior record: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Open reflection dialog
  const handleOpenReflectionDialog = (record) => {
    setSelectedBehavior(record);
    setOpenReflectionDialog(true);
  };

  // Close reflection dialog
  const handleCloseReflectionDialog = () => {
    setOpenReflectionDialog(false);
    setSelectedBehavior(null);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return dayjs(dateString).toDate().toLocaleDateString(undefined, options);
  };

  // Get student name by ID
  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Unknown";
  };

  if (loading) {
    return <Loading message="Loading behavior data..." />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          Behavior Tracking
        </Typography>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="behavior tabs"
          >
            <Tab label="Behavior Log" />
            <Tab label="Behavior Analytics" />
          </Tabs>
        </Box>

        {/* Behavior Log Tab */}
        {tabValue === 0 && (
          <>
            {/* Controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Student</InputLabel>
                    <Select
                      value={selectedStudent ? selectedStudent.id : ""}
                      onChange={(e) => {
                        const student = students.find(
                          (s) => s.id === e.target.value
                        );
                        handleStudentSelect(student || null);
                      }}
                      label="Student"
                    >
                      <MenuItem value="">All Students</MenuItem>
                      {students.map((student) => (
                        <MenuItem key={student.id} value={student.id}>
                          {student.firstName} {student.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Skill</InputLabel>
                    <Select
                      value={filterSkill}
                      onChange={handleFilterSkillChange}
                      label="Skill"
                    >
                      <MenuItem value="All">All Skills</MenuItem>
                      {Object.values(getSkillsTaxonomy()).flat().map(skill => (
                        <MenuItem key={skill} value={skill}>{skill}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddDialog}
                    fullWidth
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* List View */}
            {viewMode === "list" && (
              <Card elevation={2}>
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {getFilteredBehavior().length > 0 ? (
                      getFilteredBehavior().map((record, index) => (
                        <React.Fragment key={record.id}>
                          <ListItem alignItems="flex-start">
                            <ListItemIcon>
                              <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
                                <SkillsIcon />
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    component="span"
                                  >
                                    {getStudentName(record.studentId)}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ ml: 2 }}
                                  >
                                    {formatDate(record.date)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography
                                    component="span"
                                    variant="body1"
                                    color="text.primary"
                                  >
                                    {record.description}
                                  </Typography>
                                  <Box sx={{ mt: 1 }}>
                                    {record.skills?.map(skill => (
                                      <Chip key={skill.skill} label={`${skill.skill} (${skill.type})`} size="small" sx={{ mr: 1 }} color={skill.type === 'strength' ? 'success' : 'warning'} />
                                    ))}
                                  </Box>
                                  {record.restorativeAction && (
                                    <>
                                      <br />
                                      <Typography
                                        component="span"
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Support & Restorative Steps: {record.restorativeAction}
                                      </Typography>
                                    </>
                                  )}
                                </React.Fragment>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                aria-label="log reflection"
                                onClick={() => handleOpenReflectionDialog(record)}
                                size="small"
                                sx={{ mr: 1 }}
                                title="Log Reflection"
                              >
                                <ReflectionIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                aria-label="edit"
                                onClick={() => handleOpenEditDialog(record)}
                                size="small"
                                sx={{ mr: 1 }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={() => handleOpenDeleteDialog(record)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < getFilteredBehavior().length - 1 && (
                            <Divider component="li" />
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="No behavior records found" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Behavior Analytics Tab */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Class Skills Profile
                  </Typography>
                  {(() => {
                    const skillCounts = analytics?.skillCounts || computeSkillCounts(getFilteredBehavior());
                    const hasData = skillCounts && Object.keys(skillCounts).length > 0;
                    return hasData ? (
                    <Radar
                      data={{
                        labels: Object.keys(skillCounts),
                        datasets: [
                          {
                            label: "Weighted Skill Signals",
                            data: Object.values(skillCounts),
                            backgroundColor: "rgba(25,118,210,0.2)",
                            borderColor: "rgba(25,118,210,1)",
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        scales: {
                          r: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                    ) : (
                      <Typography color="text.secondary">No analytics yet.</Typography>
                    );
                  })()}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Skill Badges (Examples)
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <SkillBadge skillName="Self-Regulation" level="gold" count={5} />
                    <SkillBadge skillName="Collaboration" level="silver" count={3} />
                    <SkillBadge skillName="Resilience" level="bronze" count={2} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Add/Edit Behavior Dialog */}
        <Dialog
          open={openAddDialog || openEditDialog}
          onClose={openAddDialog ? handleCloseAddDialog : handleCloseEditDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{openAddDialog ? "Add New Behavior Record" : "Edit Behavior Record"}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Student</InputLabel>
                  <Select
                    name="studentId"
                    value={behaviorForm.studentId}
                    onChange={handleFormChange}
                    label="Student"
                  >
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date"
                  value={behaviorForm.date}
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
                  name="description"
                  label="Description of Observation"
                  value={behaviorForm.description}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <SkillPicker selectedSkills={behaviorForm.skills} onSkillChange={handleSkillsChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="restorativeAction"
                  label="Support & Restorative Steps (Optional)"
                  value={behaviorForm.restorativeAction}
                  onChange={handleFormChange}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={openAddDialog ? handleCloseAddDialog : handleCloseEditDialog}>Cancel</Button>
            <Button
              onClick={openAddDialog ? handleAddBehavior : handleEditBehavior}
              variant="contained"
              color="primary"
              disabled={!behaviorForm.studentId || !behaviorForm.description || behaviorForm.skills.length === 0}
            >
              {openAddDialog ? "Add Record" : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Behavior Dialog */}
        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Delete Behavior Record</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this behavior record? This action
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button
              onClick={handleDeleteBehavior}
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reflection Conference Dialog */}
        <ReflectionConference
          open={openReflectionDialog}
          onClose={handleCloseReflectionDialog}
          behaviorRecord={selectedBehavior}
          studentName={selectedBehavior ? getStudentName(selectedBehavior.studentId) : ""}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default Behavior;
