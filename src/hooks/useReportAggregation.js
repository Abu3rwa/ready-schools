import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGrade } from "../contexts/GradeContext";
import { useAttendance } from "../contexts/AttendanceContext";
import { useBehavior } from "../contexts/BehaviorContext";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

export const useReportAggregation = (studentId, startDate, endDate) => {
  const { grades } = useGrade();
  const { attendanceRecords } = useAttendance();
  const { behaviorRecords } = useBehavior();
  const { currentUser } = useAuth();

  const [dailyData, setDailyData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);

  // Daily snapshot calculation
  const getDailySnapshot = useMemo(() => {
    if (!studentId || !startDate) return null;

    const targetDate = dayjs(startDate);

    const attendance = attendanceRecords.find(
      (record) =>
        record.studentId === studentId &&
        dayjs(record.date).isSame(targetDate, "day")
    ) || { status: "unknown" };

    const behavior = {
      incidents: behaviorRecords.filter(
        (record) =>
          record.studentId === studentId &&
          dayjs(record.date).isSame(targetDate, "day")
      ),
    };

    const todaysGrades = grades.filter(
      (grade) =>
        grade.studentId === studentId &&
        dayjs(grade.date).isSame(targetDate, "day")
    );

    const homework = [
      { subject: "Math", completed: Math.random() > 0.3 },
      { subject: "English", completed: Math.random() > 0.3 },
      { subject: "Science", completed: Math.random() > 0.3 },
    ];

    return {
      attendance,
      behavior,
      grades: {
        new: todaysGrades.map((grade) => ({
          subject: grade.subject,
          title: grade.title,
          score: grade.score,
          total: grade.total,
          percentage: Math.round((grade.score / grade.total) * 100),
        })),
      },
      homework,
    };
  }, [studentId, startDate, grades, attendanceRecords, behaviorRecords]);

  // Weekly data calculation
  const getWeeklySnapshot = useMemo(() => {
    if (!studentId || !startDate || !endDate) return null;

    const start = dayjs(startDate);
    const end = dayjs(endDate);

    // Get grades within date range
    const periodGrades = grades.filter(
      (grade) =>
        grade.studentId === studentId &&
        dayjs(grade.date).isBetween(start, end, "day", "[]")
    );

    // Calculate academic progress
    const academicProgress = Object.values(
      periodGrades.reduce((acc, grade) => {
        if (!acc[grade.subject]) {
          acc[grade.subject] = {
            name: grade.subject,
            completedAssignments: 0,
            totalAssignments: 0,
            totalScore: 0,
          };
        }
        acc[grade.subject].completedAssignments++;
        acc[grade.subject].totalAssignments++;
        acc[grade.subject].totalScore += (grade.score / grade.total) * 100;
        return acc;
      }, {})
    ).map((subject) => ({
      ...subject,
      averageScore: Math.round(
        subject.totalScore / subject.completedAssignments
      ),
    }));

    // Calculate attendance summary
    const attendanceSummary = attendanceRecords
      .filter(
        (record) =>
          record.studentId === studentId &&
          dayjs(record.date).isBetween(start, end, "day", "[]")
      )
      .reduce(
        (acc, record) => {
          acc[record.status]++;
          return acc;
        },
        { present: 0, late: 0, absent: 0 }
      );

    // Calculate behavior summary
    const behaviorSummary = {
      incidents: Object.entries(
        behaviorRecords
          .filter(
            (record) =>
              record.studentId === studentId &&
              dayjs(record.date).isBetween(start, end, "day", "[]")
          )
          .reduce((acc, record) => {
            acc[record.type] = (acc[record.type] || 0) + 1;
            return acc;
          }, {})
      ).map(([type, count]) => ({ type, count })),
    };

    // Mock upcoming assessments
    const upcomingAssessments = [
      {
        subject: "Math",
        title: "Unit Test",
        dueDate: dayjs(endDate).add(2, "day").toISOString(),
        type: "Test",
      },
      {
        subject: "English",
        title: "Essay",
        dueDate: dayjs(endDate).add(3, "day").toISOString(),
        type: "Assignment",
      },
    ];

    // Calculate weekly grade changes
    const weeklyGradeChanges = academicProgress.map((subject) => ({
      subject: subject.name,
      previousWeek: Math.round(Math.random() * 20 + 60), // Mock data
      currentWeek: subject.averageScore,
    }));

    return {
      academicProgress,
      attendanceSummary,
      behaviorSummary,
      upcomingAssessments,
      weeklyGradeChanges,
    };
  }, [
    studentId,
    startDate,
    endDate,
    grades,
    attendanceRecords,
    behaviorRecords,
  ]);

  // Monthly data calculation
  const getMonthlySnapshot = useMemo(() => {
    if (!studentId || !startDate || !endDate) return null;

    const start = dayjs(startDate);
    const end = dayjs(endDate);

    // Calculate grade distribution
    const gradeDistribution = ["90-100", "80-89", "70-79", "60-69", "0-59"].map(
      (range) => {
        const [min, max] = range.split("-").map(Number);
        const count = grades.filter(
          (grade) =>
            grade.studentId === studentId &&
            dayjs(grade.date).isBetween(start, end, "day", "[]") &&
            (grade.score / grade.total) * 100 >= min &&
            (grade.score / grade.total) * 100 <= max
        ).length;
        return { range, count };
      }
    );

    // Calculate attendance patterns
    const attendancePatterns = Array.from({
      length: end.diff(start, "day") + 1,
    })
      .map((_, i) => start.add(i, "day"))
      .map((date) => {
        const record = attendanceRecords.find(
          (r) => r.studentId === studentId && dayjs(r.date).isSame(date, "day")
        );
        return {
          date: date.toISOString(),
          status: record ? record.status : "absent",
        };
      });

    // Calculate behavior patterns
    const behaviorPatterns = Object.entries(
      behaviorRecords
        .filter(
          (record) =>
            record.studentId === studentId &&
            dayjs(record.date).isBetween(start, end, "day", "[]")
        )
        .reduce((acc, record) => {
          if (!acc[record.type]) {
            acc[record.type] = {
              category: record.type,
              count: 0,
              trend: "stable",
            };
          }
          acc[record.type].count++;
          return acc;
        }, {})
    ).map(([_, value]) => value);

    // Mock teacher comments
    const teacherComments = [
      {
        subject: "Math",
        content:
          "Shows strong problem-solving skills but needs to work on showing work steps.",
      },
      {
        subject: "English",
        content:
          "Excellent participation in class discussions. Writing has improved significantly.",
      },
    ];

    // Calculate monthly progress
    const monthlyProgress = Object.values(
      grades
        .filter(
          (grade) =>
            grade.studentId === studentId &&
            dayjs(grade.date).isBetween(start, end, "day", "[]")
        )
        .reduce((acc, grade) => {
          if (!acc[grade.subject]) {
            acc[grade.subject] = {
              name: grade.subject,
              currentGrade: 0,
              previousGrade: 0,
              totalScore: 0,
              count: 0,
            };
          }
          acc[grade.subject].totalScore += (grade.score / grade.total) * 100;
          acc[grade.subject].count++;
          return acc;
        }, {})
    ).map((subject) => ({
      name: subject.name,
      currentGrade: Math.round(subject.totalScore / subject.count),
      previousGrade: Math.round(Math.random() * 20 + 60), // Mock data
      change: Math.round(
        subject.totalScore / subject.count - Math.round(Math.random() * 20 + 60)
      ),
    }));

    // Mock goals and recommendations
    const goals = [
      {
        area: "Mathematics",
        currentStatus: "Strong in algebra, needs improvement in geometry",
        recommendation:
          "Focus on geometric proofs and spatial reasoning exercises",
      },
      {
        area: "English Language Arts",
        currentStatus: "Excellent comprehension, average writing skills",
        recommendation: "Practice essay structure and vocabulary enhancement",
      },
    ];

    return {
      gradeDistribution,
      attendancePatterns,
      behaviorPatterns,
      teacherComments,
      monthlyProgress,
      goals,
    };
  }, [
    studentId,
    startDate,
    endDate,
    grades,
    attendanceRecords,
    behaviorRecords,
  ]);

  useEffect(() => {
    if (getDailySnapshot) setDailyData(getDailySnapshot);
    if (getWeeklySnapshot) setWeeklyData(getWeeklySnapshot);
    if (getMonthlySnapshot) setMonthlyData(getMonthlySnapshot);
  }, [getDailySnapshot, getWeeklySnapshot, getMonthlySnapshot]);

  return {
    dailyData,
    weeklyData,
    monthlyData,
  };
};

export default useReportAggregation;
