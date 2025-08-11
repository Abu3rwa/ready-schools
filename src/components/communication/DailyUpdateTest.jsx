import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Divider,
} from "@mui/material";
import {
  Send as SendIcon,
  Preview as PreviewIcon,
  Test as TestIcon,
} from "@mui/icons-material";
import { useEmail } from "../../contexts/EmailContext";
import { useStudents } from "../../contexts/StudentContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import { useAssignments } from "../../contexts/AssignmentContext";
import { useGrades } from "../../contexts/GradeContext";
import { useBehavior } from "../../contexts/BehaviorContext";

const DailyUpdateTest = () => {
  const [testResult, setTestResult] = useState(null);
  const { previewDailyUpdates, sendDailyUpdates } = useEmail();

  // Get all context data
  const { students } = useStudents();
  const { attendance } = useAttendance();
  const { assignments } = useAssignments();
  const { grades } = useGrades();
  const { behavior } = useBehavior();

  const contexts = {
    students: students || [],
    attendance: attendance || [],
    assignments: assignments || [],
    grades: grades || [],
    behavior: behavior || [],
  };

  const runTest = async (testType) => {
    setTestResult({
      type: testType,
      status: "running",
      message: "Running test...",
    });

    try {
      if (testType === "preview") {
        const result = await previewDailyUpdates(contexts, new Date());
        setTestResult({
          type: testType,
          status: result.success ? "success" : "error",
          message: result.success
            ? `Preview generated successfully! Found ${
                result.data?.dailyUpdates?.length || 0
              } students.`
            : `Preview failed: ${result.error}`,
          data: result.data,
        });
      } else if (testType === "send") {
        const result = await sendDailyUpdates(contexts, new Date());
        setTestResult({
          type: testType,
          status: result.success ? "success" : "error",
          message: result.success
            ? `Emails sent successfully! ${
                result.data?.emailsSent || 0
              } emails sent.`
            : `Sending failed: ${result.error}`,
          data: result.data,
        });
      }
    } catch (error) {
      setTestResult({
        type: testType,
        status: "error",
        message: `Test failed: ${error.message}`,
        error: error,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "success";
      case "error":
        return "error";
      case "running":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Daily Update System Test
        </Typography>

        <Typography variant="body2" color="textSecondary" paragraph>
          Test the daily update email system with current data.
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Data Summary */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Current Data Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Students: {students?.length || 0}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Attendance Records: {attendance?.length || 0}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Assignments: {assignments?.length || 0}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Grades: {grades?.length || 0}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Test Buttons */}
        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => runTest("preview")}
            disabled={testResult?.status === "running"}
          >
            Test Preview
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            onClick={() => runTest("send")}
            disabled={testResult?.status === "running"}
          >
            Test Send (Real Emails)
          </Button>
        </Box>

        {/* Test Results */}
        {testResult && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Test Results
            </Typography>
            <Alert severity={getStatusColor(testResult.status)}>
              <Typography variant="body2">
                <strong>{testResult.type.toUpperCase()} Test:</strong>{" "}
                {testResult.message}
              </Typography>
            </Alert>

            {testResult.data && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Test Data:
                </Typography>
                <pre
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: "10px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    overflow: "auto",
                    maxHeight: "200px",
                  }}
                >
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </Box>
            )}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="textSecondary">
          <strong>Note:</strong> The "Test Send" button will send real emails to
          parent addresses. Make sure you have proper email configuration set
          up.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DailyUpdateTest;
