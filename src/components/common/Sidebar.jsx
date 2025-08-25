import React from "react";
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
  alpha,
  useTheme,
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
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 240;

// Define unique colors for each menu item
const Sidebar = ({ open, variant = "permanent", onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();

  const menuItems = [
    { text: "navigation.dashboard", icon: <DashboardIcon />, path: "/", color: "#3498DB" },
    {
      text: "navigation.students",
      icon: <PeopleIcon />,
      path: "/students",
      color: "#2ECC71",
    },
    {
      text: "navigation.gradebooks",
      icon: <AssessmentIcon />,
      path: "/gradebooks",
      color: "#F39C12",
    },
    {
      text: "navigation.assignments",
      icon: <AssignmentIcon />,
      path: "/assignments",
      color: theme.palette.secondary.main, // Using brand red
    },
    {
      text: "navigation.lessons",
      icon: <BookIcon />,
      path: "/lessons",
      color: "#FF6B6B",
    },
    {
      text: "navigation.attendance",
      icon: <EventNoteIcon />,
      path: "/attendance",
      color: "#9B59B6",
    },
    {
      text: "navigation.behavior",
      icon: <PsychologyIcon />,
      path: "/behavior",
      color: "#1ABC9C",
    },
    {
      text: "navigation.communication",
      icon: <EmailIcon />,
      path: "/communication",
      color: "#E67E22",
    },
    {
      text: "navigation.reports",
      icon: <AssessmentIcon />,
      path: "/reports",
      color: theme.palette.secondary.main, // Using brand red
    },
    {
      text: "navigation.standards",
      icon: <SchoolIcon />,
      path: "/standards",
      color: "#B266FF",
    },
    {
      text: "navigation.profile",
      icon: <AccountBoxIcon />,
      path: "/profile",
      color: "#3498DB",
    },
    {
      text: "navigation.developer",
      icon: <CodeIcon />,
      path: "/developer",
      color: "#FF6B35",
    },
    {
      text: "navigation.settings",
      icon: <SettingsIcon />,
      path: "/settings",
      color: "#95A5A6",
    },
    {
      text: "navigation.adminUsers",
      icon: <AdminIcon />,
      path: "/admin/users",
      color: "#2C3E50",
    },
  ];

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
      <Box sx={{ overflow: "auto", position: 'relative' }}>
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
        <Box sx={{ p: 2, pb: 1, position: 'relative', zIndex: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: "primary.contrastText",
              opacity: 0.7,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontSize: "0.75rem",
            }}
          >
            Main Navigation
          </Typography>
        </Box>
        <List sx={{ p: 1, position: 'relative', zIndex: 1 }}>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItem
                component="button"
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  if (variant === "temporary") {
                    onClose?.();
                  }
                }}
                selected={active}
                disableRipple
                sx={{
                  margin: "4px 8px",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  color: active ? "primary.contrastText" : "rgba(255, 255, 255, 0.7)",
                  transition: "all 0.3s ease-in-out",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  backgroundColor: active
                    ? `${theme.palette.background.paper}20`
                    : "transparent",
                  backdropFilter: active ? 'blur(10px)' : 'none',
                  border: active ? `1px solid ${theme.palette.primary.contrastText}30` : '1px solid transparent',
                  borderLeft: active ? `4px solid ${theme.palette.accent.main}` : "4px solid transparent",
                  "&.Mui-selected": {
                    backgroundColor: `${theme.palette.background.paper}20`,
                    backdropFilter: 'blur(10px)',
                    "&:hover": {
                      backgroundColor: `${theme.palette.background.paper}30`,
                    },
                  },
                  "&:hover": {
                    backgroundColor: `${theme.palette.background.paper}20`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.primary.contrastText}20`,
                    color: "primary.contrastText",
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? "primary.contrastText" : item.color,
                    opacity: active ? 1 : 0.8,
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
                </ListItemIcon>
                <ListItemText
                  primary={t(item.text)}
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
            Smile3 v1.0
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
