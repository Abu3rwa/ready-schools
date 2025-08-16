import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, TextField, FormGroup, FormControlLabel, Checkbox, Button, Alert } from "@mui/material";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import dayjs from "dayjs";

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
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

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
        if (d.dailyEmailIncludeSections) setIncludeSections({ ...includeSections, ...d.dailyEmailIncludeSections });
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  const handleToggle = (key) => (e) => {
    setIncludeSections((prev) => ({ ...prev, [key]: e.target.checked }));
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
      </FormGroup>
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
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{t('common.save')}</Button>
      </Box>
      {message && (
        <Alert sx={{ mt: 2 }} severity={message.type}>{message.text}</Alert>
      )}
    </Box>
  );
};

export default DailyEmailPreferences; 