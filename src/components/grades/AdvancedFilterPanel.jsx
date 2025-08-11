import React, { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  IconButton,
  Collapse,
  Grid,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { dataManager } from "../../utils/dataManagement";

const AdvancedFilterPanel = ({
  data,
  filters,
  onFiltersChange,
  onClearFilters,
  filterOptions = {},
  expanded = false,
  onToggleExpanded,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [localFilters, setLocalFilters] = useState(filters);
  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  // Generate filter options from data if not provided
  const availableFilterOptions = useMemo(() => {
    if (Object.keys(filterOptions).length > 0) {
      return filterOptions;
    }
    return dataManager.generateFilterOptions(data);
  }, [data, filterOptions]);

  // Current year and month for date filters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...localFilters,
      [filterType]: value,
    };

    // Remove empty filters
    if (!value || value === "") {
      delete newFilters[filterType];
    }

    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Handle search with debouncing
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    handleFilterChange("search", value);
  };

  // Handle month filter
  const handleMonthFilter = (year, month) => {
    const monthKey = `${year}-${month.toString().padStart(2, "0")}`;
    handleFilterChange("month", monthKey);
  };

  // Handle quarter filter
  const handleQuarterFilter = (year, quarter) => {
    const quarterKey = `${year}-${quarter}`;
    handleFilterChange("quarter", quarterKey);
  };

  // Handle semester filter
  const handleSemesterFilter = (year, semester) => {
    const semesterKey = `${year}-${semester}`;
    handleFilterChange("semester", semesterKey);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setLocalFilters({});
    setSearchTerm("");
    onClearFilters();
  };

  // Apply filters
  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  // Get active filter count
  const activeFilterCount = Object.keys(localFilters).length;

  // Generate year options (current year + 2 years back)
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // Generate month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  return (
    <Card sx={{ mb: 2, boxShadow: 2 }}>
      <CardContent sx={{ p: 2 }}>
        {/* Filter Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Advanced Filters
            </Typography>
            {activeFilterCount > 0 && (
              <Chip
                label={activeFilterCount}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            {activeFilterCount > 0 && (
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                variant="outlined"
                color="error"
              >
                Clear All
              </Button>
            )}
            <IconButton onClick={onToggleExpanded} size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Quick Search */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search assignments, students, subjects..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Box>

        {/* Expanded Filters */}
        <Collapse in={expanded}>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            {/* Subject Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Subject</InputLabel>
                <Select
                  value={localFilters.subject || ""}
                  onChange={(e) =>
                    handleFilterChange("subject", e.target.value)
                  }
                  label="Subject"
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {availableFilterOptions.subjects?.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Category Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={localFilters.category || ""}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {availableFilterOptions.categories?.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Grade Range Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Grade Range</InputLabel>
                <Select
                  value={localFilters.gradeRange || ""}
                  onChange={(e) =>
                    handleFilterChange("gradeRange", e.target.value)
                  }
                  label="Grade Range"
                >
                  <MenuItem value="">All Grades</MenuItem>
                  {availableFilterOptions.gradeRanges?.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Performance Level Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Performance Level</InputLabel>
                <Select
                  value={localFilters.performanceLevel || ""}
                  onChange={(e) =>
                    handleFilterChange("performanceLevel", e.target.value)
                  }
                  label="Performance Level"
                >
                  <MenuItem value="">All Levels</MenuItem>
                  {availableFilterOptions.performanceLevels?.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Month Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ mb: 1, display: "block" }}
                >
                  Filter by Month
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={localFilters.monthYear || currentYear}
                      onChange={(e) => {
                        const year = e.target.value;
                        const month = localFilters.monthMonth || currentMonth;
                        handleMonthFilter(year, month);
                      }}
                      displayEmpty
                    >
                      {yearOptions.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={localFilters.monthMonth || currentMonth}
                      onChange={(e) => {
                        const month = e.target.value;
                        const year = localFilters.monthYear || currentYear;
                        handleMonthFilter(year, month);
                      }}
                      displayEmpty
                    >
                      {monthOptions.map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Grid>

            {/* Quarter Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ mb: 1, display: "block" }}
                >
                  Filter by Quarter
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={localFilters.quarterYear || currentYear}
                      onChange={(e) => {
                        const year = e.target.value;
                        const quarter = localFilters.quarterQuarter || "Q1";
                        handleQuarterFilter(year, quarter);
                      }}
                      displayEmpty
                    >
                      {yearOptions.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={localFilters.quarterQuarter || "Q1"}
                      onChange={(e) => {
                        const quarter = e.target.value;
                        const year = localFilters.quarterYear || currentYear;
                        handleQuarterFilter(year, quarter);
                      }}
                      displayEmpty
                    >
                      <MenuItem value="Q1">Q1</MenuItem>
                      <MenuItem value="Q2">Q2</MenuItem>
                      <MenuItem value="Q3">Q3</MenuItem>
                      <MenuItem value="Q4">Q4</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Grid>

            {/* Semester Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ mb: 1, display: "block" }}
                >
                  Filter by Semester
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={localFilters.semesterYear || currentYear}
                      onChange={(e) => {
                        const year = e.target.value;
                        const semester =
                          localFilters.semesterSemester || "Fall";
                        handleSemesterFilter(year, semester);
                      }}
                      displayEmpty
                    >
                      {yearOptions.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={localFilters.semesterSemester || "Fall"}
                      onChange={(e) => {
                        const semester = e.target.value;
                        const year = localFilters.semesterYear || currentYear;
                        handleSemesterFilter(year, semester);
                      }}
                      displayEmpty
                    >
                      <MenuItem value="Fall">Fall</MenuItem>
                      <MenuItem value="Spring">Spring</MenuItem>
                      <MenuItem value="Summer">Summer</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Grid>

            {/* Date Range Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ mb: 1, display: "block" }}
                  >
                    Custom Date Range
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <DatePicker
                      label="Start Date"
                      value={localFilters.startDate || null}
                      onChange={(date) => handleFilterChange("startDate", date)}
                      slotProps={{
                        textField: {
                          size: "small",
                          sx: { minWidth: 120 },
                        },
                      }}
                    />
                    <DatePicker
                      label="End Date"
                      value={localFilters.endDate || null}
                      onChange={(date) => handleFilterChange("endDate", date)}
                      slotProps={{
                        textField: {
                          size: "small",
                          sx: { minWidth: 120 },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </LocalizationProvider>
            </Grid>
          </Grid>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ mb: 1, display: "block" }}
              >
                Active Filters:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {Object.entries(localFilters).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    size="small"
                    onDelete={() => handleFilterChange(key, "")}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AdvancedFilterPanel;
