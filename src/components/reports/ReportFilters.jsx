import React from "react";
import {
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const ReportFilters = ({ activeTab, filters, students, onChange }) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        {activeTab === "student" && (
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Student</InputLabel>
              <Select
                value={filters.studentId}
                label="Student"
                onChange={(e) => onChange("studentId", e.target.value)}
              >
                <MenuItem value="">All Students</MenuItem>
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Subject(s)</InputLabel>
            <Select
              value={filters.subject}
              label="Subject(s)"
              onChange={(e) => onChange("subject", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="English">English</MenuItem>
              <MenuItem value="Social Studies">Social Studies</MenuItem>
              <MenuItem value="Both">Both (English & Social Studies)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Format</InputLabel>
            <Select value={"PDF"} label="Format" readOnly>
              <MenuItem value="PDF">PDF</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ReportFilters;
