import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  Add as AddIcon,
  ContentCopy as CloneIcon,
  Archive as ArchiveIcon,
  RestoreFromTrash as RestoreIcon,
} from "@mui/icons-material";
import { useGradeBooks } from "../../contexts/GradeBookContext";
import { useAcademicPeriods } from "../../contexts/AcademicPeriodsContext";
import TermGradeBookManager from "./TermGradeBookManager";

const TermSelector = ({ 
  currentGradeBook, 
  onGradeBookChange, 
  subject,
  showCreateButton = true 
}) => {
  const { 
    gradeBooks, 
    getGradeBooksBySubject,
    getGradeBooksByTerm 
  } = useGradeBooks();
  
  const { years, getSemestersForYear, getTermsForSemester } = useAcademicPeriods();

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [showTermManager, setShowTermManager] = useState(false);
  const [availableGradeBooks, setAvailableGradeBooks] = useState([]);

  // Initialize with current gradebook's term
  useEffect(() => {
    if (currentGradeBook) {
      setSelectedYear(currentGradeBook.academicYear || "");
      setSelectedSemester(currentGradeBook.semester || "");
      setSelectedTerm(currentGradeBook.term || "");
    }
  }, [currentGradeBook]);

  // Get available gradebooks for the selected subject
  useEffect(() => {
    if (subject) {
      const subjectGradeBooks = getGradeBooksBySubject(subject);
      setAvailableGradeBooks(subjectGradeBooks);
    }
  }, [subject, gradeBooks, getGradeBooksBySubject]);

  // Get gradebooks for the selected term
  const getGradeBooksForCurrentTerm = () => {
    if (!selectedYear || !selectedSemester || !selectedTerm) return [];
    return getGradeBooksByTerm(selectedYear, selectedSemester, selectedTerm);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedSemester("");
    setSelectedTerm("");
  };

  const handleSemesterChange = (semester) => {
    setSelectedSemester(semester);
    setSelectedTerm("");
  };

  const handleTermChange = (term) => {
    setSelectedTerm(term);
    
    // Find the gradebook for this term and subject
    const termGradeBooks = getGradeBooksByTerm(selectedYear, selectedSemester, term);
    const subjectGradeBook = termGradeBooks.find(gb => gb.subject === subject);
    
    if (subjectGradeBook && onGradeBookChange) {
      onGradeBookChange(subjectGradeBook);
    }
  };

  const getCurrentTermGradeBook = () => {
    if (!selectedYear || !selectedSemester || !selectedTerm || !subject) return null;
    const termGradeBooks = getGradeBooksByTerm(selectedYear, selectedSemester, selectedTerm);
    return termGradeBooks.find(gb => gb.subject === subject);
  };

  const currentTermGradeBook = getCurrentTermGradeBook();

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'archived': return 'warning';
      case 'draft': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <CalendarIcon color="primary" />
        <Typography variant="h6">Term Selection</Typography>
        {showCreateButton && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowTermManager(true)}
          >
            Manage Terms
          </Button>
        )}
      </Box>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Academic Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              label="Academic Year"
            >
              {years.map((year) => (
                <MenuItem key={year.id} value={year.name}>
                  {year.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small" disabled={!selectedYear}>
            <InputLabel>Semester</InputLabel>
            <Select
              value={selectedSemester}
              onChange={(e) => handleSemesterChange(e.target.value)}
              label="Semester"
            >
              {getSemestersForYear(years.find(y => y.name === selectedYear)?.id || "").map((semester) => (
                <MenuItem key={semester.id} value={semester.name}>
                  {semester.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small" disabled={!selectedSemester}>
            <InputLabel>Term</InputLabel>
            <Select
              value={selectedTerm}
              onChange={(e) => handleTermChange(e.target.value)}
              label="Term"
            >
              {getTermsForSemester(
                years.find(y => y.name === selectedYear)?.id || "",
                getSemestersForYear(years.find(y => y.name === selectedYear)?.id || "")
                  .find(s => s.name === selectedSemester)?.id || ""
              ).map((term) => (
                <MenuItem key={term.id} value={term.name}>
                  {term.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          {currentTermGradeBook ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                icon={<SchoolIcon />}
                label={currentTermGradeBook.name}
                color={getStatusColor(currentTermGradeBook.status)}
                variant="outlined"
              />
              <Chip
                label={`${currentTermGradeBook.students?.length || 0} students`}
                size="small"
              />
              <Chip
                label={`${currentTermGradeBook.assignments?.length || 0} assignments`}
                size="small"
              />
            </Box>
          ) : (
            <Alert severity="info" sx={{ py: 0 }}>
              No gradebook for this term
            </Alert>
          )}
        </Grid>
      </Grid>

      {/* Term Information Card */}
      {currentTermGradeBook && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {currentTermGradeBook.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {currentTermGradeBook.subject} • {currentTermGradeBook.gradeLevel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(currentTermGradeBook.createdAt).toLocaleDateString()}
                  {currentTermGradeBook.lastModified && (
                    <> • Last Modified: {new Date(currentTermGradeBook.lastModified).toLocaleDateString()}</>
                  )}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Clone for New Term">
                  <IconButton size="small">
                    <CloneIcon />
                  </IconButton>
                </Tooltip>
                {currentTermGradeBook.status === 'active' ? (
                  <Tooltip title="Archive Grade Book">
                    <IconButton size="small">
                      <ArchiveIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Activate Grade Book">
                    <IconButton size="small">
                      <RestoreIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Available Terms Summary */}
      {availableGradeBooks.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Available Terms for {subject}:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {availableGradeBooks.map((gradeBook) => (
              <Chip
                key={gradeBook.id}
                label={`${gradeBook.academicYear} • ${gradeBook.semester} • ${gradeBook.term}`}
                color={gradeBook.id === currentGradeBook?.id ? "primary" : "default"}
                variant={gradeBook.id === currentGradeBook?.id ? "filled" : "outlined"}
                size="small"
                onClick={() => onGradeBookChange && onGradeBookChange(gradeBook)}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Term Manager Dialog */}
      <TermGradeBookManager
        open={showTermManager}
        onClose={() => setShowTermManager(false)}
      />
    </Box>
  );
};

export default TermSelector; 