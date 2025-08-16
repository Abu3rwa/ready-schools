import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Email as EmailIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useGmail } from "../../contexts/GmailContext";
import { useAuth } from "../../contexts/AuthContext";

const GmailSetup = () => {
  const { currentUser } = useAuth();
  const { isConfigured, loading, error, setupGmail, checkGmailConfiguration } =
    useGmail();
  const [status, setStatus] = useState("checking"); // checking, configured, not_configured, error

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await checkGmailConfiguration();
        setStatus(isConfigured ? "configured" : "not_configured");
      } catch (err) {
        console.error("Error checking Gmail status:", err);
        setStatus("error");
      }
    };

    checkStatus();
  }, [checkGmailConfiguration, isConfigured]);

  const handleSetupClick = async () => {
    try {
      await setupGmail();
    } catch (err) {
      console.error("Error setting up Gmail:", err);
    }
  };

  const renderStatus = () => {
    switch (status) {
      case "checking":
        return (
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={20} />
            <Typography>Checking Gmail configuration...</Typography>
          </Box>
        );

      case "configured":
        return (
          <Alert
            icon={<CheckIcon fontSize="inherit" />}
            severity="success"
            sx={{ width: "100%" }}
          >
            Gmail is configured and ready to use with {currentUser?.email}
          </Alert>
        );

      case "not_configured":
        return (
          <Alert severity="info" sx={{ width: "100%" }}>
            Connect your Gmail account to send emails directly from your inbox.
          </Alert>
        );

      case "error":
        return (
          <Alert severity="error" sx={{ width: "100%" }}>
            {error || "Error checking Gmail configuration"}
          </Alert>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {renderStatus()}

      <List sx={{ mt: 2 }}>
        <ListItem>
          <ListItemIcon>
            <EmailIcon color={isConfigured ? "success" : "disabled"} />
          </ListItemIcon>
          <ListItemText
            primary="Send emails from your Gmail account"
            secondary={isConfigured ? "Enabled" : "Not configured"}
          />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon>
            <SettingsIcon color={isConfigured ? "success" : "disabled"} />
          </ListItemIcon>
          <ListItemText
            primary="Gmail API Integration"
            secondary={isConfigured ? "Connected" : "Not connected"}
          />
        </ListItem>
      </List>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color={isConfigured ? "success" : "primary"}
          onClick={handleSetupClick}
          disabled={loading || status === "checking"}
          startIcon={isConfigured ? <CheckIcon /> : <EmailIcon />}
        >
          {loading
            ? "Setting up..."
            : isConfigured
            ? "Reconfigure Gmail"
            : "Connect Gmail"}
        </Button>
      </Box>

      {/* Benefits section */}
      {!isConfigured && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Benefits of Gmail Integration:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Send emails from your own Gmail address" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Track emails in your sent folder" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Use your Gmail quota instead of shared SMTP" />
            </ListItem>
          </List>
        </Box>
      )}
    </Box>
  );
};

export default GmailSetup;
