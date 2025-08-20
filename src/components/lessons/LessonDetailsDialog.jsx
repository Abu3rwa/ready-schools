import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Book as BookIcon,
  Note as NoteIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

const LessonDetailsDialog = ({ open, onClose, lesson }) => {
  if (!lesson) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2">
            {lesson.title || 'Untitled Lesson'}
          </Typography>
          <Button
            onClick={onClose}
            startIcon={<CloseIcon />}
            size="small"
          >
            Close
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Header Info */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon color="primary" />
                    <Typography variant="h6" color="primary">
                      {lesson.subject || 'No Subject'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon color="secondary" />
                    <Typography variant="h6" color="secondary">
                      {lesson.duration || 0} minutes
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Description */}
          {lesson.description && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="info" />
                  Description
                </Typography>
                <Typography variant="body1">
                  {lesson.description}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Learning Objectives */}
          {lesson.learningObjectives && Array.isArray(lesson.learningObjectives) && lesson.learningObjectives.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" />
                  Learning Objectives
                </Typography>
                <List dense>
                  {lesson.learningObjectives.map((objective, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={objective}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}

          {/* Activities */}
          {lesson.activities && Array.isArray(lesson.activities) && lesson.activities.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon color="primary" />
                  Activities
                </Typography>
                <List dense>
                  {lesson.activities.map((activity, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <AssignmentIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={activity}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}

          {/* Homework */}
          {lesson.homework && (
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BookIcon color="warning" />
                  Homework
                </Typography>
                <Typography variant="body1">
                  {lesson.homework}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Materials */}
          {lesson.materials && Array.isArray(lesson.materials) && lesson.materials.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BookIcon color="info" />
                  Materials
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {lesson.materials.map((material, index) => (
                    <Chip
                      key={index}
                      label={material.name || 'Material'}
                      size="small"
                      variant="outlined"
                      color="info"
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Teacher Notes */}
          {lesson.notes && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NoteIcon color="secondary" />
                  Teacher Notes
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {lesson.notes}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LessonDetailsDialog;
