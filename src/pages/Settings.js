import React from "react";
import { Container, Box, Typography, Grid } from "@mui/material";
import SubjectsManager from "../components/settings/SubjectsManager";

const Settings = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure your account and classroom preferences.
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SubjectsManager />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Settings;

