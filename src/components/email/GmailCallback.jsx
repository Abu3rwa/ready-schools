import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";
import { useGmail } from "../../contexts/GmailContext";

const GmailCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGmailCallback, error, loading } = useGmail();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const processCallback = async () => {
      try {
        await handleGmailCallback(code, state);
        // Redirect to settings after successful setup
        navigate("/settings", {
          state: {
            success: true,
            message: "Gmail successfully connected!",
          },
        });
      } catch (err) {
        console.error("Error in Gmail callback:", err);
      }
    };

    if (code && state) {
      processCallback();
    } else {
      navigate("/settings", {
        state: {
          error: true,
          message: "Invalid callback parameters",
        },
      });
    }
  }, [searchParams, handleGmailCallback, navigate]);

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={2}
      >
        <Alert severity="error">{error}</Alert>
        <Typography variant="body2" color="text.secondary">
          You will be redirected back to settings...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="50vh"
      gap={2}
    >
      <CircularProgress />
      <Typography>Completing Gmail setup...</Typography>
    </Box>
  );
};

export default GmailCallback;
