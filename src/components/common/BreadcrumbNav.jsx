import React from 'react';
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  Psychology as PsychologyIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const BreadcrumbNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    
    if (pathSegments.length === 0) {
      return [{ label: 'Dashboard', path: '/', icon: <HomeIcon /> }];
    }

    const items = [];
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Map path segments to readable labels
      let label = segment;
      let icon = null;

      switch (segment) {
        case 'students':
          label = 'Students';
          icon = <PeopleIcon />;
          break;
        case 'gradebooks':
          label = 'Grade Books';
          icon = <AssessmentIcon />;
          break;
        case 'assignments':
          label = 'Assignments';
          icon = <AssignmentIcon />;
          break;
        case 'attendance':
          label = 'Attendance';
          icon = <EventNoteIcon />;
          break;
        case 'behavior':
          label = 'Behavior';
          icon = <PsychologyIcon />;
          break;
        case 'communication':
          label = 'Communication';
          icon = <EmailIcon />;
          break;
        case 'reports':
          label = 'Reports';
          icon = <AssessmentIcon />;
          break;
        case 'standards':
          label = 'Standards';
          icon = <SchoolIcon />;
          break;
        case 'settings':
          label = 'Settings';
          icon = <SettingsIcon />;
          break;
        case 'developer':
          label = 'Developer';
          icon = <AdminIcon />;
          break;
        case 'admin':
          label = 'Admin';
          icon = <AdminIcon />;
          break;
        case 'users':
          label = 'Users';
          break;
        default:
          // For dynamic segments like IDs, try to get a meaningful label
          if (segment.match(/^[a-zA-Z0-9-]+$/)) {
            label = 'Details';
          }
          break;
      }

      items.push({
        label,
        path: currentPath,
        icon,
        isLast: index === pathSegments.length - 1
      });
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1, 
      mb: 2,
      p: 1,
      backgroundColor: 'background.paper',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        {breadcrumbItems.map((item, index) => (
          <Box key={item.path} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {item.icon && (
              item.isLast ? (
                // Last item: no Tooltip, disabled button
                <IconButton
                  size="small"
                  disabled={true}
                  sx={{ 
                    p: 0.5,
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  {item.icon}
                </IconButton>
              ) : (
                // Not last item: Tooltip with clickable button
                <Tooltip title={item.label}>
                  <IconButton
                    size="small"
                    onClick={() => navigate(item.path)}
                    sx={{ 
                      p: 0.5,
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    {item.icon}
                  </IconButton>
                </Tooltip>
              )
            )}
            {item.isLast ? (
              <Typography 
                variant="body2" 
                color="text.primary"
                sx={{ fontWeight: 'medium' }}
              >
                {item.label}
              </Typography>
            ) : (
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate(item.path)}
                sx={{
                  textDecoration: 'none',
                  color: 'primary.main',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                {item.label}
              </Link>
            )}
          </Box>
        ))}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbNav; 