import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
  Avatar,
  LinearProgress,
  Paper,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  MoreVert as MoreIcon,
  CalendarToday as CalendarIcon,
  Grade as GradeIcon,
} from "@mui/icons-material";
import { useGradeBooks } from "../contexts/GradeBookContext";
import { useAcademicPeriods } from "../contexts/AcademicPeriodsContext";
import { useAssignments } from "../contexts/AssignmentContext";
import { useNavigate } from "react-router-dom";
import Loading from "../components/common/Loading";
import GradeBookForm from "../components/gradebooks/GradeBookForm";

const GradeBookList = () => {
  const navigate = useNavigate();
  const {
    gradeBooks,
    loading,
    error,
    createGradeBook,
    updateGradeBook,
    deleteGradeBook,
    duplicateGradeBook,
    archiveGradeBook,
    activateGradeBook,
    setCurrentGradeBook,
  } = useGradeBooks();
  const { assignments } = useAssignments();
  const { years } = useAcademicPeriods();
  const hasAcademicPeriods = years && years.length > 0;

  useEffect(() => {
    setCurrentGradeBook(null);
  }, [setCurrentGradeBook]);

  // State for UI
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editingGradeBook, setEditingGradeBook] = useState(null);
  const [selectedGradeBook, setSelectedGradeBook] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Filtered grade books
  const filteredGradeBooks = useMemo(() => {
    return gradeBooks.filter((gradeBook) => {
      const matchesSearch =
        gradeBook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gradeBook.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || gradeBook.status === statusFilter;
      const matchesSubject =
        subjectFilter === "all" || gradeBook.subject === subjectFilter;

      return matchesSearch && matchesStatus && matchesSubject;
    });
  }, [gradeBooks, searchTerm, statusFilter, subjectFilter]);

  // Get unique subjects for filter
  const subjects = useMemo(() => {
    const uniqueSubjects = [
      ...new Set(gradeBooks.map((gb) => gb.subject).filter(Boolean)),
    ];
    return uniqueSubjects.sort();
  }, [gradeBooks]);

  // Handle grade book actions
  const handleOpenGradeBook = (gradeBookId) => {
    navigate(`/gradebooks/${gradeBookId}`);
  };

  const handleDuplicate = async (gradeBookId) => {
    try {
      await duplicateGradeBook(gradeBookId);
      setSnackbar({
        open: true,
        message: "Grade book duplicated successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error duplicating grade book: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleArchive = async (gradeBookId) => {
    try {
      await archiveGradeBook(gradeBookId);
      setSnackbar({
        open: true,
        message: "Grade book archived successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error archiving grade book: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleActivate = async (gradeBookId) => {
    try {
      await activateGradeBook(gradeBookId);
      setSnackbar({
        open: true,
        message: "Grade book activated successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error activating grade book: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedGradeBook) return;

    try {
      // Use archiveGradeBook for a soft delete
      await archiveGradeBook(selectedGradeBook.id);
      setSnackbar({
        open: true,
        message: "Grade book archived successfully",
        severity: "success",
      });
      setDeleteDialogOpen(false);
      setSelectedGradeBook(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error archiving grade book: ${error.message}`,
        severity: "error",
      });
    }
  };

  const openDeleteDialog = (gradeBook) => {
    setSelectedGradeBook(gradeBook);
    setDeleteDialogOpen(true);
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get status color
  const handleSaveGradeBook = async (gradeBookData) => {
    try {
      if (editingGradeBook) {
        await updateGradeBook(editingGradeBook.id, gradeBookData);
        setSnackbar({
          open: true,
          message: "Grade book updated successfully",
          severity: "success",
        });
      } else {
        const newGradeBook = await createGradeBook(gradeBookData);
        setSnackbar({
          open: true,
          message: "Grade book created successfully",
          severity: "success",
        });
        navigate(`/gradebooks/${newGradeBook.id}`);
      }
      setFormOpen(false);
      setEditingGradeBook(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error saving grade book: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleEditGradeBook = (gradeBook) => {
    setEditingGradeBook(gradeBook);
    setFormOpen(true);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "archived":
        return "warning";
      case "draft":
        return "info";
      default:
        return "default";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <AssessmentIcon />;
      case "archived":
        return <ArchiveIcon />;
      case "draft":
        return <EditIcon />;
      default:
        return <SchoolIcon />;
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Debug information
  console.log("GradeBookList Debug:", {
    gradeBooks,
    loading,
    error,
    filteredGradeBooks: filteredGradeBooks.length,
  });

  if (loading) {
    return <Loading message="Loading grade books..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Grade Books
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your class grade books and assignments
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingGradeBook(null);
              setFormOpen(true);
            }}
            sx={{ borderRadius: 2, px: 3 }}
            disabled={!hasAcademicPeriods}
          >
            Create Grade Book
          </Button>
        </Box>
      </Box>

      {!hasAcademicPeriods && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate("/settings")}
            >
              Open Settings
            </Button>
          }
        >
          No school years found. Go to Settings → Academic Periods to create
          one.
        </Alert>
      )}

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search grade books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Subject</InputLabel>
              <Select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                label="Subject"
              >
                <MenuItem value="all">All Subjects</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="grid">
                <GridIcon />
              </ToggleButton>
              <ToggleButton value="list">
                <ListIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          <Grid item xs={12} md={2}>
            <Chip
              label={`${filteredGradeBooks.length} of ${gradeBooks.length}`}
              color="primary"
              variant="outlined"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Grade Books Grid/List */}
      {filteredGradeBooks.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <SchoolIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No grade books found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || statusFilter !== "all" || subjectFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first grade book to get started"}
          </Typography>
          {!searchTerm && statusFilter === "all" && subjectFilter === "all" && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setFormOpen(true)}
              disabled={!hasAcademicPeriods}
            >
              Create Your First Grade Book
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredGradeBooks.map((gradeBook) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={gradeBook.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  "&:hover": {
                    boxShadow: 4,
                    transform: "translateY(-2px)",
                    transition: "all 0.2s ease-in-out",
                  },
                }}
              >
                <CardContent
                  sx={{ flexGrow: 1 }}
                  onClick={() => handleOpenGradeBook(gradeBook.id)}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{ bgcolor: "primary.main", width: 40, height: 40 }}
                    >
                      {getStatusIcon(gradeBook.status)}
                    </Avatar>
                    <Chip
                      label={gradeBook.status}
                      color={getStatusColor(gradeBook.status)}
                      size="small"
                    />
                  </Box>

                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    {gradeBook.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {gradeBook.subject}
                  </Typography>

                  {gradeBook.gradeLevel && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {gradeBook.gradeLevel}
                    </Typography>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="h6" color="primary">
                            {gradeBook.students?.length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Students
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="h6" color="secondary">
                            {
                              assignments.filter(
                                (a) => a.gradebookId === gradeBook.id
                              ).length
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Assignments
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="h6" color="info.main">
                            {gradeBook.categories?.length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Categories
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Last modified: {formatDate(gradeBook.lastModified)}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: "space-between", p: 2 }}>
                  <Button
                    size="small"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditGradeBook(gradeBook);
                    }}
                  >
                    Edit
                  </Button>

                  <Box>
                    <Tooltip title="Duplicate">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(gradeBook.id);
                        }}
                      >
                        <DuplicateIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip
                      title={
                        gradeBook.status === "active" ? "Archive" : "Activate"
                      }
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (gradeBook.status === "active") {
                            handleArchive(gradeBook.id);
                          } else {
                            handleActivate(gradeBook.id);
                          }
                        }}
                      >
                        {gradeBook.status === "active" ? (
                          <ArchiveIcon />
                        ) : (
                          <UnarchiveIcon />
                        )}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(gradeBook);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Grade Book Dialog */}
      <GradeBookForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveGradeBook}
        gradebook={editingGradeBook}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Archive Grade Book</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to archive "{selectedGradeBook?.name}"? You
            can reactivate it later from the filters.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="warning" variant="contained">
            Archive
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GradeBookList;
