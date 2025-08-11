import { useMemo } from "react";
import dayjs from "dayjs";

const getGradePercent = (g) => {
  if (typeof g?.percentage === "number") return g.percentage;
  if (
    typeof g?.score === "number" &&
    typeof g?.points === "number" &&
    g.points > 0
  ) {
    return (g.score / g.points) * 100;
  }
  return NaN;
};

const getLetter = (pct) => {
  if (isNaN(pct)) return "N/A";
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
};

export function useReportDatasets({ activeTab, filters, grades }) {
  const withinRange = (iso) => {
    if (!iso) return false;
    const d = dayjs(iso);
    const hasStart = !!filters.startDate;
    const hasEnd = !!filters.endDate;
    if (!hasStart && !hasEnd) return true;
    if (hasStart && hasEnd) {
      return (
        d.isAfter(dayjs(filters.startDate).subtract(1, "day")) &&
        d.isBefore(dayjs(filters.endDate).add(1, "day"))
      );
    }
    if (hasStart) return d.isAfter(dayjs(filters.startDate).subtract(1, "day"));
    if (hasEnd) return d.isBefore(dayjs(filters.endDate).add(1, "day"));
    return true;
  };

  const filteredGrades = useMemo(() => {
    if (!Array.isArray(grades)) return [];
    return grades.filter((g) => {
      const dateIso = g.dateEntered || g.dueDate || g.createdAt;
      if (!withinRange(dateIso)) return false;
      if (filters.studentId && g.studentId !== filters.studentId) return false;
      if (filters.subject) {
        if (filters.subject === "Both") {
          if (!(g.subject === "English" || g.subject === "Social Studies"))
            return false;
        } else {
          if (g.subject !== filters.subject) return false;
        }
      }
      return true;
    });
  }, [
    grades,
    filters.startDate,
    filters.endDate,
    filters.studentId,
    filters.subject,
  ]);

  const studentProgressData = useMemo(() => {
    if (activeTab !== "student") return [];
    if (!filters.studentId) return [];

    // Build rows without the Subject column, with Date at the end, and '%' label
    const withSubject = filteredGrades
      .filter((g) => g.studentId === filters.studentId)
      .map((g) => {
        const pct = getGradePercent(g);
        const dateIso = g.dateEntered || g.dueDate || g.createdAt;
        const subject = g.subject || "General";
        const row = {
          Assessment:
            g.assignmentName || g.name || g.assignment || "Assessment",
          Category: g.category || "",
          Score: typeof g.score === "number" ? g.score : "",
          Points: typeof g.points === "number" ? g.points : "",
          "%": isNaN(pct) ? "" : pct.toFixed(1),
          Date: dateIso ? dayjs(dateIso).format("MM-YYYY") : "",
        };
        return { subject, row };
      });

    const bySubject = new Map();
    withSubject.forEach(({ subject, row }) => {
      const list = bySubject.get(subject) || [];
      list.push(row);
      bySubject.set(subject, list);
    });

    const result = [];
    bySubject.forEach((list) => {
      result.push(...list);
      const valid = list
        .map((r) => parseFloat(r["%"]))
        .filter((n) => !isNaN(n));
      const avg = valid.length
        ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1)
        : "N/A";
      result.push({
        Assessment: "Average",
        Category: "",
        Score: "",
        Points: "",
        "%": avg,
        Date: "",
      });
    });

    return result;
  }, [activeTab, filters.studentId, filteredGrades]);

  const classPerformanceData = useMemo(() => {
    if (activeTab !== "class") return [];
    const rowsBySubject = {};
    filteredGrades.forEach((g) => {
      const subject = g.subject || "General";
      const pct = getGradePercent(g);
      if (!rowsBySubject[subject])
        rowsBySubject[subject] = { subject, count: 0, sum: 0 };
      if (!isNaN(pct)) {
        rowsBySubject[subject].count += 1;
        rowsBySubject[subject].sum += pct;
      }
    });
    return Object.values(rowsBySubject).map((r) => ({
      Subject: r.subject,
      Assessments: r.count,
      Average: r.count > 0 ? (r.sum / r.count).toFixed(1) : "N/A",
    }));
  }, [activeTab, filteredGrades]);

  const academicDistributionData = useMemo(() => {
    if (activeTab !== "academic") return [];
    const buckets = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    filteredGrades.forEach((g) => {
      const pct = getGradePercent(g);
      const letter = getLetter(pct);
      if (buckets[letter] !== undefined) buckets[letter] += 1;
    });
    return Object.entries(buckets).map(([Letter, Count]) => ({
      Letter,
      Count,
    }));
  }, [activeTab, filteredGrades]);

  const currentDataset = useMemo(() => {
    if (activeTab === "student") return studentProgressData;
    if (activeTab === "class") return classPerformanceData;
    return academicDistributionData;
  }, [
    activeTab,
    studentProgressData,
    classPerformanceData,
    academicDistributionData,
  ]);

  return {
    filteredGrades,
    studentProgressData,
    classPerformanceData,
    academicDistributionData,
    currentDataset,
  };
}

export default useReportDatasets;
