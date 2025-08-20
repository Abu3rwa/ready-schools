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
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 240;

// Define unique colors for each menu item
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
    color: "#E74C3C",
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
    color: "#34495E",
  },
  {
    text: "navigation.standards",
    icon: <SchoolIcon />,
    path: "/standards",
    color: "#B266FF",
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

const Sidebar = ({ open, variant = "permanent", onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

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
          background: "linear-gradient(180deg, #2C3E50 0%, #34495E 100%)",
          boxShadow: "2px 0 10px rgba(0,0,0,0.15)",
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
      <Box sx={{ overflow: "auto" }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontSize: "0.75rem",
            }}
          >
            Main Navigation
          </Typography>
        </Box>
        <List sx={{ p: 1 }}>
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
                  borderRadius: "0",
                  color: active ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
                  transition: "all 0.3s ease-in-out",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  backgroundColor: active
                    ? "rgba(52, 152, 219, 0.15)"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(52, 152, 219, 0.3)"
                    : "1px solid transparent",
                  "&.Mui-selected": {
                    backgroundColor: "rgba(52, 152, 219, 0.15)",
                    border: "1px solid rgba(52, 152, 219, 0.3)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: "10%",
                      height: "80%",
                      width: "4px",
                      backgroundColor: "#3498DB",
                      borderRadius: "0",
                      boxShadow: "0 0 8px rgba(52, 152, 219, 0.5)",
                    },
                    "&:hover": {
                      backgroundColor: "rgba(52, 152, 219, 0.25)",
                      border: "1px solid rgba(52, 152, 219, 0.5)",
                    },
                  },
                  "&:hover": {
                    backgroundColor: active
                      ? "rgba(52, 152, 219, 0.25)"
                      : "rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                    border: active
                      ? "1px solid rgba(52, 152, 219, 0.5)"
                      : "1px solid rgba(255, 255, 255, 0.2)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? "#ffffff" : item.color,
                    opacity: active ? 1 : 0.8,
                    minWidth: "40px",
                    transition: "all 0.3s ease-in-out",
                    "& .MuiSvgIcon-root": {
                      fontSize: "1.4rem",
                      transition: "transform 0.2s ease",
                      transform: active ? "scale(1.1)" : "scale(1)",
                      filter: active
                        ? "drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))"
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
                {active && (
                  <Box
                    sx={{
                      position: "absolute",
                      right: 12,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 0 8px rgba(255, 255, 255, 0.8)",
                      border: "2px solid rgba(52, 152, 219, 0.8)",
                    }}
                  />
                )}
              </ListItem>
            );
          })}
        </List>
        <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)", my: 1 }} />
        <Box sx={{ p: 2, textAlign: "center" }}>
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
