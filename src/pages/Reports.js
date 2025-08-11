import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Divider,
  Tabs,
  Tab,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { Description as DescriptionIcon } from "@mui/icons-material";
import ReportHeader from "../components/reports/ReportHeader";
import ReportFilters from "../components/reports/ReportFilters";
import RecentReportsTable from "../components/reports/RecentReportsTable";
import DatasetTable from "../components/reports/DatasetTable";
import Charts from "../components/reports/Charts";
import ScheduleManager from "../components/reports/ScheduleManager";
import { useStudents } from "../contexts/StudentContext";
import { useGrades } from "../contexts/GradeContext";
import { useAttendance } from "../contexts/AttendanceContext";
import { useBehavior } from "../contexts/BehaviorContext";
import { useAuth } from "../contexts/AuthContext";
import dayjs from "dayjs";
import useReportDatasets from "../components/reports/useReportDatasets";
import { downloadCSV } from "../components/reports/csvUtils";
import { buildPrintHtml, printHtml } from "../components/reports/printUtils";

const Reports = () => {
  const { students } = useStudents();
  const { grades } = useGrades();
  const { attendance } = useAttendance();
  const { behavior } = useBehavior();
  const { currentUser } = useAuth();

  // Tabs: student | class | academic
  const [activeTab, setActiveTab] = useState("student");

  // Filters
  const [filters, setFilters] = useState({
    startDate: "2025-08-01",
    endDate: new Date().toISOString().split("T")[0],
    studentId: "",
    subject: "",
    classGroup: "",
  });

  // Recent generated reports (mock in-memory for now)
  const [recentReports, setRecentReports] = useState([
    {
      id: "rpt-001",
      name: "Class Performance Summary",
      type: "Class",
      createdAt: new Date().toISOString(),
      status: "Ready",
      format: "PDF",
    },
  ]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleTabChange = (_e, value) => setActiveTab(value);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      studentId: "",
      subject: "",
      classGroup: "",
    });
  };

  const handleGenerateReport = () => {
    const timestamp = new Date().toISOString();
    const nameMap = {
      student: "Individual Student Progress Report",
      class: "Class Performance Summary",
      academic: "Grade Distribution Report",
    };
    const newReport = {
      id: `rpt-${Date.now()}`,
      name: nameMap[activeTab],
      type: activeTab.charAt(0).toUpperCase() + activeTab.slice(1),
      createdAt: timestamp,
      status: "Ready",
      format: "PDF",
      filters,
    };
    setRecentReports((prev) => [newReport, ...prev]);
    setSnackbar({
      open: true,
      message: "Report generated",
      severity: "success",
    });
  };

  const handleDownload = (reportId) => {
    const report = recentReports.find((r) => r.id === reportId);
    if (!report) return;
    // Placeholder download flow
    setSnackbar({
      open: true,
      message: `Downloading: ${report.name}`,
      severity: "info",
    });
  };

  const stats = useMemo(() => {
    return {
      students: students?.length || 0,
      grades: grades?.length || 0,
      attendance: attendance?.length || 0,
      behavior: behavior?.length || 0,
    };
  }, [students, grades, attendance, behavior]);

  const {
    filteredGrades,
    studentProgressData,
    classPerformanceData,
    academicDistributionData,
    currentDataset,
  } = useReportDatasets({ activeTab, filters, grades });

  const handleDownloadCSV = () => {
    const filenameBase =
      activeTab === "student"
        ? "student_progress"
        : activeTab === "class"
        ? "class_performance"
        : "grade_distribution";
    downloadCSV(currentDataset, filenameBase);
  };

  const handlePrint = () => {
    // Titles and headers
    const title =
      activeTab === "student"
        ? "Student Progress"
        : activeTab === "class"
        ? "Class Performance"
        : "Grade Distribution";
    const headers =
      currentDataset.length > 0 ? Object.keys(currentDataset[0]) : [];
    const studentObj = students.find((s) => s.id === filters.studentId);
    const studentName = filters.studentId
      ? studentObj
        ? `${studentObj.firstName} ${studentObj.lastName}`
        : filters.studentId
      : "All Students";
    const teacherName =
      currentUser?.displayName ||
      (currentUser?.email ? currentUser.email.split("@")[0] : "Teacher");
    const uniqueSubjects = Array.from(
      new Set(
        (currentDataset.length ? filteredGrades : grades)
          .map((g) => g.subject)
          .filter(Boolean)
      )
    );
    const className = filters.subject
      ? filters.subject
      : uniqueSubjects.length === 0
      ? "All Subjects"
      : uniqueSubjects.length === 1
      ? uniqueSubjects[0]
      : "Multiple Subjects";
    const fmt = (d) => (d ? dayjs(d).format("MMM DD, YYYY") : "");
    const periodLabel =
      filters.startDate && filters.endDate
        ? `${fmt(filters.startDate)} – ${fmt(filters.endDate)}`
        : filters.startDate
        ? `From ${fmt(filters.startDate)}`
        : filters.endDate
        ? `Through ${fmt(filters.endDate)}`
        : "All Time";
    const tableRows = currentDataset
      .map(
        (row) =>
          `<tr>${headers
            .map(
              (h) =>
                `<td style='padding:6px;border:1px solid #ddd'>${row[h]}</td>`
            )
            .join("")}</tr>`
      )
      .join("");
    const schoolName = "AMLY - The American Libyan School";
    const logoSrc = "/images/schoolLogo.PNG";
    const html = buildPrintHtml({
      schoolName,
      logoSrc,
      title,
      meta: { studentName, teacherName, className, periodLabel },
      headers,
      rowsHtml: tableRows,
    });
    printHtml(html);
  };

  const tabLabel = (value, label) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <DescriptionIcon fontSize="small" />
      {label}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <ReportHeader
        title="Reports"
        onClearFilters={handleClearFilters}
        onDownloadCSV={handleDownloadCSV}
        onPrint={handlePrint}
        onGenerateReport={handleGenerateReport}
        datasetEmpty={currentDataset.length === 0}
      />

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="student" label={tabLabel("student", "Student Reports")} />
          <Tab value="class" label={tabLabel("class", "Class Reports")} />
          <Tab value="academic" label={tabLabel("academic", "Academic Reports")} />
          <Tab value="schedule" label={tabLabel("schedule", "Schedule Manager")} />
        </Tabs>
      </Paper>

      {activeTab !== 'schedule' && (
        <ReportFilters
          activeTab={activeTab}
          filters={filters}
          students={students}
          onChange={handleFilterChange}
        />
      )}

      {activeTab === 'schedule' ? (
        <ScheduleManager />
      ) : (
        <>
          {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary">
                {stats.students}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                {stats.grades}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Grades
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="warning.main">
                {stats.attendance}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Attendance Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="error.main">
                {stats.behavior}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Behavior Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DatasetTable
        title={
          activeTab === "student"
            ? "Student Report"
            : activeTab === "class"
            ? "Class Report"
            : "Academic Report"
        }
        rows={currentDataset}
      />

      <Charts activeTab={activeTab} dataset={currentDataset} />

      <RecentReportsTable
        reports={recentReports}
        onRefresh={() =>
          setSnackbar({ open: true, message: "Refreshed", severity: "info" })
        }
        onDownload={(id) => handleDownload(id)}
      />
      </>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Reports;
