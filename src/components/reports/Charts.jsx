import React, { useMemo } from "react";
import { Paper, Typography, Divider, Box, Grid } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const palette = [
  "#3f51b5", // indigo
  "#e91e63", // pink
  "#009688", // teal
  "#ff9800", // orange
  "#9c27b0", // purple
  "#03a9f4", // light blue
  "#8bc34a", // light green
  "#f44336", // red
];

const Charts = ({ activeTab, dataset }) => {
  const headers = dataset.length > 0 ? Object.keys(dataset[0]) : [];

  // Build simplified bar chart: use '%' if present, otherwise 'Score'.
  const chartData = useMemo(() => {
    if (dataset.length === 0 || headers.length === 0) return null;
    const labelKey = headers[0];
    const valueKey = headers.includes("%")
      ? "%"
      : headers.includes("Score")
      ? "Score"
      : headers.find((h) =>
          dataset.some((row) => !isNaN(parseFloat(row[h])))
        ) || headers[1];
    const labels = dataset.map((row) => row[labelKey]);
    const values = dataset.map((row) => {
      const v = parseFloat(row[valueKey]);
      return isNaN(v) ? 0 : v;
    });
    const max = Math.max(...values);
    const min = Math.min(...values);
    const colorFor = (v) => {
      const t = max === min ? 1 : (v - min) / (max - min);
      const r = Math.round(255 * (1 - t));
      const g = Math.round(180 * t + 50 * (1 - t));
      return `rgba(${r}, ${g}, 90, 0.85)`;
    };
    const datasets = [
      {
        label: valueKey,
        data: values,
        backgroundColor: values.map((v) => colorFor(v)),
        borderColor: values.map((v) => colorFor(v).replace("0.85", "1")),
        borderWidth: 1,
        barThickness: 50,
        maxBarThickness: 50,
      },
    ];
    return { labels, datasets };
  }, [dataset, headers]);

  if (!chartData) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {activeTab === "student"
          ? "Student Progress Chart"
          : activeTab === "class"
          ? "Class Performance Chart"
          : "Grade Distribution Chart"}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ height: 320 }}>
        <Bar
          data={chartData}
          redraw
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "top" },
            },
            scales: {
              y: { beginAtZero: true },
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default Charts;
