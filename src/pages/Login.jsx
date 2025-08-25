import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authConfig } from "../firebase";
import {
  Container,
  CssBaseline,
  Paper,
  Typography,
  Button,
  Alert,
  Avatar,
  Box,
  useMediaQuery
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import {
  Google as GoogleIcon,
  LockOutlined as LockOutlinedIcon,
} from "@mui/icons-material";
import "./Login.css";

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [loginError, setLoginError] = React.useState(null);

  const handleGoogleSignIn = async () => {
    setLoginError(null);
    try {
      const user = await signInWithGoogle();
      navigate("/", {
        replace: true,
        state: {
          newLogin: true,
          message: `Welcome, ${user.displayName || user.email}!`,
        },
      });
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
      <Container 
        component="main" 
        maxWidth="xs"
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3 }
        }}
      >
        <CssBaseline />
        <Paper 
          elevation={isMobile ? 6 : 12} 
          className="login-paper"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: { xs: 3, sm: 4 },
            borderRadius: { xs: 2, sm: 3 },
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            width: '100%',
            maxWidth: { xs: '100%', sm: '400px' }
          }}
        >
          <Avatar 
            sx={{ 
              m: 1, 
              bgcolor: theme.palette.primary.main,
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 }
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
          </Avatar>
          
          <Typography 
            component="h1" 
            variant={isMobile ? "h6" : "h5"}
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              textAlign: 'center'
            }}
          >
            Welcome to Teacher Kit
          </Typography>
          
          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{ 
              mt: 1, 
              mb: 3,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.5
            }}
          >
            Use your Google account to continue to your dashboard.
          </Typography>
          
          {loginError && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2, 
                width: "100%",
                fontSize: { xs: '0.875rem', sm: '1rem' },
                borderRadius: 2
              }}
            >
              {loginError}
            </Alert>
          )}
          
          <Button
            onClick={handleGoogleSignIn}
            variant="outlined"
            fullWidth
            startIcon={<GoogleIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />}
            className="google-signin-button"
            size={isMobile ? "large" : "medium"}
            sx={{ 
              py: { xs: 1.5, sm: 2 },
              fontSize: { xs: '1rem', sm: '1.125rem' },
              fontWeight: 600,
              borderRadius: 2,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              backgroundColor: 'transparent',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                backgroundColor: theme.palette.primary.light,
                transform: 'translateY(-1px)',
                boxShadow: theme.shadows[4]
              },
              '&:active': {
                transform: 'translateY(0px)'
              }
            }}
            data-client-id={authConfig.clientId}
          >
            Sign in with Google
          </Button>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography 
              variant="caption" 
              color="textSecondary"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                opacity: 0.8
              }}
            >
              Secure authentication powered by Google
            </Typography>
          </Box>
        </Paper>
      </Container>
    </div>
  );
};

export default Login;
