import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, TextField, FormGroup, FormControlLabel, Checkbox, Button, Alert, FormControl, InputLabel, Select, MenuItem, Divider, IconButton } from "@mui/material";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import dayjs from "dayjs";
import DailyEmailPreferencesGuide from './DailyEmailPreferencesGuide';

const DailyEmailPreferences = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [schoolName, setSchoolName] = useState("");
  const [teacherDisplayName, setTeacherDisplayName] = useState("");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState("");
  const [emailSignature, setEmailSignature] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState("{School} - Daily Update for {Student} ({Date})");
  const [includeSections, setIncludeSections] = useState({
    attendance: true,
    grades: true,
    behavior: true,
    assignments: true,
    upcoming: true,
    subjectGrades: true,
    lessons: true
  });
  
  // Phase 2: Teacher personality preferences
  const [emailTone, setEmailTone] = useState("casual");
  const [emailFocus, setEmailFocus] = useState("academic");
  const [emailLength, setEmailLength] = useState("brief");
  const [emailStyle, setEmailStyle] = useState("conversational");
  
  // Student Email Preferences
  const [studentEmailEnabled, setStudentEmailEnabled] = useState(false);
  const [studentEmailSchedule, setStudentEmailSchedule] = useState({
    hour: 8,
    minute: 0,
    days: ["sunday", "monday", "tuesday", "wednesday", "thursday"],
  });
  const [studentEmailContentToggles, setStudentEmailContentToggles] = useState({
    assignments: true,
    grades: true,
    lessons: true,
    upcoming: true,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        if (d.school_name) setSchoolName(d.school_name);
        if (d.teacher_display_name) setTeacherDisplayName(d.teacher_display_name);
        if (d.school_logo_url) setSchoolLogoUrl(d.school_logo_url);
        if (d.email_signature) setEmailSignature(d.email_signature);
        if (d.dailyEmailSubjectTemplate) setSubjectTemplate(d.dailyEmailSubjectTemplate);
        if (d.dailyEmailIncludeSections) setIncludeSections(prev => ({ ...prev, ...d.dailyEmailIncludeSections }));
        // Load Phase 2 teacher personality preferences
        if (d.emailTone) setEmailTone(d.emailTone);
        if (d.emailFocus) setEmailFocus(d.emailFocus);
        if (d.emailLength) setEmailLength(d.emailLength);
        if (d.emailStyle) setEmailStyle(d.emailStyle);
        // Load Student Email Preferences
        if (d.studentDailyEmail) {
          setStudentEmailEnabled(d.studentDailyEmail.enabled || false);
          setStudentEmailSchedule(d.studentDailyEmail.schedule || studentEmailSchedule);
          setStudentEmailContentToggles(d.studentDailyEmail.contentToggles || studentEmailContentToggles);
        }
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  const handleToggle = (key) => (e) => {
    setIncludeSections((prev) => ({ ...prev, [key]: e.target.checked }));
  };

  const handleStudentScheduleChange = (key, value) => {
    setStudentEmailSchedule(prev => ({ ...prev, [key]: value }));
  };

  const handleStudentScheduleDayToggle = (day) => (e) => {
    setStudentEmailSchedule(prev => {
      const newDays = [...prev.days];
      if (e.target.checked) {
        newDays.push(day);
      } else {
        const idx = newDays.indexOf(day);
        if (idx >= 0) newDays.splice(idx, 1);
      }
      return { ...prev, days: newDays };
    });
  };

  const handleStudentContentToggle = (key) => (e) => {
    setStudentEmailContentToggles(prev => ({ ...prev, [key]: e.target.checked }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    setMessage(null);
    try {
      const ref = doc(db, "users", currentUser.uid);
      await setDoc(ref, {
        school_name: schoolName,
        teacher_display_name: teacherDisplayName,
        school_logo_url: schoolLogoUrl,
        email_signature: emailSignature,
        dailyEmailSubjectTemplate: subjectTemplate,
        dailyEmailIncludeSections: includeSections,
        // Phase 2: Save teacher personality preferences
        emailTone: emailTone,
        emailFocus: emailFocus,
        emailLength: emailLength,
        emailStyle: emailStyle,
        // Student Email Preferences
        studentDailyEmail: {
          enabled: studentEmailEnabled,
          schedule: studentEmailSchedule,
          contentToggles: studentEmailContentToggles,
        },
      }, { merge: true });
      setMessage({ type: "success", text: t('notifications.saved') });
    } catch (e) {
      setMessage({ type: "error", text: e.message || t('errors.general') });
    } finally {
      setSaving(false);
    }
  };

  const previewSubject = subjectTemplate
    .replaceAll("{School}", schoolName || "Your School")
    .replaceAll("{Student}", "Alex Johnson")
    .replaceAll("{Date}", dayjs().format("MMM DD, YYYY"));

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {t('communication.dailyEmailPreferences')}
      </Typography>
      <TextField
        label={t('communication.schoolName')}
        value={schoolName}
        onChange={(e) => setSchoolName(e.target.value)}
        fullWidth
        margin="dense"
      />
      <TextField
        label={t('communication.teacherDisplayName')}
        value={teacherDisplayName}
        onChange={(e) => setTeacherDisplayName(e.target.value)}
        fullWidth
        margin="dense"
      />
      <TextField
        label={t('communication.schoolLogoUrl', 'School Logo URL (optional)')}
        value={schoolLogoUrl}
        onChange={(e) => setSchoolLogoUrl(e.target.value)}
        fullWidth
        margin="dense"
      />
      <TextField
        label={t('communication.subjectTemplate')}
        value={subjectTemplate}
        onChange={(e) => setSubjectTemplate(e.target.value)}
        helperText={t('communication.subjectTemplateHelp', 'Use tokens: {School}, {Student}, {Date}')}
        fullWidth
        margin="dense"
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Preview: {previewSubject}
      </Typography>
      <FormGroup row>
        <FormControlLabel control={<Checkbox checked={includeSections.attendance} onChange={handleToggle('attendance')} />} label={t('communication.attendance')} />
        <FormControlLabel control={<Checkbox checked={includeSections.grades} onChange={handleToggle('grades')} />} label={t('communication.grades')} />
        <FormControlLabel control={<Checkbox checked={includeSections.behavior} onChange={handleToggle('behavior')} />} label={t('communication.behavior')} />
        <FormControlLabel control={<Checkbox checked={includeSections.assignments} onChange={handleToggle('assignments')} />} label={t('communication.activities')} />
        <FormControlLabel control={<Checkbox checked={includeSections.upcoming} onChange={handleToggle('upcoming')} />} label={t('communication.upcoming')} />
        <FormControlLabel control={<Checkbox checked={includeSections.subjectGrades} onChange={handleToggle('subjectGrades')} />} label={t('communication.subjectGrades')} />
        <FormControlLabel control={<Checkbox checked={includeSections.lessons} onChange={handleToggle('lessons')} />} label={t('communication.lessons', 'Lessons')} />
      </FormGroup>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Phase 2: Teacher Personality Preferences */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mb: 0 }}>
          Email Personalization Style
        </Typography>
        <IconButton onClick={() => setGuideOpen(true)} size="small">
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
      </Box>
      <Typography variant="body2" color="text.secondary" paragraph>
        Customize how your daily update emails sound to parents. These settings make emails feel more personal and less automated.
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
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
      </Box>
      
      {/* Preview of how the tone will sound */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Preview:</strong> With your current settings, emails will sound {emailTone === 'casual' ? 'casual and friendly' : 
          emailTone === 'enthusiastic' ? 'enthusiastic and energetic' :
          emailTone === 'supportive' ? 'supportive and caring' :
          emailTone === 'professional' ? 'professional and formal' :
          'caring and nurturing'}, focusing on {emailFocus === 'academic' ? 'academic progress' :
          emailFocus === 'social' ? 'social development' :
          emailFocus === 'behavioral' ? 'behavior and conduct' :
          emailFocus === 'holistic' ? 'holistic development' :
          'student-specific achievements'}.
        </Typography>
      </Box>
      <TextField
        label={t('communication.emailSignature')}
        value={emailSignature}
        onChange={(e) => setEmailSignature(e.target.value)}
        placeholder={t('communication.emailSignaturePlaceholder', "Warm regards,\nMs. Smith\nYour School")}
        fullWidth
        margin="dense"
        multiline
        minRows={3}
      />

      <Divider sx={{ my: 3 }} />

      {/* Student Email Preferences */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ mb: 0 }}>
          Student Daily Email Preferences
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure the daily email updates sent directly to students.
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={studentEmailEnabled}
            onChange={(e) => setStudentEmailEnabled(e.target.checked)}
          />
        }
        label="Enable Student Daily Emails"
      />

      {studentEmailEnabled && (
        <Box sx={{ ml: 3, mt: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Schedule
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Hour</InputLabel>
              <Select
                value={studentEmailSchedule.hour}
                onChange={(e) => handleStudentScheduleChange('hour', e.target.value)}
                label="Hour"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <MenuItem key={i} value={i}>
                    {i < 10 ? `0${i}` : i}:00
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Minute</InputLabel>
              <Select
                value={studentEmailSchedule.minute}
                onChange={(e) => handleStudentScheduleChange('minute', e.target.value)}
                label="Minute"
              >
                <MenuItem value={0}>:00</MenuItem>
                <MenuItem value={15}>:15</MenuItem>
                <MenuItem value={30}>:30</MenuItem>
                <MenuItem value={45}>:45</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Days of the Week
          </Typography>
          <FormGroup row>
            {[ "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
              <FormControlLabel
                key={day}
                control={
                  <Checkbox
                    checked={studentEmailSchedule.days.includes(day)}
                    onChange={handleStudentScheduleDayToggle(day)}
                  />
                }
                label={day.charAt(0).toUpperCase() + day.slice(1)}
              />
            ))}
          </FormGroup>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
            Content Toggles
          </Typography>
          <FormGroup row>
            <FormControlLabel control={<Checkbox checked={studentEmailContentToggles.assignments} onChange={handleStudentContentToggle('assignments')} />} label="Assignments" />
            <FormControlLabel control={<Checkbox checked={studentEmailContentToggles.grades} onChange={handleStudentContentToggle('grades')} />} label="Grades" />
            <FormControlLabel control={<Checkbox checked={studentEmailContentToggles.lessons} onChange={handleStudentContentToggle('lessons')} />} label="Lessons" />
            <FormControlLabel control={<Checkbox checked={studentEmailContentToggles.upcoming} onChange={handleStudentContentToggle('upcoming')} />} label="Upcoming" />
          </FormGroup>
        </Box>
      )}

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{t('common.save')}</Button>
      </Box>
      {message && (
        <Alert sx={{ mt: 2 }} severity={message.type}>{message.text}</Alert>
      )}

      <DailyEmailPreferencesGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </Box>
  );
};

export default DailyEmailPreferences;
 