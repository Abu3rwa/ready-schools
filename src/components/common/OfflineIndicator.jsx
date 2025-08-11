import React, { useState, useEffect } from "react";
import { Snackbar, Alert, Box } from "@mui/material";
import { WifiOff } from "@mui/icons-material";

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Function to update online status
    const handleOnlineStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };

    // Add event listeners
    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);

    // Clean up
    return () => {
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);
    };
  }, []);

  // If online, don't show anything
  if (!isOffline) {
    return null;
  }

  return (
    <>
      {/* Floating indicator that's always visible when offline */}
      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          backgroundColor: (theme) => theme.palette.error.main,
          color: "white",
          borderRadius: "20px",
          padding: "4px 12px",
          boxShadow: 3,
        }}
      >
        <WifiOff sx={{ mr: 1, fontSize: 20 }} />
        Offline Mode
      </Box>

      {/* Snackbar notification when first going offline */}
      <Snackbar open={isOffline} autoHideDuration={6000}>
        <Alert severity="warning" sx={{ width: "100%" }}>
          You are currently offline. Some features may be limited.
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineIndicator;
