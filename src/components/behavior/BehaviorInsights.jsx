import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Lightbulb as LightbulbIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useBehavior } from "../../contexts/BehaviorContext";
import { getBehaviorInsights, exportBehaviorData } from "../../services/behaviorService";
import { useStudents } from "../../contexts/StudentContext";

const BehaviorInsights = () => {
  const { students } = useStudents();
  const { behavior } = useBehavior();
  
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInsights();
  }, [behavior]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getBehaviorInsights();
      setInsights(data);
    } catch (err) {
      setError(err.message || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const data = await exportBehaviorData({}, format);
      
      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `behavior-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError("Failed to export data");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Behavior Insights
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport('csv')}
        >
          Export Data
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Observations
              </Typography>
              <Typography variant="h3">
                {insights.totalObservations}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Behavior records tracked
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Strengths */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Strengths
              </Typography>
              {insights.topStrengths.map((strength, index) => (
                <Box key={strength.skill} display="flex" alignItems="center" mb={1}>
                  <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {strength.skill} ({strength.count})
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Growth Areas */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Growth Areas
              </Typography>
              {insights.topGrowthAreas.map((growth, index) => (
                <Box key={growth.skill} display="flex" alignItems="center" mb={1}>
                  <TrendingDownIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {growth.skill} ({growth.count})
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI-Powered Recommendations
              </Typography>
              <List>
                {insights.recommendations.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <LightbulbIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => window.location.href = '/behavior'}
                  >
                    Add New Observation
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    onClick={() => window.location.href = '/behavior?tab=analytics'}
                  >
                    View Analytics
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    onClick={() => window.location.href = '/students'}
                  >
                    Student Profiles
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BehaviorInsights;
