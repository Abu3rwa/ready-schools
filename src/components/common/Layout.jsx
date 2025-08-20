import React, { useState, useEffect } from "react";
import {
  Box,
  Toolbar,
  useMediaQuery,
  useTheme,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";
import BreadcrumbNav from "./BreadcrumbNav";
import { useAuth } from "../../contexts/AuthContext";
import { useGmail } from "../../contexts/GmailContext";
import { useTranslation } from "react-i18next";

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { i18n } = useTranslation();
  const isRTL = i18n?.dir?.(i18n?.language) === "rtl";
  const { currentUser } = useAuth();
  const { shouldPrompt, setShouldPrompt, setupGmail, checkGmailConfiguration } =
    useGmail();
  const [openPrompt, setOpenPrompt] = useState(false);

  useEffect(() => {
    if (currentUser) {
      checkGmailConfiguration();
    }
  }, [currentUser, checkGmailConfiguration]);

  useEffect(() => {
    setOpenPrompt(!!currentUser && shouldPrompt);
  }, [currentUser, shouldPrompt]);

  const handleDismiss = () => {
    setOpenPrompt(false);
    setShouldPrompt(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        flexDirection: isRTL ? "row-reverse" : "row",
      }}
    >
      <CssBaseline />
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar
        open={sidebarOpen}
        variant={isMobile ? "temporary" : "persistent"}
        onClose={toggleSidebar}
        anchor={isRTL ? "right" : "left"}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(isRTL
            ? {
                marginRight: sidebarOpen && !isMobile ? 0 : `-${240}px`,
                marginLeft: 0,
              }
            : {
                marginLeft: sidebarOpen && !isMobile ? 0 : `-${240}px`,
                marginRight: 0,
              }),
          ...(isMobile && {
            marginLeft: 0,
            marginRight: 0,
          }),
        }}
      >
        <Toolbar /> {/* This creates space for the AppBar */}
        <BreadcrumbNav />
        {children}
      </Box>

      <Dialog open={openPrompt} onClose={handleDismiss} maxWidth="xs" fullWidth>
        <DialogTitle>Connect Gmail</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            To send emails from your own address, please connect your Gmail
            account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDismiss}>Maybe later</Button>
          <Button variant="contained" onClick={setupGmail} autoFocus>
            Connect Gmail
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;
