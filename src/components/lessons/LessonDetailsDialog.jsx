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
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (!lesson) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          maxHeight: isMobile ? '100vh' : '90vh',
          borderRadius: isMobile ? 0 : 2,
          margin: isMobile ? 0 : 2
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          p: { xs: 2, sm: 3 },
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            component="h2"
            sx={{
              fontWeight: 600,
              lineHeight: 1.2,
              wordBreak: 'break-word'
            }}
          >
            {lesson.title || 'Untitled Lesson'}
          </Typography>
          <Button
            onClick={onClose}
            startIcon={<CloseIcon />}
            size={isMobile ? "medium" : "small"}
            variant="outlined"
            sx={{
              color: theme.palette.primary.contrastText,
              borderColor: theme.palette.primary.contrastText,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: theme.palette.primary.contrastText
              },
              minWidth: { xs: '100%', sm: 'auto' }
            }}
          >
            Close
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
          {/* Header Info */}
          <Grid item xs={12}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: { xs: 1.5, sm: 2 }, 
                mb: { xs: 1, sm: 2 },
                borderRadius: 2,
                backgroundColor: theme.palette.background.default
              }}
            >
              <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 },
                    mb: { xs: 1, sm: 0 }
                  }}>
                    <SchoolIcon color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    >
                      {lesson.subject || 'No Subject'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 }
                  }}>
                    <ScheduleIcon color="secondary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      color="secondary"
                      sx={{ fontWeight: 600 }}
                    >
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
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper
                }}
              >
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 },
                    fontWeight: 600,
                    color: theme.palette.info.main
                  }}
                >
                  <InfoIcon color="info" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  Description
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: { xs: 1.4, sm: 1.5 }
                  }}
                >
                  {lesson.description}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Learning Objectives */}
          {lesson.learningObjectives && Array.isArray(lesson.learningObjectives) && lesson.learningObjectives.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  height: '100%',
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper
                }}
              >
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 },
                    fontWeight: 600,
                    color: theme.palette.success.main
                  }}
                >
                  <CheckCircleIcon color="success" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  Learning Objectives
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {lesson.learningObjectives.map((objective, index) => (
                    <ListItem 
                      key={index} 
                      sx={{ 
                        py: { xs: 0.25, sm: 0.5 },
                        px: 0
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: { xs: 28, sm: 32 } }}>
                        <CheckCircleIcon 
                          color="success" 
                          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={objective}
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          sx: { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
                        }}
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
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  height: '100%',
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper
                }}
              >
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 },
                    fontWeight: 600,
                    color: theme.palette.primary.main
                  }}
                >
                  <AssignmentIcon color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  Activities
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {lesson.activities.map((activity, index) => (
                    <ListItem 
                      key={index} 
                      sx={{ 
                        py: { xs: 0.25, sm: 0.5 },
                        px: 0
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: { xs: 28, sm: 32 } }}>
                        <AssignmentIcon 
                          color="primary" 
                          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={activity}
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          sx: { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
                        }}
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
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper
                }}
              >
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 },
                    fontWeight: 600,
                    color: theme.palette.warning.main
                  }}
                >
                  <BookIcon color="warning" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  Homework
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: { xs: 1.4, sm: 1.5 }
                  }}
                >
                  {lesson.homework}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Materials */}
          {lesson.materials && Array.isArray(lesson.materials) && lesson.materials.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper
                }}
              >
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 },
                    fontWeight: 600,
                    color: theme.palette.info.main
                  }}
                >
                  <BookIcon color="info" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  Materials
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: { xs: 0.5, sm: 1 }
                }}>
                  {lesson.materials.map((material, index) => (
                    <Chip
                      key={index}
                      label={material.name || 'Material'}
                      size={isMobile ? "small" : "medium"}
                      variant="outlined"
                      color="info"
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        height: { xs: 24, sm: 32 }
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Teacher Notes */}
          {lesson.notes && (
            <Grid item xs={12}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper
                }}
              >
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 },
                    fontWeight: 600,
                    color: theme.palette.secondary.main
                  }}
                >
                  <NoteIcon color="secondary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  Teacher Notes
                </Typography>
                <Typography 
                  variant="body1" 
                  color="textSecondary"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: { xs: 1.4, sm: 1.5 },
                    fontStyle: 'italic'
                  }}
                >
                  {lesson.notes}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions 
        sx={{ 
          p: { xs: 2, sm: 2, md: 3 },
          gap: { xs: 1, sm: 2 },
          justifyContent: { xs: 'center', sm: 'flex-end' },
          backgroundColor: theme.palette.background.default
        }}
      >
        <Button 
          onClick={onClose} 
          variant="contained"
          size={isMobile ? "large" : "medium"}
          sx={{
            minWidth: { xs: '120px', sm: 'auto' },
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LessonDetailsDialog;
