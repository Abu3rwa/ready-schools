import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Send as SendIcon,
  Preview as PreviewIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  EventNote as EventNoteIcon,
  Psychology as PsychologyIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import WeeklyTemplate from "../reports/templates/WeeklyTemplate";
import MonthlyTemplate from "../reports/templates/MonthlyTemplate";
import { 
  generateWeeklyReport, 
  generateMonthlyReport,
  generateBatchWeeklyReports,
  generateBatchMonthlyReports
} from "../../services/weeklyUpdateService";
import { 
  sendWeeklyUpdate, 
  sendMonthlyUpdate,
  getEmailDeliveryHistory
} from "../../services/enhancedEmailService";
import { 
  scheduleWeeklyEmails, 
  scheduleMonthlyEmails,
  getNextScheduledTimes,
  manualTriggerWeeklyEmails,
  manualTriggerMonthlyEmails
} from "../../services/emailSchedulerService";
import { 
  getEmailPreferences, 
  updateEmailPreferences,
  getDefaultEmailPreferences
} from "../../services/emailPreferencesService";

const PeriodicReportManager = ({ students }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Weekly report state
  const [weeklyDateRange, setWeeklyDateRange] = useState({
    start: dayjs().startOf('week'),
    end: dayjs().endOf('week')
  });
  const [weeklyReportData, setWeeklyReportData] = useState(null);
  const [selectedStudentsForWeekly, setSelectedStudentsForWeekly] = useState([]);
  
  // Monthly report state
  const [monthlyPeriod, setMonthlyPeriod] = useState({
    month: dayjs().month() + 1,
    year: dayjs().year()
  });
  const [monthlyReportData, setMonthlyReportData] = useState(null);
  const [selectedStudentsForMonthly, setSelectedStudentsForMonthly] = useState([]);
  
  // Email preferences
  const [emailPreferences, setEmailPreferences] = useState(null);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  
  // Preview and sending
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  
  // Scheduling
  const [nextScheduledTimes, setNextScheduledTimes] = useState(null);
  const [schedulingDialogOpen, setSchedulingDialogOpen] = useState(false);

  const { currentUser } = useAuth();
  const [schoolNamePref, setSchoolNamePref] = useState("");

  useEffect(() => {
    const loadPrefs = async () => {
      if (!currentUser) return;
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.school_name) setSchoolNamePref(d.school_name);
        }
      } catch {}
    };
    loadPrefs();
    
    // Load email preferences
    loadEmailPreferences();
    
    // Load next scheduled times
    loadNextScheduledTimes();
  }, [currentUser?.uid]);

  const loadEmailPreferences = async () => {
    try {
      const prefs = await getEmailPreferences();
      if (prefs) {
        setEmailPreferences(prefs);
      } else {
        setEmailPreferences(getDefaultEmailPreferences());
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
      setEmailPreferences(getDefaultEmailPreferences());
    }
  };

  const loadNextScheduledTimes = async () => {
    try {
      const times = getNextScheduledTimes();
      setNextScheduledTimes(times);
    } catch (error) {
      console.error('Error loading scheduled times:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Weekly report functions
  const generateWeeklyReportForStudent = async (studentId) => {
    try {
      setLoading(true);
      setProgress(10);
      
      const startDate = weeklyDateRange.start.format('YYYY-MM-DD');
      const endDate = weeklyDateRange.end.format('YYYY-MM-DD');
      
      setProgress(30);
      const report = await generateWeeklyReport(studentId, startDate, endDate);
      
      setProgress(70);
      setWeeklyReportData(report);
      setProgress(100);
      
      setSuccessMessage('Weekly report generated successfully!');
      return report;
    } catch (error) {
      setError('Failed to generate weekly report: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const generateWeeklyReportForAll = async () => {
    try {
      setLoading(true);
      setProgress(10);
      
      const startDate = weeklyDateRange.start.format('YYYY-MM-DD');
      const endDate = weeklyDateRange.end.format('YYYY-MM-DD');
      
      setProgress(30);
      const reports = await generateBatchWeeklyReports(
        selectedStudentsForWeekly.map(s => s.id), 
        startDate, 
        endDate
      );
      
      setProgress(70);
      setProgress(100);
      
      setSuccessMessage(`Generated ${reports.length} weekly reports successfully!`);
      return reports;
    } catch (error) {
      setError('Failed to generate weekly reports: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Monthly report functions
  const generateMonthlyReportForStudent = async (studentId) => {
    try {
      setLoading(true);
      setProgress(10);
      
      setProgress(30);
      const report = await generateMonthlyReport(
        studentId, 
        monthlyPeriod.month, 
        monthlyPeriod.year
      );
      
      setProgress(70);
      setMonthlyReportData(report);
      setProgress(100);
      
      setSuccessMessage('Monthly report generated successfully!');
      return report;
    } catch (error) {
      setError('Failed to generate monthly report: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const generateMonthlyReportForAll = async () => {
    try {
      setLoading(true);
      setProgress(10);
      
      setProgress(30);
      const reports = await generateBatchMonthlyReports(
        selectedStudentsForMonthly.map(s => s.id), 
        monthlyPeriod.month, 
        monthlyPeriod.year
      );
      
      setProgress(70);
      setProgress(100);
      
      setSuccessMessage(`Generated ${reports.length} monthly reports successfully!`);
      return reports;
    } catch (error) {
      setError('Failed to generate monthly reports: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Sending functions
  const sendWeeklyReport = async (studentId) => {
    try {
      setLoading(true);
      setProgress(10);
      
      const startDate = weeklyDateRange.start.format('YYYY-MM-DD');
      const endDate = weeklyDateRange.end.format('YYYY-MM-DD');
      
      setProgress(30);
      const preferences = await getEmailPreferences();
      const result = await sendWeeklyUpdate(studentId, startDate, endDate, preferences);
      
      setProgress(70);
      setProgress(100);
      
      setSuccessMessage('Weekly report sent successfully!');
      return result;
    } catch (error) {
      setError('Failed to send weekly report: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const sendMonthlyReport = async (studentId) => {
    try {
      setLoading(true);
      setProgress(10);
      
      setProgress(30);
      const preferences = await getEmailPreferences();
      const result = await sendMonthlyUpdate(
        studentId, 
        monthlyPeriod.month, 
        monthlyPeriod.year, 
        preferences
      );
      
      setProgress(70);
      setProgress(100);
      
      setSuccessMessage('Monthly report sent successfully!');
      return result;
    } catch (error) {
      setError('Failed to send monthly report: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Preview functions
  const previewWeeklyReport = async (studentId) => {
    try {
      const report = await generateWeeklyReportForStudent(studentId);
      setPreviewData(report);
      setPreviewType('weekly');
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error previewing weekly report:', error);
    }
  };

  const previewMonthlyReport = async (studentId) => {
    try {
      const report = await generateMonthlyReportForStudent(studentId);
      setPreviewData(report);
      setPreviewType('monthly');
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error previewing monthly report:', error);
    }
  };

  // Scheduling functions
  const triggerWeeklyEmails = async () => {
    try {
      setLoading(true);
      setProgress(10);
      
      setProgress(30);
      const result = await manualTriggerWeeklyEmails();
      
      setProgress(70);
      setProgress(100);
      
      setSuccessMessage('Weekly emails triggered successfully!');
      return result;
    } catch (error) {
      setError('Failed to trigger weekly emails: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const triggerMonthlyEmails = async () => {
    try {
      setLoading(true);
      setProgress(10);
      
      setProgress(30);
      const result = await manualTriggerMonthlyEmails();
      
      setProgress(70);
      setProgress(100);
      
      setSuccessMessage('Monthly emails triggered successfully!');
      return result;
    } catch (error) {
      setError('Failed to trigger monthly emails: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccessMessage(null);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Periodic Report Manager
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Generate and send weekly and monthly progress reports to parents
      </Typography>

      {/* Progress Bar */}
      {loading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" color="textSecondary" align="center">
            {progress}% Complete
          </Typography>
        </Box>
      )}

      {/* Error and Success Messages */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" onClose={clearSuccess} sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Main Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Weekly Reports" icon={<EventNoteIcon />} />
          <Tab label="Monthly Reports" icon={<AnalyticsIcon />} />
          <Tab label="Email Preferences" icon={<EmailIcon />} />
          <Tab label="Scheduling" icon={<ScheduleIcon />} />
        </Tabs>
      </Box>

      {/* Weekly Reports Tab */}
      {activeTab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Report Configuration
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Week Start Date"
                      value={weeklyDateRange.start}
                      onChange={(newValue) => setWeeklyDateRange(prev => ({ ...prev, start: newValue }))}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Week End Date"
                      value={weeklyDateRange.end}
                      onChange={(newValue) => setWeeklyDateRange(prev => ({ ...prev, end: newValue }))}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Individual Student Report
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Student</InputLabel>
                    <Select
                      value={selectedStudentsForWeekly.length > 0 ? selectedStudentsForWeekly[0]?.id : ''}
                      onChange={(e) => {
                        const student = students.find(s => s.id === e.target.value);
                        setSelectedStudentsForWeekly(student ? [student] : []);
                      }}
                    >
                      {students.map((student) => (
                        <MenuItem key={student.id} value={student.id}>
                          {student.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={() => selectedStudentsForWeekly.length > 0 && previewWeeklyReport(selectedStudentsForWeekly[0].id)}
                    disabled={selectedStudentsForWeekly.length === 0 || loading}
                    sx={{ mr: 1 }}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => selectedStudentsForWeekly.length > 0 && sendWeeklyReport(selectedStudentsForWeekly[0].id)}
                    disabled={selectedStudentsForWeekly.length === 0 || loading}
                  >
                    Send Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Batch Reports
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Students</InputLabel>
                    <Select
                      multiple
                      value={selectedStudentsForWeekly.map(s => s.id)}
                      onChange={(e) => {
                        const selectedIds = e.target.value;
                        const selectedStudents = students.filter(s => selectedIds.includes(s.id));
                        setSelectedStudentsForWeekly(selectedStudents);
                      }}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const student = students.find(s => s.id === value);
                            return <Chip key={value} label={student?.name || value} />;
                          })}
                        </Box>
                      )}
                    >
                      {students.map((student) => (
                        <MenuItem key={student.id} value={student.id}>
                          {student.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={generateWeeklyReportForAll}
                    disabled={selectedStudentsForWeekly.length === 0 || loading}
                    sx={{ mr: 1 }}
                  >
                    Generate All
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={generateWeeklyReportForAll}
                    disabled={selectedStudentsForWeekly.length === 0 || loading}
                  >
                    Send All
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Monthly Reports Tab */}
      {activeTab === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Report Configuration
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={monthlyPeriod.month}
                      onChange={(e) => setMonthlyPeriod(prev => ({ ...prev, month: e.target.value }))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <MenuItem key={month} value={month}>
                          {new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Year"
                    type="number"
                    value={monthlyPeriod.year}
                    onChange={(e) => setMonthlyPeriod(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Individual Student Report
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Student</InputLabel>
                    <Select
                      value={selectedStudentsForMonthly.length > 0 ? selectedStudentsForMonthly[0]?.id : ''}
                      onChange={(e) => {
                        const student = students.find(s => s.id === e.target.value);
                        setSelectedStudentsForMonthly(student ? [student] : []);
                      }}
                    >
                      {students.map((student) => (
                        <MenuItem key={student.id} value={student.id}>
                          {student.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={() => selectedStudentsForMonthly.length > 0 && previewMonthlyReport(selectedStudentsForMonthly[0].id)}
                    disabled={selectedStudentsForMonthly.length === 0 || loading}
                    sx={{ mr: 1 }}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => selectedStudentsForMonthly.length > 0 && sendMonthlyReport(selectedStudentsForMonthly[0].id)}
                    disabled={selectedStudentsForMonthly.length === 0 || loading}
                  >
                    Send Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Batch Reports
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Students</InputLabel>
                    <Select
                      multiple
                      value={selectedStudentsForMonthly.map(s => s.id)}
                      onChange={(e) => {
                        const selectedIds = e.target.value;
                        const selectedStudents = students.filter(s => selectedIds.includes(s.id));
                        setSelectedStudentsForMonthly(selectedStudents);
                      }}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const student = students.find(s => s.id === value);
                            return <Chip key={value} label={student?.name || value} />;
                          })}
                        </Box>
                      )}
                    >
                      {students.map((student) => (
                        <MenuItem key={student.id} value={student.id}>
                          {student.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={generateMonthlyReportForAll}
                    disabled={selectedStudentsForMonthly.length === 0 || loading}
                    sx={{ mr: 1 }}
                  >
                    Generate All
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={generateMonthlyReportForAll}
                    disabled={selectedStudentsForMonthly.length === 0 || loading}
                  >
                    Send All
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Email Preferences Tab */}
      {activeTab === 2 && (
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Preferences
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Configure default email preferences for all students
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Email Frequency</InputLabel>
                    <Select
                      value={emailPreferences?.frequency || 'daily'}
                      onChange={(e) => setEmailPreferences(prev => ({ ...prev, frequency: e.target.value }))}
                    >
                      <MenuItem value="daily">Daily Only</MenuItem>
                      <MenuItem value="weekly">Weekly Only</MenuItem>
                      <MenuItem value="monthly">Monthly Only</MenuItem>
                      <MenuItem value="weekly+monthly">Weekly + Monthly</MenuItem>
                      <MenuItem value="all">All (Daily + Weekly + Monthly)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Detail Level</InputLabel>
                    <Select
                      value={emailPreferences?.detailLevel || 'balanced'}
                      onChange={(e) => setEmailPreferences(prev => ({ ...prev, detailLevel: e.target.value }))}
                    >
                      <MenuItem value="summary">Summary</MenuItem>
                      <MenuItem value="balanced">Balanced</MenuItem>
                      <MenuItem value="detailed">Detailed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Content Sections
                </Typography>
                <Grid container spacing={2}>
                  {emailPreferences && Object.entries(emailPreferences.contentSections || {}).map(([section, enabled]) => (
                    <Grid item xs={12} sm={6} md={4} key={section}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={enabled}
                            onChange={(e) => setEmailPreferences(prev => ({
                              ...prev,
                              contentSections: {
                                ...prev.contentSections,
                                [section]: e.target.checked
                              }
                            }))}
                          />
                        }
                        label={section.charAt(0).toUpperCase() + section.slice(1)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={async () => {
                    try {
                      await updateEmailPreferences(emailPreferences);
                      setSuccessMessage('Email preferences updated successfully!');
                    } catch (error) {
                      setError('Failed to update email preferences: ' + error.message);
                    }
                  }}
                >
                  Save Preferences
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Scheduling Tab */}
      {activeTab === 3 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Next Scheduled Times
                  </Typography>
                  {nextScheduledTimes && (
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        <strong>Next Weekly:</strong> {nextScheduledTimes.nextWeekly}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Next Monthly:</strong> {nextScheduledTimes.nextMonthly}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Current Time: {nextScheduledTimes.currentTime}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Manual Triggers
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Manually trigger email generation and sending
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<ScheduleIcon />}
                      onClick={triggerWeeklyEmails}
                      disabled={loading}
                      sx={{ mr: 1, mb: 1 }}
                      fullWidth
                    >
                      Trigger Weekly Emails
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<ScheduleIcon />}
                      onClick={triggerMonthlyEmails}
                      disabled={loading}
                      fullWidth
                    >
                      Trigger Monthly Emails
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Preview {previewType === 'weekly' ? 'Weekly' : 'Monthly'} Report
        </DialogTitle>
        <DialogContent>
          {previewData && (
            <Box sx={{ mt: 2 }}>
              {previewType === 'weekly' ? (
                <WeeklyTemplate
                  data={previewData.reportData}
                  startDate={previewData.weekStart}
                  endDate={previewData.weekEnd}
                />
              ) : (
                <MonthlyTemplate
                  data={previewData.reportData}
                  startDate={`${previewData.year}-${String(previewData.month).padStart(2, '0')}-01`}
                  endDate={`${previewData.year}-${String(previewData.month).padStart(2, '0')}-31`}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (previewType === 'weekly') {
                sendWeeklyReport(previewData.studentId);
              } else {
                sendMonthlyReport(previewData.studentId);
              }
              setPreviewDialogOpen(false);
            }}
          >
            Send Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PeriodicReportManager; 