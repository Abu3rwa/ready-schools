import { debounce, throttle, groupBy, orderBy, filter } from "lodash";
import dayjs from "dayjs";

// Advanced Data Management Utilities
export class DataManager {
  constructor() {
    this.cache = new Map();
    this.filterCache = new Map();
  }

  // Pagination utilities
  paginateData(data, page = 1, pageSize = 20) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      data: data.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: data.length,
        totalPages: Math.ceil(data.length / pageSize),
        hasNextPage: endIndex < data.length,
        hasPrevPage: page > 1,
      },
    };
  }

  // Advanced filtering system
  filterData(data, filters) {
    const cacheKey = JSON.stringify(filters);

    // Check cache first
    if (this.filterCache.has(cacheKey)) {
      return this.filterCache.get(cacheKey);
    }

    let filteredData = [...data];

    // Apply each filter
    Object.entries(filters).forEach(([filterType, filterValue]) => {
      if (filterValue && filterValue !== "") {
        filteredData = this.applyFilter(filteredData, filterType, filterValue);
      }
    });

    // Cache the result
    this.filterCache.set(cacheKey, filteredData);

    return filteredData;
  }

  // Apply specific filter
  applyFilter(data, filterType, filterValue) {
    switch (filterType) {
      case "search":
        return this.applySearchFilter(data, filterValue);
      case "dateRange":
        return this.applyDateRangeFilter(data, filterValue);
      case "subject":
        return data.filter((item) => item.subject === filterValue);
      case "category":
        return data.filter((item) => item.category === filterValue);
      case "gradeRange":
        return this.applyGradeRangeFilter(data, filterValue);
      case "student":
        return data.filter((item) => item.studentId === filterValue);
      case "assignment":
        return data.filter((item) => item.assignmentId === filterValue);
      case "quarter":
        return data.filter((item) => item.quarter === filterValue);
      case "semester":
        return data.filter((item) => item.semester === filterValue);
      case "performanceLevel":
        return this.applyPerformanceFilter(data, filterValue);
      default:
        return data;
    }
  }

  // Search filter with fuzzy matching
  applySearchFilter(data, searchTerm) {
    if (!searchTerm) return data;

    const term = searchTerm.toLowerCase();
    return data.filter((item) => {
      return (
        (item.assignmentName &&
          item.assignmentName.toLowerCase().includes(term)) ||
        (item.studentName && item.studentName.toLowerCase().includes(term)) ||
        (item.subject && item.subject.toLowerCase().includes(term)) ||
        (item.category && item.category.toLowerCase().includes(term)) ||
        (item.notes && item.notes.toLowerCase().includes(term))
      );
    });
  }

  // Date range filter
  applyDateRangeFilter(data, dateRange) {
    if (!dateRange.startDate || !dateRange.endDate) return data;

    const start = dayjs(dateRange.startDate).toDate();
    const end = dayjs(dateRange.endDate).toDate();

    return data.filter((item) => {
      const itemDate = dayjs(item.dateEntered).toDate();
      return dayjs(itemDate).isBetween(start, end, "day", "[]");
    });
  }

  // Grade range filter
  applyGradeRangeFilter(data, gradeRange) {
    const ranges = {
      A: { min: 90, max: 100 },
      B: { min: 80, max: 89 },
      C: { min: 70, max: 79 },
      D: { min: 60, max: 69 },
      F: { min: 0, max: 59 },
    };

    const range = ranges[gradeRange];
    if (!range) return data;

    return data.filter((item) => {
      const percentage = item.percentage || (item.score / item.points) * 100;
      return percentage >= range.min && percentage <= range.max;
    });
  }

  // Performance level filter
  applyPerformanceFilter(data, performanceLevel) {
    const levels = {
      Excellent: { min: 90, max: 100 },
      "Above Average": { min: 80, max: 89 },
      Average: { min: 70, max: 79 },
      "Below Average": { min: 60, max: 69 },
      "Needs Improvement": { min: 0, max: 59 },
    };

    const level = levels[performanceLevel];
    if (!level) return data;

    return data.filter((item) => {
      const percentage = item.percentage || (item.score / item.points) * 100;
      return percentage >= level.min && percentage <= level.max;
    });
  }

  // Sort data
  sortData(data, sortBy, sortOrder = "asc") {
    return orderBy(data, [sortBy], [sortOrder]);
  }

  // Group data by field
  groupData(data, groupByField) {
    return groupBy(data, groupByField);
  }

  // Get unique values for filter options
  getUniqueValues(data, field) {
    const values = [
      ...new Set(data.map((item) => item[field]).filter(Boolean)),
    ];
    return values.sort();
  }

  // Generate filter options
  generateFilterOptions(data) {
    return {
      subjects: this.getUniqueValues(data, "subject"),
      categories: this.getUniqueValues(data, "category"),
      quarters: this.getUniqueValues(data, "quarter"),
      semesters: this.getUniqueValues(data, "semester"),
      students: this.getUniqueValues(data, "studentId"),
      assignments: this.getUniqueValues(data, "assignmentId"),
      gradeRanges: ["A", "B", "C", "D", "F"],
      performanceLevels: [
        "Excellent",
        "Above Average",
        "Average",
        "Below Average",
        "Needs Improvement",
      ],
    };
  }

  // Month-based filtering (as requested)
  filterByMonth(data, year, month) {
    const start = dayjs(`${year}-${month}-01`).toDate();
    const end = dayjs(`${year}-${month}-01`).endOf("month").toDate();

    return data.filter((item) => {
      const itemDate = dayjs(item.dateEntered).toDate();
      return dayjs(itemDate).isBetween(start, end, "day", "[]");
    });
  }

  // Quarter-based filtering
  filterByQuarter(data, year, quarter) {
    const quarterMonths = {
      Q1: [8, 9, 10], // August, September, October
      Q2: [11, 0, 1], // November, December, January
      Q3: [2, 3, 4], // February, March, April
      Q4: [5, 6, 7], // May, June, July
    };

    const months = quarterMonths[quarter];
    if (!months) return data;

    return data.filter((item) => {
      const itemDate = dayjs(item.dateEntered).toDate();
      const itemYear = itemDate.getFullYear();
      const itemMonth = itemDate.getMonth();

      // Handle year boundary for Q2
      if (quarter === "Q2") {
        return (
          (itemYear === year && itemMonth === 11) ||
          (itemYear === year + 1 && (itemMonth === 0 || itemMonth === 1))
        );
      }

      return itemYear === year && months.includes(itemMonth);
    });
  }

  // Semester-based filtering
  filterBySemester(data, year, semester) {
    const semesterMonths = {
      Fall: [8, 9, 10, 11, 0], // August to December
      Spring: [1, 2, 3, 4], // January to April
      Summer: [5, 6, 7], // May to July
    };

    const months = semesterMonths[semester];
    if (!months) return data;

    return data.filter((item) => {
      const itemDate = dayjs(item.dateEntered).toDate();
      const itemYear = itemDate.getFullYear();
      const itemMonth = itemDate.getMonth();

      // Handle year boundary for Fall semester
      if (semester === "Fall") {
        return (
          (itemYear === year && itemMonth >= 8) ||
          (itemYear === year + 1 && itemMonth === 0)
        );
      }

      return itemYear === year && months.includes(itemMonth);
    });
  }

  // Debounced search function
  debouncedSearch = debounce((searchTerm, data, callback) => {
    const results = this.applySearchFilter(data, searchTerm);
    callback(results);
  }, 300);

  // Throttled filter function
  throttledFilter = throttle((filters, data, callback) => {
    const results = this.filterData(data, filters);
    callback(results);
  }, 200);

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.filterCache.clear();
  }

  // Get cached data
  getCachedData(key) {
    return this.cache.get(key);
  }

  // Set cached data
  setCachedData(key, data, ttl = 5 * 60 * 1000) {
    // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // Check if cached data is valid
  isCachedDataValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;

    return Date.now() - cached.timestamp < cached.ttl;
  }

  // Export filtered data
  exportFilteredData(data, format = "json") {
    switch (format) {
      case "json":
        return JSON.stringify(data, null, 2);
      case "csv":
        return this.convertToCSV(data);
      case "excel":
        return this.convertToExcel(data);
      default:
        return data;
    }
  }

  // Convert to CSV
  convertToCSV(data) {
    if (!data || data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    data.forEach((item) => {
      const values = headers.map((header) => {
        const value = item[header];
        return typeof value === "string" ? `"${value}"` : value;
      });
      csvRows.push(values.join(","));
    });

    return csvRows.join("\n");
  }

  // Convert to Excel (placeholder - would need xlsx library)
  convertToExcel(data) {
    // This would require the xlsx library
    // For now, return CSV format
    return this.convertToCSV(data);
  }

  // Generate summary statistics
  generateSummaryStats(data) {
    if (!data || data.length === 0) {
      return {
        totalItems: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        completionRate: 0,
      };
    }

    const scores = data.map(
      (item) => item.percentage || (item.score / item.points) * 100
    );
    const validScores = scores.filter((score) => !isNaN(score));

    return {
      totalItems: data.length,
      averageScore:
        validScores.length > 0
          ? validScores.reduce((a, b) => a + b, 0) / validScores.length
          : 0,
      highestScore: validScores.length > 0 ? Math.max(...validScores) : 0,
      lowestScore: validScores.length > 0 ? Math.min(...validScores) : 0,
      completionRate: (validScores.length / data.length) * 100,
    };
  }
}

// Export singleton instance
export const dataManager = new DataManager();

// Export individual functions for backward compatibility
export const paginateData = (data, page, pageSize) =>
  dataManager.paginateData(data, page, pageSize);
export const filterData = (data, filters) =>
  dataManager.filterData(data, filters);
export const sortData = (data, sortBy, sortOrder) =>
  dataManager.sortData(data, sortBy, sortOrder);
export const filterByMonth = (data, year, month) =>
  dataManager.filterByMonth(data, year, month);
export const filterByQuarter = (data, year, quarter) =>
  dataManager.filterByQuarter(data, year, quarter);
export const filterBySemester = (data, year, semester) =>
  dataManager.filterBySemester(data, year, semester);
