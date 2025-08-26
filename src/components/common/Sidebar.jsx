import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Box,
  Typography,
  Chip,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  Psychology as PsychologyIcon,
  Email as EmailIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminIcon,
  Book as BookIcon,
  AccountBox as AccountBoxIcon,
  Code as CodeIcon,
  EmojiEvents as EmojiEventsIcon,
  Lock as LockIcon,
  Upgrade as UpgradeIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useMenuConfig } from "../../contexts/MenuConfigContext";
import { getStatusBadge } from "../../services/menuConfigService";

// Icon mapping for dynamic menu items
const iconMap = {
  'DashboardIcon': <DashboardIcon />,
  'PeopleIcon': <PeopleIcon />,
  'AssessmentIcon': <AssessmentIcon />,
  'AssignmentIcon': <AssignmentIcon />,
  'BookIcon': <BookIcon />,
  'EventNoteIcon': <EventNoteIcon />,
  'PsychologyIcon': <PsychologyIcon />,
  'EmojiEventsIcon': <EmojiEventsIcon />,
  'EmailIcon': <EmailIcon />,
  'SchoolIcon': <SchoolIcon />,
  'AccountBoxIcon': <AccountBoxIcon />,
  'CodeIcon': <CodeIcon />,
  'SettingsIcon': <SettingsIcon />,
  'AdminIcon': <AdminIcon />,
};

const drawerWidth = 240;

