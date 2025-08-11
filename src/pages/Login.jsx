import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Container,
  CssBaseline,
  Paper,
  Typography,
  Button,
  Alert,
  Avatar,
} from "@mui/material";
import { Google as GoogleIcon, LockOutlined as LockOutlinedIcon } from "@mui/icons-material";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [loginError, setLoginError] = React.useState(null);

  const handleGoogleSignIn = async () => {
    setLoginError(null);
    try {
      const user = await signInWithGoogle();
      navigate("/");
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        setLoginError("Sign-in was cancelled. Please try again.");
      } else if (error.code === "auth/popup-blocked") {
        setLoginError(
          "Sign-in popup was blocked by your browser. Please allow popups for this site."
        );
      } else if (error.code === "auth/cancelled-popup-request") {
        setLoginError("Multiple popup requests were made. Please try again.");
      } else if (error.code === "auth/network-request-failed") {
        setLoginError(
          "Network error. Please check your internet connection and try again."
        );
      } else {
        setLoginError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="login-background">
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Paper elevation={12} className="login-paper">
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1, mb: 3 }}>
            Use your Google account to continue.
          </Typography>
          {loginError && (
            <Alert severity="error" sx={{ mb: 2, width: "100%" }}>
              {loginError}
            </Alert>
          )}
          <Button
            onClick={handleGoogleSignIn}
            variant="outlined"
            fullWidth
            startIcon={<GoogleIcon />}
            className="google-signin-button"
            sx={{ py: 1.5 }}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Container>
    </div>
  );
};

export default Login;
