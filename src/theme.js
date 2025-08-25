import { createTheme } from "@mui/material/styles";

// Brand colors from DailyUpdateManager.jsx
const BRAND_BLUE = "#1459a9";
const BRAND_RED = "#ed2024";
const BRAND_LIGHT_GREY = "#f8f9fa";
const BRAND_WHITE = "#ffffff";
const ACCENT_COLOR = "#FFC107"; // A nice professional amber color

export const theme = createTheme({
  palette: {
    primary: {
      main: BRAND_BLUE,
      contrastText: BRAND_WHITE,
    },
    secondary: {
      main: BRAND_RED,
      contrastText: BRAND_WHITE,
    },
    background: {
      default: BRAND_LIGHT_GREY,
      paper: BRAND_WHITE,
    },
    accent: {
      main: ACCENT_COLOR,
      contrastText: BRAND_WHITE,
    },
    // You can add more colors here if needed
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Background handled by component-level gradient
          color: BRAND_WHITE,
        },
      },
    },
    MuiDrawer: {
        styleOverrides: {
            paper: {
                // Background handled by component-level gradient
                color: BRAND_WHITE,
            }
        }
    }
  },
});
