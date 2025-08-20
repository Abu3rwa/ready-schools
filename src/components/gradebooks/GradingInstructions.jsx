import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Grade as GradeIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

const GradingInstructions = () => {
  const [expanded, setExpanded] = useState(false);

  const handleAccordionChange = () => {
    setExpanded(!expanded);
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Accordion expanded={expanded} onChange={handleAccordionChange}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GradeIcon color="primary" />
            <Typography variant="h6">
              How to Grade Assignments
            </Typography>
            <Chip label="Quick Guide" size="small" color="primary" variant="outlined" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              How to Grade Assignments:
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <AssignmentIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Method 1: Assignments Page (Recommended)"
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span">
                        1. Go to the Assignments page
                      </Typography>
                      <br />
                      <Typography variant="body2" component="span">
                        2. Click on an assignment to view its details
                      </Typography>
                      <br />
                      <Typography variant="body2" component="span">
                        3. Use the "Grade Students" option to enter grades for all students
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <TrendingUpIcon color="secondary" />
                </ListItemIcon>
                <ListItemText
                  primary="Method 2: Bulk Grading Dashboard"
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span">
                        1. Use the Assignments-Gradebook Dashboard for efficient bulk grading
                      </Typography>
                      <br />
                      <Typography variant="body2" component="span">
                        2. See all students and assignments in one comprehensive interface
                      </Typography>
                      <br />
                      <Typography variant="body2" component="span">
                        3. Enter grades more efficiently for multiple assignments
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Method 3: Individual Assignment Grading"
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span">
                        1. Navigate to a specific assignment from the Assignments list
                      </Typography>
                      <br />
                      <Typography variant="body2" component="span">
                        2. Click "Grade Assignment" to enter grades for all students
                      </Typography>
                      <br />
                      <Typography variant="body2" component="span">
                        3. Save grades and return to see updated averages in the GradeBook
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            </List>
            
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                💡 Important Notes:
              </Typography>
              <Typography variant="body2" component="div">
                • <strong>GradeBook View:</strong> This page shows grades and averages but does not allow grade entry
              </Typography>
              <Typography variant="body2" component="div">
                • <strong>Grade Entry:</strong> All grading should be done in the Assignments page
              </Typography>
              <Typography variant="body2" component="div">
                • <strong>Real-time Updates:</strong> Grades entered in Assignments automatically appear here
              </Typography>
              <Typography variant="body2" component="div">
                • <strong>Category Averages:</strong> Automatically calculated and displayed in the overview above
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default GradingInstructions;
