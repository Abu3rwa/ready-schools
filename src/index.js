import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import { BrowserRouter as Router } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext";
import { StudentProvider } from "./contexts/StudentContext";
import { GradeProvider } from "./contexts/GradeContext";
import { AssignmentProvider } from "./contexts/AssignmentContext";
import { AttendanceProvider } from "./contexts/AttendanceContext";
import { BehaviorProvider } from "./contexts/BehaviorContext";
import { CommunicationProvider } from "./contexts/CommunicationContext";
import { EmailProvider } from "./contexts/EmailContext";
import { GoogleSheetsProvider } from "./contexts/GoogleSheetsContext";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ErrorBoundary from "./components/common/ErrorBoundary";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <GoogleSheetsProvider>
              <StudentProvider>
                <GradeProvider>
                  <AssignmentProvider>
                    <AttendanceProvider>
                      <BehaviorProvider>
                        <CommunicationProvider>
                          <EmailProvider>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <Router>
                                <App />
                              </Router>
                            </LocalizationProvider>
                          </EmailProvider>
                        </CommunicationProvider>
                      </BehaviorProvider>
                    </AttendanceProvider>
                  </AssignmentProvider>
                </GradeProvider>
              </StudentProvider>
            </GoogleSheetsProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);
