import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { useAssignments } from "../../contexts/AssignmentContext";

// Pre-built category templates for different subjects
const CATEGORY_TEMPLATES = {
  math: {
    name: "Mathematics",
    description: "Standard math class with emphasis on problem-solving",
    categories: {
      "Tests and Quizzes": 40,
      "Homework and Classwork": 15,
      "Projects and Presentations": 25,
      "Participation and Attendance": 10,
      "Extra Credit Opportunities": 10
    },
    color: "#2196F3"
  },
  science: {
    name: "Science",
    description: "Science class with lab work and experiments",
    categories: {
      "Tests and Quizzes": 30,
      "Homework and Classwork": 10,
      "Labs and Experiments": 25,
      "Projects and Presentations": 20,
      "Participation and Attendance": 10,
      "Extra Credit Opportunities": 5
    },
    color: "#4CAF50"
  },
  english: {
    name: "English/Language Arts",
    description: "English class with writing and reading focus",
    categories: {
      "Essays and Papers": 30,
      "Tests and Quizzes": 20,
      "Homework and Classwork": 15,
      "Projects and Presentations": 20,
      "Participation and Attendance": 10,
      "Extra Credit Opportunities": 5
    },
    color: "#FF9800"
  },
  history: {
    name: "History/Social Studies",
    description: "History class with research and analysis",
    categories: {
      "Essays and Papers": 25,
      "Tests and Quizzes": 20,
      "Homework and Classwork": 15,
      "Projects and Presentations": 25,
      "Participation and Attendance": 10,
      "Extra Credit Opportunities": 5
    },
    color: "#9C27B0"
  },
  art: {
    name: "Art/Creative",
    description: "Creative arts class with project-based learning",
    categories: {
      "Projects and Presentations": 50,
      "Participation and Attendance": 30,
      "Tests and Quizzes": 10,
      "Extra Credit Opportunities": 10
    },
    color: "#F44336"
  },
  physical: {
    name: "Physical Education",
    description: "PE class with activity and participation focus",
    categories: {
      "Participation and Attendance": 60,
      "Tests and Quizzes": 20,
      "Projects and Presentations": 10,
      "Extra Credit Opportunities": 10
    },
    color: "#607D8B"
  }
};

const CategoryTemplateSelector = ({ open, onClose, onSelectTemplate, subject }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(CATEGORY_TEMPLATES[selectedTemplate].categories);
      onClose();
      setSelectedTemplate(null);
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Select Category Template for {subject}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose a pre-built category template with optimized weights for your subject area.
        </Typography>

        <Grid container spacing={3}>
          {Object.entries(CATEGORY_TEMPLATES).map(([key, template]) => (
            <Grid item xs={12} md={6} key={key}>
              <Card 
                variant={selectedTemplate === key ? "elevation" : "outlined"}
                sx={{ 
                  cursor: "pointer",
                  border: selectedTemplate === key ? `2px solid ${template.color}` : "1px solid",
                  "&:hover": { boxShadow: 2 }
                }}
                onClick={() => handleTemplateSelect(key)}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Box 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: "50%", 
                        backgroundColor: template.color,
                        mr: 1
                      }} 
                    />
                    <Typography variant="h6" component="div">
                      {template.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {Object.entries(template.categories).map(([category, weight]) => (
                      <Chip
                        key={category}
                        label={`${category}: ${weight}%`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {selectedTemplate && (
          <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Selected Template: {CATEGORY_TEMPLATES[selectedTemplate].name}
            </Typography>
            <List dense>
              {Object.entries(CATEGORY_TEMPLATES[selectedTemplate].categories).map(([category, weight]) => (
                <ListItem key={category}>
                  <ListItemText 
                    primary={category}
                    secondary={`${weight}% of total grade`}
                  />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Total: {Object.values(CATEGORY_TEMPLATES[selectedTemplate].categories).reduce((sum, weight) => sum + weight, 0)}%
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleApplyTemplate} 
          variant="contained" 
          disabled={!selectedTemplate}
        >
          Apply Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryTemplateSelector; 