import React from 'react';
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const AssignmentsGradebookNav = ({ currentView = 'dashboard' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      title: 'Dashboard',
      description: 'Unified view of assignments and grades',
      icon: DashboardIcon,
      path: '/assignments-gradebook',
      color: 'primary.main'
    },
    {
      title: 'Assignments',
      description: 'Create and manage assignments',
      icon: AssignmentIcon,
      path: '/assignments',
      color: 'secondary.main'
    },
    {
      title: 'Gradebooks',
      description: 'View and manage gradebooks',
      icon: GradeIcon,
      path: '/gradebooks',
      color: 'success.main'
    },
    {
      title: 'Students',
      description: 'Manage student information',
      icon: SchoolIcon,
      path: '/students',
      color: 'info.main'
    },
    {
      title: 'Analytics',
      description: 'Performance insights and reports',
      icon: TrendingUpIcon,
      path: '/analytics',
      color: 'warning.main'
    },
    {
      title: 'Standards',
      description: 'Standards-based assessment',
      icon: AssessmentIcon,
      path: '/standards',
      color: 'error.main'
    }
  ];

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const item = navigationItems.find(nav => nav.path === currentPath);
      
      if (item) {
        breadcrumbs.push({
          label: item.title,
          path: currentPath,
          current: index === pathSegments.length - 1
        });
      }
    });
    
    return breadcrumbs;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const getCurrentViewData = () => {
    return navigationItems.find(item => item.path === location.pathname) || navigationItems[0];
  };

  const currentViewData = getCurrentViewData();
  const breadcrumbs = getBreadcrumbs();

  return (
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumbs */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          {breadcrumbs.map((breadcrumb, index) => (
            <Link
              key={breadcrumb.path}
              color={breadcrumb.current ? 'text.primary' : 'inherit'}
              href={breadcrumb.current ? undefined : breadcrumb.path}
              onClick={breadcrumb.current ? undefined : (e) => {
                e.preventDefault();
                handleNavigation(breadcrumb.path);
              }}
              underline="hover"
              sx={{ 
                cursor: breadcrumb.current ? 'default' : 'pointer',
                fontWeight: breadcrumb.current ? 'bold' : 'normal'
              }}
            >
              {breadcrumb.label}
            </Link>
          ))}
        </Breadcrumbs>
      </Paper>

      {/* Current View Header */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              backgroundColor: currentViewData.color,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <currentViewData.icon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" component="h1">
              {currentViewData.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {currentViewData.description}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Quick Navigation Cards */}
      <Grid container spacing={2}>
        {navigationItems.map((item) => {
          const isCurrent = location.pathname === item.path;
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={2} key={item.path}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: isCurrent ? `2px solid ${item.color}` : 'none',
                  opacity: isCurrent ? 1 : 0.8,
                  '&:hover': {
                    opacity: 1,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <CardActionArea
                  onClick={() => handleNavigation(item.path)}
                  sx={{ height: '100%', p: 2 }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        backgroundColor: item.color,
                        borderRadius: '50%',
                        width: 60,
                        height: 60,
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <item.icon sx={{ color: 'white', fontSize: 30 }} />
                    </Box>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                    {isCurrent && (
                      <Chip 
                        label="Current" 
                        color="primary" 
                        size="small" 
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Contextual Actions */}
      {currentView === 'assignments' && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions for Assignments
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Tooltip title="Create new assignment">
              <IconButton 
                color="primary"
                onClick={() => handleNavigation('/assignments/create')}
              >
                <AssignmentIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View gradebook for this subject">
              <IconButton 
                color="secondary"
                onClick={() => handleNavigation('/gradebooks')}
              >
                <GradeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View analytics">
              <IconButton 
                color="success"
                onClick={() => handleNavigation('/analytics')}
              >
                <TrendingUpIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      )}

      {currentView === 'gradebooks' && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions for Gradebooks
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Tooltip title="Create new assignment">
              <IconButton 
                color="primary"
                onClick={() => handleNavigation('/assignments/create')}
              >
                <AssignmentIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View students">
              <IconButton 
                color="info"
                onClick={() => handleNavigation('/students')}
              >
                <SchoolIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View standards">
              <IconButton 
                color="warning"
                onClick={() => handleNavigation('/standards')}
              >
                <AssessmentIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      )}

      {/* Cross-System Navigation Hints */}
      <Paper sx={{ p: 2, mt: 2, backgroundColor: 'info.light' }}>
        <Typography variant="h6" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArrowForwardIcon />
            Cross-System Navigation
          </Box>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use the navigation cards above to move between different sections. 
          The system automatically synchronizes data between assignments and gradebooks.
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
            Pro tip:
          </Typography>
          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
            Create an assignment first, then view it in the corresponding gradebook. 
            Grades entered in either system will be automatically synchronized.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default AssignmentsGradebookNav;
