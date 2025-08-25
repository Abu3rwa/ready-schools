import React from "react";
import { useTranslation } from "react-i18next";
import { Container, Box, Typography, Grid } from "@mui/material";
import SubjectsManager from "../components/settings/SubjectsManager";
import EmailSettings from "../components/settings/EmailSettings";
import AcademicPeriodsManager from "../components/settings/AcademicPeriodsManager";
import CharacterTraitsManager from "../components/settings/CharacterTraitsManager";
import GmailSetup from "../components/email/GmailSetup";

const Settings = () => {
  const { t } = useTranslation();
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('settings.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('settings.description', 'Configure your account and classroom preferences.')}
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <CharacterTraitsManager />
        </Grid>
        <Grid item xs={12}>
          <AcademicPeriodsManager />
        </Grid>
        <Grid item xs={12}>
          <SubjectsManager />
        </Grid>
        <Grid item xs={12}>
          <EmailSettings />
        </Grid>
        {/* <Grid item xs={12}>
          <GmailSetup />
        </Grid> */}
      </Grid>
    </Container>
  );
};

export default Settings;
