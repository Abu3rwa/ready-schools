import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import {
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Category as CategoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon
} from '@mui/icons-material';

const GradeBookCard = ({ 
  gradeBook, 
  onOpen, 
  onDuplicate, 
  onArchive, 
  onActivate, 
  onDelete 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'archived': return 'warning';
      case 'draft': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <AssessmentIcon />;
      case 'archived': return <ArchiveIcon />;
      case 'draft': return <EditIcon />;
      default: return <SchoolIcon />;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
      onClick={() => onOpen(gradeBook.id)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            {getStatusIcon(gradeBook.status)}
          </Avatar>
          <Chip 
            label={gradeBook.status}
            color={getStatusColor(gradeBook.status)}
            size="small"
          />
        </Box>
        
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          {gradeBook.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {gradeBook.subject}
        </Typography>
        
        {gradeBook.gradeLevel && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {gradeBook.gradeLevel}
          </Typography>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {gradeBook.students?.length || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Students
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="secondary">
                  {gradeBook.assignments?.length || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Assignments
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="info.main">
                  {gradeBook.categories?.length || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Categories
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Last modified: {formatDate(gradeBook.lastModified)}
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Button 
          size="small" 
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(gradeBook.id);
          }}
        >
          Open
        </Button>
        
        <Box>
          <Tooltip title="Duplicate">
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(gradeBook.id);
              }}
            >
              <DuplicateIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={gradeBook.status === 'active' ? 'Archive' : 'Activate'}>
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (gradeBook.status === 'active') {
                  onArchive(gradeBook.id);
                } else {
                  onActivate(gradeBook.id);
                }
              }}
            >
              {gradeBook.status === 'active' ? <ArchiveIcon /> : <UnarchiveIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete">
            <IconButton 
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(gradeBook);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default GradeBookCard;
