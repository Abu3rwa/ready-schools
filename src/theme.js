import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2C3E50", // Professional Dark Blue-Gray
      light: "#34495E",
      dark: "#1B2631",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#3498DB", // Modern Blue
      light: "#5DADE2",
      dark: "#2980B9",
      contrastText: "#ffffff",
    },
    background: {
      default: "#F5F5F5", // Softer Gray
      paper: "#FFFFFF",
    },
    text: {
      primary: "#212121",
      secondary: "#757575",
    },
    error: {
      main: "#D32F2F",
    },
    success: {
      main: "#2E7D32",
    },
    info: {
      main: "#0288D1",
    },
    warning: {
      main: "#ED6C02",
    },
  },
  typography: {
    fontFamily: ['"Inter"', '"Helvetica"', '"Arial"', "sans-serif"].join(","),
    h1: {
      fontWeight: 700,
      fontSize: "2.75rem",
    },
    h2: {
      fontWeight: 700,
      fontSize: "2.25rem",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.75rem",
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.1rem",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 24px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: "#4527A0",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          borderBottom: "none",
          background: "linear-gradient(135deg, #2C3E50 0%, #34495E 100%)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "none",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        },
      },
    },
  },
});

export default theme;
