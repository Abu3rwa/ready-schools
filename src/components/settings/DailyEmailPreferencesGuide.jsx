import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography, Box } from '@mui/material';

const DailyEmailPreferencesGuide = ({ open, onClose }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('settings.emailPersonalizationGuide.title', 'Email Personalization Guide')}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText component="div">
          <Typography paragraph>
            {t('settings.emailPersonalizationGuide.intro', 'These settings help you customize the tone, focus, length, and style of the daily update emails sent to parents. This guide explains each option to help you create emails that reflect your communication style.')}
          </Typography>

          <Box sx={{ my: 2 }}>
            <Typography variant="h6" gutterBottom>{t('settings.emailPersonalizationGuide.toneTitle', 'Communication Tone')}</Typography>
            <Typography paragraph>
              {t('settings.emailPersonalizationGuide.toneDescription', 'This setting determines the overall feeling of the email.')}
            </Typography>
            <ul>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.toneCasual', 'Casual & Friendly:')}</strong> {t('settings.emailPersonalizationGuide.toneCasualDesc', 'For a relaxed and approachable feel.')}</Typography></li>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.toneEnthusiastic', 'Enthusiastic & Energetic:')}</strong> {t('settings.emailPersonalizationGuide.toneEnthusiasticDesc', 'Conveys excitement and positivity.')}</Typography></li>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.toneSupportive', 'Supportive & Caring:')}</strong> {t('settings.emailPersonalizationGuide.toneSupportiveDesc', 'Shows empathy and a focus on student well-being.')}</Typography></li>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.toneProfessional', 'Professional & Formal:')}</strong> {t('settings.emailPersonalizationGuide.toneProfessionalDesc', 'Maintains a formal and traditional tone.')}</Typography></li>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.toneCaring', 'Caring & Nurturing:')}</strong> {t('settings.emailPersonalizationGuide.toneCaringDesc', 'Emphasizes a gentle and nurturing approach.')}</Typography></li>
            </ul>
          </Box>

          <Box sx={{ my: 2 }}>
            <Typography variant="h6" gutterBottom>{t('settings.emailPersonalizationGuide.focusTitle', 'Email Focus')}</Typography>
            <Typography paragraph>
              {t('settings.emailPersonalizationGuide.focusDescription', 'This setting directs the email\'s main theme.')}
            </Typography>
            <ul>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.focusAcademic', 'Academic Progress:')}</strong> {t('settings.emailPersonalizationGuide.focusAcademicDesc', 'Highlights grades, assignments, and learning goals.')}</Typography></li>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.focusSocial', 'Social Development:')}</strong> {t('settings.emailPersonalizationGuide.focusSocialDesc', 'Focuses on interactions with peers and classroom community.')}</Typography></li>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.focusBehavioral', 'Behavior & Conduct:')}</strong> {t('settings.emailPersonalizationGuide.focusBehavioralDesc', 'Centers on classroom behavior and conduct.')}</Typography></li>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.focusHolistic', 'Holistic Development:')}</strong> {t('settings.emailPersonalizationGuide.focusHolisticDesc', 'Provides a balanced view of academic, social, and behavioral aspects.')}</Typography></li>
               <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.focusStudent', 'Student-Specific:')}</strong> {t('settings.emailPersonalizationGuide.focusStudentDesc', 'Tailors the content to individual student achievements and challenges.')}</Typography></li>
            </ul>
          </Box>

          <Box sx={{ my: 2 }}>
            <Typography variant="h6" gutterBottom>{t('settings.emailPersonalizationGuide.lengthTitle', 'Email Length')}</Typography>
            <Typography paragraph>
              {t('settings.emailPersonalizationGuide.lengthDescription', 'This setting controls the level of detail in the email.')}
            </Typography>
            <ul>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.lengthBrief', 'Brief & Concise:')}</strong> {t('settings.emailPersonalizationGuide.lengthBriefDesc', 'Provides a quick summary.')}</Typography></li>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.lengthDetailed', 'Detailed & Comprehensive:')}</strong> {t('settings.emailPersonalizationGuide.lengthDetailedDesc', 'Offers more in-depth information and examples.')}</Typography></li>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.lengthComprehensive', 'Comprehensive & Thorough:')}</strong> {t('settings.emailPersonalizationGuide.lengthComprehensiveDesc', 'Gives a full, exhaustive report.')}</Typography></li>
            </ul>
          </Box>

          <Box sx={{ my: 2 }}>
            <Typography variant="h6" gutterBottom>{t('settings.emailPersonalizationGuide.styleTitle', 'Writing Style')}</Typography>
            <Typography paragraph>
              {t('settings.emailPersonalizationGuide.styleDescription', 'This setting defines the grammatical style of the email.')}
            </Typography>
            <ul>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.styleConversational', 'Conversational:')}</strong> {t('settings.emailPersonalizationGuide.styleConversationalDesc', 'Uses a natural, chatty style.')}</Typography></li>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.styleProfessional', 'Professional:')}</strong> {t('settings.emailPersonalizationGuide.styleProfessionalDesc', 'Uses formal language and structure.')}</Typography></li>
              <li><Typography variant="body2"><strong>{t('settings.emailPersonalizationGuide.styleFriendly', 'Friendly & Warm:')}</strong> {t('settings.emailPersonalizationGuide.styleFriendlyDesc', 'Uses warm and inviting language.')}</Typography></li>
            </ul>
          </Box>

        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close', 'Close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DailyEmailPreferencesGuide;
