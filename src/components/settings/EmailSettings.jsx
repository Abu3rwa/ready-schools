import React from "react";
import { useTranslation } from "react-i18next";
import { Paper, Typography, Box, Divider } from "@mui/material";
import GmailSetup from "../email/GmailSetup";
import DailyEmailPreferences from "./DailyEmailPreferences";

const EmailSettings = () => {
  const { t } = useTranslation();
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('communication.emailSettings')}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t('communication.emailSettingsDescription', 'Configure your email preferences and integrations.')}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ mb: 3 }}>
        <GmailSetup />
      </Box>
      <Divider sx={{ my: 2 }} />
      <DailyEmailPreferences />
    </Paper>
  );
};

export default EmailSettings;