// Define unique colors for each menu item
const Sidebar = ({ open, variant = "permanent", onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { visibleMenuItems, loading } = useMenuConfig();
  const [restrictedDialog, setRestrictedDialog] = useState({ open: false, item: null });

  // Handle menu item click with access control
  const handleMenuClick = (item) => {
    if (item.accessLevel === 'preview') {
      // Show restriction dialog for preview items
      setRestrictedDialog({ open: true, item });
    } else {
      // Navigate normally for full access items
      navigate(item.path);
      if (variant === "temporary") {
        onClose?.();
      }
    }
  };

  // Close restriction dialog
  const handleCloseDialog = () => {
    setRestrictedDialog({ open: false, item: null });
  };

  // Get restriction message based on feature status
  const getRestrictionMessage = (item) => {
    if (item.status === 'coming_soon') {
      return {
        title: 'Coming Soon!',
        message: `The ${t(item.text || item.label)} feature is currently in development and will be available soon. Stay tuned for updates!`,
        icon: <AccessTimeIcon sx={{ fontSize: 48, color: 'info.main' }} />
      };
    } else if (item.status === 'premium') {
      return {
        title: 'Premium Feature',
        message: `The ${t(item.text || item.label)} feature is available for premium users. Upgrade your account to unlock this powerful tool and enhance your teaching experience.`,
        icon: <UpgradeIcon sx={{ fontSize: 48, color: 'warning.main' }} />
      };
    }
    return {
      title: 'Access Restricted',
      message: `You don't have access to the ${t(item.text || item.label)} feature.`,
      icon: <LockIcon sx={{ fontSize: 48, color: 'error.main' }} />
    };
  };

  // Fallback menu items (for when Firebase is unavailable)
  const fallbackMenuItems = [
    { text: "navigation.dashboard", icon: <DashboardIcon />, path: "/", color: "#3498DB" },
    { text: "navigation.students", icon: <PeopleIcon />, path: "/students", color: "#2ECC71" },
    { text: "navigation.settings", icon: <SettingsIcon />, path: "/settings", color: "#95A5A6" },
  ];
  
  // Use dynamic menu items or fallback
  const menuItems = loading ? fallbackMenuItems : visibleMenuItems.map(item => ({
    ...item,
    text: item.label,
    icon: iconMap[item.icon] || <DashboardIcon />,
    statusBadge: getStatusBadge(item.status, item.statusDate)
  }));

  // Check if a menu item is active based on the current path
  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") {
      return true;
    }
    return (
      location.pathname === path ||
      (path !== "/" && location.pathname.startsWith(path))
    );
  };

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "none",
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          backdropFilter: 'blur(20px)',
          transition: "transform 225ms cubic-bezier(0, 0, 0.2, 1) 0ms",
        },
      }}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <Toolbar /> {/* This creates space for the AppBar */}
      <Box 
        sx={{ 
          overflow: "auto", 
          position: 'relative',
          direction: 'rtl', // This moves the scrollbar to the left side
          // Custom scrollbar styling
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            margin: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: `linear-gradient(135deg, ${theme.palette.accent.main} 0%, rgba(255, 255, 255, 0.3) 100%)`,
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: `0 2px 8px rgba(0, 0, 0, 0.3)`,
            transition: 'all 0.3s ease',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: `linear-gradient(135deg, ${theme.palette.accent.main} 0%, rgba(255, 255, 255, 0.5) 100%)`,
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.4)`,
          },
          '&::-webkit-scrollbar-thumb:active': {
            background: `linear-gradient(135deg, ${theme.palette.accent.main} 0%, rgba(255, 255, 255, 0.6) 100%)`,
          },
          // Firefox scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.palette.accent.main} rgba(255, 255, 255, 0.1)`,
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundImage: 'radial-gradient(circle at 12px 12px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none'
          }}
        />
        {/* Content container with restored direction */}
        <Box sx={{ direction: 'ltr' }}>
           
        <List sx={{ p: 1, position: 'relative', zIndex: 1 }}>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const isRestricted = item.accessLevel === 'preview';
            return (
              <ListItem
                component="button"
                key={item.text}
                onClick={() => handleMenuClick(item)}
                selected={active}
                disableRipple
                sx={{
                  margin: "4px 8px",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  color: active ? "primary.contrastText" : isRestricted ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.7)",
                  transition: "all 0.3s ease-in-out",
                  position: "relative",
                  overflow: "hidden",
                  cursor: isRestricted ? "not-allowed" : "pointer",
                  backgroundColor: active
                    ? `${theme.palette.background.paper}20`
                    : "transparent",
                  backdropFilter: active ? 'blur(10px)' : 'none',
                  border: active ? `1px solid ${theme.palette.primary.contrastText}30` : '1px solid transparent',
                  borderLeft: active ? `4px solid ${theme.palette.accent.main}` : "4px solid transparent",
                  opacity: isRestricted ? 0.6 : 1,
                  "&.Mui-selected": {
                    backgroundColor: `${theme.palette.background.paper}20`,
                    backdropFilter: 'blur(10px)',
                    "&:hover": {
                      backgroundColor: `${theme.palette.background.paper}30`,
                    },
                  },
                  "&:hover": {
                    backgroundColor: isRestricted ? `${theme.palette.background.paper}10` : `${theme.palette.background.paper}20`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.primary.contrastText}20`,
                    color: isRestricted ? "rgba(255, 255, 255, 0.5)" : "primary.contrastText",
                    transform: isRestricted ? 'none' : 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? "primary.contrastText" : item.color,
                    opacity: active ? 1 : isRestricted ? 0.5 : 0.8,
                    minWidth: "40px",
                    transition: "all 0.3s ease-in-out",
                    "& .MuiSvgIcon-root": {
                      fontSize: "1.4rem",
                      transition: "transform 0.2s ease",
                      transform: active ? "scale(1.1)" : "scale(1)",
                      filter: active
                        ? `drop-shadow(0 0 4px ${theme.palette.accent.main})`
                        : "none",
                    },
                  }}
                >
                  {item.icon}
                  {isRestricted && (
                    <LockIcon 
                      sx={{ 
                        position: 'absolute', 
                        top: -2, 
                        right: -2, 
                        fontSize: 12, 
                        color: 'warning.main',
                        backgroundColor: 'background.paper',
                        borderRadius: '50%',
                        padding: '1px'
                      }} 
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{t(item.text)}</span>
                      {item.statusBadge && (
                        <Chip
                          label={item.statusBadge.text}
                          size="small"
                          color={item.statusBadge.color}
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            '& .MuiChip-label': {
                              px: 0.8
                            }
                          }}
                        />
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{
                    fontWeight: active ? 600 : 500,
                    letterSpacing: "0.5px",
                    fontSize: "0.95rem",
                  }}
                />
              </ListItem>
            );
          })}
        </List>
          <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)", my: 1 }} />
          <Box sx={{ p: 2, textAlign: "center", position: 'relative', zIndex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "0.7rem",
              }}
            >
              Ready Teacher v1.0
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Restriction Dialog */}
      <Dialog 
        open={restrictedDialog.open} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            textAlign: 'center'
          }
        }}
      >
        {restrictedDialog.item && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                {getRestrictionMessage(restrictedDialog.item).icon}
                <Typography variant="h5" component="div">
                  {getRestrictionMessage(restrictedDialog.item).title}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {getRestrictionMessage(restrictedDialog.item).message}
              </Typography>
              {restrictedDialog.item.status === 'premium' && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="warning.contrastText">
                    💎 <strong>Upgrade to Premium</strong> to unlock all features and enhance your teaching experience!
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button onClick={handleCloseDialog} variant="outlined">
                Got it
              </Button>
              {restrictedDialog.item.status === 'premium' && (
                <Button variant="contained" color="warning" startIcon={<UpgradeIcon />}>
                  Upgrade Now
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Drawer>
  );
};

export default Sidebar;
