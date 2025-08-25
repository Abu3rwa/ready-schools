import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Box, 
  Typography, 
  TextField, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  Button, 
  Alert, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  IconButton, 
  Tabs, 
  Tab, 
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  Divider
} from "@mui/material";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import dayjs from "dayjs";
import DailyEmailPreferencesGuide from './DailyEmailPreferencesGuide';
import EmailContentManager from './EmailContentManager';
import { EmailContentProvider } from '../../contexts/EmailContentContext';
import { EMAIL_SECTIONS, DEFAULT_EMAIL_PREFERENCES, normalizePreferences } from '../../constants/emailSections';

const DailyEmailPreferences = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  
  // Basic email settings
  const [schoolName, setSchoolName] = useState("");
  const [teacherDisplayName, setTeacherDisplayName] = useState("");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState("");
  const [emailSignature, setEmailSignature] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState("{School} - Daily Update for {Student} ({Date})");
  
  // Unified email preferences using new structure
  const [emailPreferences, setEmailPreferences] = useState(DEFAULT_EMAIL_PREFERENCES);
  
  // Teacher personality preferences
  const [emailTone, setEmailTone] = useState("casual");
  const [emailFocus, setEmailFocus] = useState("academic");
  const [emailLength, setEmailLength] = useState("brief");
  const [emailStyle, setEmailStyle] = useState("conversational");
  
  // Tab and saving state management
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState({
    basic: false,
    personalization: false,
    parent: false,
    student: false,
    content: false
  });
  const [message, setMessage] = useState({
    basic: null,
    personalization: null,
    parent: null,
    student: null,
    content: null
  });
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser) return;
      
      try {
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          const data = snap.data();
          
          // Load basic settings
          if (data.school_name) setSchoolName(data.school_name);
          if (data.teacher_display_name) setTeacherDisplayName(data.teacher_display_name);
          if (data.school_logo_url) setSchoolLogoUrl(data.school_logo_url);
          if (data.email_signature) setEmailSignature(data.email_signature);
          if (data.dailyEmailSubjectTemplate) setSubjectTemplate(data.dailyEmailSubjectTemplate);
          
          // Load teacher personality preferences
          if (data.emailTone) setEmailTone(data.emailTone);
          if (data.emailFocus) setEmailFocus(data.emailFocus);
          if (data.emailLength) setEmailLength(data.emailLength);
          if (data.emailStyle) setEmailStyle(data.emailStyle);
          
          // Create unified email preferences from legacy and new data
          const unifiedPreferences = {
            parent: {
              enabled: true,
              sections: {
                attendance: { enabled: data.dailyEmailIncludeSections?.attendance !== false, showEmpty: true },
                grades: { enabled: data.dailyEmailIncludeSections?.grades !== false, showEmpty: false },
                subjectGrades: { enabled: data.dailyEmailIncludeSections?.subjectGrades !== false, showEmpty: false },
                behavior: { enabled: data.dailyEmailIncludeSections?.behavior !== false, showEmpty: true },
                assignments: { enabled: data.dailyEmailIncludeSections?.assignments !== false, showEmpty: true },
                upcoming: { enabled: data.dailyEmailIncludeSections?.upcoming !== false, showEmpty: true },
                lessons: { enabled: data.dailyEmailIncludeSections?.lessons !== false, showEmpty: false }
              }
            },
            student: {
              enabled: data.studentDailyEmail?.enabled || false,
              sections: {
                attendance: { enabled: data.studentDailyEmail?.contentToggles?.attendance ?? true, showEmpty: false },
                grades: { enabled: data.studentDailyEmail?.contentToggles?.grades ?? true, showEmpty: false },
                subjectGrades: { enabled: data.studentDailyEmail?.contentToggles?.subjectGrades ?? true, showEmpty: false },
                behavior: { enabled: data.studentDailyEmail?.contentToggles?.behavior ?? true, showEmpty: false },
                assignments: { enabled: data.studentDailyEmail?.contentToggles?.assignments ?? true, showEmpty: true },
                upcoming: { enabled: data.studentDailyEmail?.contentToggles?.upcoming ?? true, showEmpty: true },
                lessons: { enabled: data.studentDailyEmail?.contentToggles?.lessons ?? true, showEmpty: false }
              }
            }
          };
          setEmailPreferences(unifiedPreferences);
          
          console.log("Loaded unified email preferences:", unifiedPreferences);
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
        setMessage(prev => ({ ...prev, basic: { type: "error", text: "Failed to load preferences" } }));
      }
    };
    
    loadPreferences();
  }, [currentUser?.uid]);

  const handleBasicSave = async () => {
    if (!currentUser) return;
    setSaving(prev => ({ ...prev, basic: true }));
    setMessage(prev => ({ ...prev, basic: null }));
    
    try {
      const ref = doc(db, "users", currentUser.uid);
      await setDoc(ref, {
        school_name: schoolName,
        teacher_display_name: teacherDisplayName,
        school_logo_url: schoolLogoUrl,
        dailyEmailSubjectTemplate: subjectTemplate,
      }, { merge: true });
      
      setMessage(prev => ({ ...prev, basic: { type: "success", text: t('notifications.saved') } }));
    } catch (error) {
      setMessage(prev => ({ ...prev, basic: { type: "error", text: error.message || t('errors.general') } }));
    } finally {
      setSaving(prev => ({ ...prev, basic: false }));
    }
  };

  const handlePersonalizationSave = async () => {
    if (!currentUser) return;
    setSaving(prev => ({ ...prev, personalization: true }));
    setMessage(prev => ({ ...prev, personalization: null }));
    
    try {
      const ref = doc(db, "users", currentUser.uid);
      await setDoc(ref, {
        emailTone: emailTone,
        emailFocus: emailFocus,
        emailLength: emailLength,
        emailStyle: emailStyle,
        email_signature: emailSignature,
      }, { merge: true });
      
      setMessage(prev => ({ ...prev, personalization: { type: "success", text: t('notifications.saved') } }));
    } catch (error) {
      setMessage(prev => ({ ...prev, personalization: { type: "error", text: error.message || t('errors.general') } }));
    } finally {
      setSaving(prev => ({ ...prev, personalization: false }));
    }
  };

  const handleEmailPreferencesSave = async (emailType) => {
    if (!currentUser) return;
    
    // Basic validation - ensure at least one section is enabled
    const sections = emailPreferences[emailType]?.sections || {};
    const enabledSections = Object.values(sections).filter(section => section.enabled);
    
    if (enabledSections.length === 0) {
      setMessage(prev => ({ 
        ...prev, 
        [emailType]: { 
          type: "error", 
          text: "At least one section must be enabled" 
        } 
      }));
      return;
    }
    
    setSaving(prev => ({ ...prev, [emailType]: true }));
    setMessage(prev => ({ ...prev, [emailType]: null }));
    
    try {
      const ref = doc(db, "users", currentUser.uid);
      
      // Save unified preferences structure
      await setDoc(ref, {
        unifiedEmailPreferences: emailPreferences,
        // Also save legacy formats for backward compatibility
        dailyEmailIncludeSections: Object.fromEntries(
          Object.entries(emailPreferences.parent.sections).map(([section, prefs]) => [section, prefs.enabled])
        ),
        studentDailyEmail: {
          enabled: emailPreferences.student.enabled,
          contentToggles: Object.fromEntries(
            Object.entries(emailPreferences.student.sections).map(([section, prefs]) => [section, prefs.enabled])
          ),
        }
      }, { merge: true });
      
      setMessage(prev => ({ 
        ...prev, 
        [emailType]: { type: "success", text: t('notifications.saved') } 
      }));
    } catch (error) {
      setMessage(prev => ({ 
        ...prev, 
        [emailType]: { type: "error", text: error.message || t('errors.general') } 
      }));
    } finally {
      setSaving(prev => ({ ...prev, [emailType]: false }));
    }
  };

  const handleParentEmailToggle = (checked) => {
    setEmailPreferences(prev => ({
      ...prev,
      parent: {
        ...prev.parent,
        enabled: checked
      }
    }));
  };

  const handleStudentEmailToggle = (checked) => {
    setEmailPreferences(prev => ({
      ...prev,
      student: {
        ...prev.student,
        enabled: checked
      }
    }));
  };

  const handleSectionToggle = (emailType, section, property, value) => {
    setEmailPreferences(prev => ({
      ...prev,
      [emailType]: {
        ...prev[emailType],
        sections: {
          ...prev[emailType].sections,
          [section]: {
            ...prev[emailType].sections[section],
            [property]: value
          }
        }
      }
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const previewSubject = subjectTemplate
    .replaceAll("{School}", schoolName || "Your School")
    .replaceAll("{Student}", "Alex Johnson")
    .replaceAll("{Date}", dayjs().format("MMM DD, YYYY"));

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`email-tabpanel-${index}`}
      aria-labelledby={`email-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );

  const renderSectionControls = (emailType, title, description) => {
    const preferences = emailPreferences[emailType];
    
    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title={title}
          subheader={description}
          action={
            <Switch
              checked={preferences.enabled}
              onChange={(e) => emailType === 'parent' ? 
                handleParentEmailToggle(e.target.checked) : 
                handleStudentEmailToggle(e.target.checked)
              }
              color="primary"
            />
          }
        />
        <CardContent>
          {preferences.enabled && (
            <>
              <Typography variant="h6" gutterBottom>
                Content Sections
              </Typography>
              <Grid container spacing={2}>
                {Object.values(EMAIL_SECTIONS).map((section) => {
                  const sectionPrefs = preferences.sections[section] || { enabled: true, showEmpty: true };
                  const sectionLabel = getSectionLabel(section);
                  
                  return (
                    <Grid item xs={12} md={6} key={section}>
                      <Box sx={{ 
                        p: 2, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        backgroundColor: sectionPrefs.enabled ? 'action.selected' : 'background.default'
                      }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={sectionPrefs.enabled}
                              onChange={(e) => handleSectionToggle(emailType, section, 'enabled', e.target.checked)}
                            />
                          }
                          label={<Typography variant="subtitle2">{sectionLabel}</Typography>}
                        />
                        
                        {sectionPrefs.enabled && shouldShowEmptyOption(section) && (
                          <Box sx={{ ml: 4, mt: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={sectionPrefs.showEmpty}
                                  onChange={(e) => handleSectionToggle(emailType, section, 'showEmpty', e.target.checked)}
                                />
                              }
                              label={
                                <Typography variant="caption" color="text.secondary">
                                  Show even when empty
                                </Typography>
                              }
                            />
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
              
              {validateSectionConfiguration(emailType) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Warning: All sections are disabled. Recipients won't receive any content in their emails.
                </Alert>
              )}
            </>
          )}
        </CardContent>
        
        <Box sx={{ p: 2, display: 'flex', gap: 1, borderTop: 1, borderColor: 'divider' }}>
          <Button
            variant="contained"
            onClick={() => handleEmailPreferencesSave(emailType)}
            disabled={saving[emailType]}
          >
            {saving[emailType] ? 'Saving...' : `Save ${title} Settings`}
          </Button>
        </Box>
        
        {message[emailType] && (
          <Box sx={{ p: 2, pt: 0 }}>
            <Alert severity={message[emailType].type}>{message[emailType].text}</Alert>
          </Box>
        )}
      </Card>
    );
  };

  const getSectionLabel = (section) => {
    const labels = {
      [EMAIL_SECTIONS.ATTENDANCE]: 'Attendance',
      [EMAIL_SECTIONS.GRADES]: 'New Grades',
      [EMAIL_SECTIONS.SUBJECT_GRADES]: 'Subject Grade Summary',
      [EMAIL_SECTIONS.BEHAVIOR]: 'Behavior & Social Learning',
      [EMAIL_SECTIONS.ASSIGNMENTS]: 'Today\'s Activities',
      [EMAIL_SECTIONS.UPCOMING]: 'Upcoming Assignments',
      [EMAIL_SECTIONS.LESSONS]: 'Today\'s Lessons',
      [EMAIL_SECTIONS.REMINDERS]: 'Important Reminders',
    };
    return labels[section] || section;
  };

  const shouldShowEmptyOption = (section) => {
    // Some sections benefit from "show empty" option, others don't
    return [
      EMAIL_SECTIONS.BEHAVIOR,
      EMAIL_SECTIONS.ATTENDANCE,
      EMAIL_SECTIONS.GRADES,
      EMAIL_SECTIONS.ASSIGNMENTS,
      EMAIL_SECTIONS.LESSONS
    ].includes(section);
  };

  const validateSectionConfiguration = (emailType) => {
    const preferences = emailPreferences[emailType];
    if (!preferences.enabled) return false;
    
    return !Object.values(preferences.sections).some(section => section.enabled);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('communication.dailyEmailPreferences')}
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="email preferences tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Basic Settings" />
          <Tab label="Personalization" />
          <Tab label="Parent Emails" />
          <Tab label="Student Emails" />
          <Tab label="Content Library" />
        </Tabs>
      </Box>

      {/* Basic Settings Tab */}
      <TabPanel value={activeTab} index={0}>
        <Typography variant="h6" gutterBottom>
          School & Email Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure your school information and email template settings.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label={t('communication.schoolName')}
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              fullWidth
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label={t('communication.teacherDisplayName')}
              value={teacherDisplayName}
              onChange={(e) => setTeacherDisplayName(e.target.value)}
              fullWidth
              margin="dense"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={t('communication.schoolLogoUrl', 'School Logo URL (optional)')}
              value={schoolLogoUrl}
              onChange={(e) => setSchoolLogoUrl(e.target.value)}
              fullWidth
              margin="dense"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={t('communication.subjectTemplate')}
              value={subjectTemplate}
              onChange={(e) => setSubjectTemplate(e.target.value)}
              helperText={t('communication.subjectTemplateHelp', 'Use tokens: {School}, {Student}, {Date}')}
              fullWidth
              margin="dense"
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Preview: {previewSubject}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleBasicSave}
            disabled={saving.basic}
          >
            {saving.basic ? 'Saving...' : 'Save Basic Settings'}
          </Button>
        </Box>
        {message.basic && (
          <Alert sx={{ mt: 2 }} severity={message.basic.type}>{message.basic.text}</Alert>
        )}
      </TabPanel>

      {/* Personalization Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h6">
            Email Personalization Style
          </Typography>
          <IconButton onClick={() => setGuideOpen(true)} size="small">
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Customize how your daily update emails sound to parents. These settings make emails feel more personal and less automated.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Communication Tone</InputLabel>
              <Select
                value={emailTone}
                onChange={(e) => setEmailTone(e.target.value)}
                label="Communication Tone"
              >
                <MenuItem value="casual">Casual & Friendly</MenuItem>
                <MenuItem value="enthusiastic">Enthusiastic & Energetic</MenuItem>
                <MenuItem value="supportive">Supportive & Caring</MenuItem>
                <MenuItem value="professional">Professional & Formal</MenuItem>
                <MenuItem value="caring">Caring & Nurturing</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Email Focus</InputLabel>
              <Select
                value={emailFocus}
                onChange={(e) => setEmailFocus(e.target.value)}
                label="Email Focus"
              >
                <MenuItem value="academic">Academic Progress</MenuItem>
                <MenuItem value="social">Social Development</MenuItem>
                <MenuItem value="behavioral">Behavior & Conduct</MenuItem>
                <MenuItem value="holistic">Holistic Development</MenuItem>
                <MenuItem value="student">Student-Specific</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Email Length</InputLabel>
              <Select
                value={emailLength}
                onChange={(e) => setEmailLength(e.target.value)}
                label="Email Length"
              >
                <MenuItem value="brief">Brief & Concise</MenuItem>
                <MenuItem value="detailed">Detailed & Comprehensive</MenuItem>
                <MenuItem value="comprehensive">Comprehensive & Thorough</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Writing Style</InputLabel>
              <Select
                value={emailStyle}
                onChange={(e) => setEmailStyle(e.target.value)}
                label="Writing Style"
              >
                <MenuItem value="conversational">Conversational</MenuItem>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="friendly">Friendly & Warm</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Preview:</strong> With your current settings, emails will sound {
              emailTone === 'casual' ? 'casual and friendly' :
              emailTone === 'enthusiastic' ? 'enthusiastic and energetic' :
              emailTone === 'supportive' ? 'supportive and caring' :
              emailTone === 'professional' ? 'professional and formal' :
              'caring and nurturing'
            }, focusing on {
              emailFocus === 'academic' ? 'academic progress' :
              emailFocus === 'social' ? 'social development' :
              emailFocus === 'behavioral' ? 'behavior and conduct' :
              emailFocus === 'holistic' ? 'holistic development' :
              'student-specific achievements'
            }.
          </Typography>
        </Box>
        
        <TextField
          label={t('communication.emailSignature')}
          value={emailSignature}
          onChange={(e) => setEmailSignature(e.target.value)}
          placeholder={t('communication.emailSignaturePlaceholder', "Warm regards,\nMs. Smith\nYour School")}
          fullWidth
          margin="normal"
          multiline
          minRows={3}
        />

        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handlePersonalizationSave}
            disabled={saving.personalization}
          >
            {saving.personalization ? 'Saving...' : 'Save Personalization'}
          </Button>
        </Box>
        {message.personalization && (
          <Alert sx={{ mt: 2 }} severity={message.personalization.type}>{message.personalization.text}</Alert>
        )}
      </TabPanel>

      {/* Parent Emails Tab */}
      <TabPanel value={activeTab} index={2}>
        {renderSectionControls(
          'parent', 
          'Parent Email Settings', 
          'Configure what content appears in emails sent to parents and guardians.'
        )}
      </TabPanel>

      {/* Student Emails Tab */}
      <TabPanel value={activeTab} index={3}>
        {renderSectionControls(
          'student', 
          'Student Email Settings', 
          'Configure what content appears in emails sent directly to students.'
        )}
      </TabPanel>

      {/* Content Library Tab */}
      <TabPanel value={activeTab} index={4}>
        <Typography variant="h6" gutterBottom>
          Email Content Library
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Manage your custom email content templates and phrases.
        </Typography>
        
        <EmailContentProvider teacherId={currentUser?.uid}>
          <EmailContentManager />
        </EmailContentProvider>
      </TabPanel>

      <DailyEmailPreferencesGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </Box>
  );
};

export default DailyEmailPreferences;