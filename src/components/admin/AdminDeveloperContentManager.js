import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Tabs,
  Tab,
  Alert,
  Divider,
  Paper,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
  Person as PersonIcon,
  Psychology as MotivationIcon,
  Flag as ChallengeIcon,
  Lightbulb as PhilosophyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getDeveloperPageContent, updateDeveloperPageContent } from '../../services/developerPageService';

/**
 * AdminDeveloperContentManager Component
 * Comprehensive admin interface for managing developer page content including
 * bio, motivation, challenge (painPoints), and philosophy sections
 */
const AdminDeveloperContentManager = ({ onContentUpdate }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewDialog, setPreviewDialog] = useState({ open: false, content: '', title: '' });
  
  // Content state
  const [content, setContent] = useState({
    profile: {
      name: '',
      role: '',
      bio: '',
      experience: '',
      specialization: '',
      school: '',
      background: '',
      contact: {
        email: '',
        linkedin: '',
        github: '',
        portfolio: '',
        consulting: ''
      }
    },
    journey: {
      motivation: '',
      painPoints: '',
      philosophy: ''
    },
    credentials: {
      teaching: [],
      technical: []
    }
  });

  // Track edited fields
  const [editedFields, setEditedFields] = useState(new Set());

  const contentSections = [
    {
      id: 'profile',
      label: t('admin.profileContent', 'Profile Content'),
      icon: <PersonIcon />,
      fields: [
        { key: 'name', label: t('admin.name', 'Name'), multiline: false },
        { key: 'role', label: t('admin.role', 'Role'), multiline: false },
        { key: 'bio', label: t('admin.bio', 'Bio'), multiline: true, rows: 4 },
        { key: 'experience', label: t('admin.experience', 'Experience'), multiline: true, rows: 3 },
        { key: 'specialization', label: t('admin.specialization', 'Specialization'), multiline: true, rows: 2 },
        { key: 'school', label: t('admin.school', 'School/Institution'), multiline: false },
        { key: 'background', label: t('admin.background', 'Background'), multiline: true, rows: 3 }
      ]
    },
    {
      id: 'motivation',
      label: t('admin.motivationContent', 'The Spark'),
      icon: <MotivationIcon />,
      description: t('admin.motivationDesc', 'What drove you to transition from teaching to coding'),
      field: 'journey.motivation'
    },
    {
      id: 'painPoints',
      label: t('admin.challengeContent', 'The Challenge'),
      icon: <ChallengeIcon />,
      description: t('admin.challengeDesc', 'Problems you faced daily in the classroom that needed solving'),
      field: 'journey.painPoints'
    },
    {
      id: 'philosophy',
      label: t('admin.philosophyContent', 'The Solution'),
      icon: <PhilosophyIcon />,
      description: t('admin.philosophyDesc', 'Your approach to educational technology and development'),
      field: 'journey.philosophy'
    }
  ];

  useEffect(() => {
    if (isAdmin) {
      loadContent();
    }
  }, [isAdmin]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError('');
      const contentData = await getDeveloperPageContent();
      setContent(contentData);
      setEditedFields(new Set());
    } catch (err) {
      setError(err.message || t('admin.loadError', 'Failed to load content'));
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (field, value) => {
    const newEditedFields = new Set(editedFields);
    newEditedFields.add(field);
    setEditedFields(newEditedFields);

    if (field.includes('.')) {
      const [section, key] = field.split('.');
      setContent(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }));
    } else {
      setContent(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [field]: value
        }
      }));
    }
  };

  const handleSaveContent = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await updateDeveloperPageContent(content);
      
      setSuccess(t('admin.saveSuccess', 'Content updated successfully!'));
      setEditedFields(new Set());
      
      // Notify parent component
      if (onContentUpdate) {
        onContentUpdate();
      }
    } catch (err) {
      setError(err.message || t('admin.saveError', 'Failed to save content'));
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (content, title) => {
    setPreviewDialog({ open: true, content, title });
  };

  const renderProfileFields = () => {
    const profileSection = contentSections[0];
    return (
      <Grid container spacing={3}>
        {profileSection.fields.map((field) => (
          <Grid item xs={12} md={field.multiline ? 12 : 6} key={field.key}>
            <TextField
              fullWidth
              label={field.label}
              value={content.profile[field.key] || ''}
              onChange={(e) => handleContentChange(field.key, e.target.value)}
              multiline={field.multiline}
              rows={field.rows || 1}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: editedFields.has(field.key) ? 'action.hover' : 'background.paper'
                }
              }}
              InputProps={{
                endAdornment: content.profile[field.key] && (
                  <IconButton
                    size="small"
                    onClick={() => handlePreview(content.profile[field.key], field.label)}
                  >
                    <PreviewIcon fontSize="small" />
                  </IconButton>
                )
              }}
            />
          </Grid>
        ))}
        
        {/* Contact Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            {t('admin.contactInfo', 'Contact Information')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        {Object.entries(content.profile.contact || {}).map(([key, value]) => (
          <Grid item xs={12} md={6} key={key}>
            <TextField
              fullWidth
              label={t(`admin.${key}`, key.charAt(0).toUpperCase() + key.slice(1))}
              value={value || ''}
              onChange={(e) => handleContentChange(`contact.${key}`, e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: editedFields.has(`contact.${key}`) ? 'action.hover' : 'background.paper'
                }
              }}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderJourneyField = (section) => {
    const value = content.journey[section.id] || '';
    const fieldKey = section.field;
    
    return (
      <Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {section.description}
        </Typography>
        
        <TextField
          fullWidth
          label={`${section.label} Content`}
          value={value}
          onChange={(e) => handleContentChange(fieldKey, e.target.value)}
          multiline
          rows={8}
          variant="outlined"
          placeholder={t(`admin.${section.id}Placeholder`, `Share your ${section.label.toLowerCase()} story...`)}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: editedFields.has(fieldKey) ? 'action.hover' : 'background.paper'
            }
          }}
          InputProps={{
            endAdornment: value && (
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                <IconButton
                  size="small"
                  onClick={() => handlePreview(value, section.label)}
                >
                  <PreviewIcon fontSize="small" />
                </IconButton>
              </Box>
            )
          }}
        />
        
        {value && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {value.length} characters
          </Typography>
        )}
      </Box>
    );
  };

  if (!isAdmin) {
    return (
      <Alert severity="error">
        {t('admin.accessDenied', 'Access denied. Admin privileges required.')}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6">{t('admin.loading', 'Loading content...')}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                📝 {t('admin.contentManagement', 'Developer Page Content Management')}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t('admin.contentManagementDesc', 'Edit your bio, motivation, challenges, and philosophy')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={loadContent} disabled={loading} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveContent}
                disabled={saving || editedFields.size === 0}
                sx={{ 
                  bgcolor: 'secondary.main', 
                  '&:hover': { bgcolor: 'secondary.dark' }
                }}
              >
                {saving ? t('admin.saving', 'Saving...') : t('admin.saveChanges', 'Save Changes')}
              </Button>
            </Box>
          </Box>
          
          {editedFields.size > 0 && (
            <Alert severity="warning" sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.1)', border: 'none' }}>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {t('admin.unsavedChanges', `You have ${editedFields.size} unsaved changes`)}
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ m: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} variant="scrollable">
            {contentSections.map((section, index) => (
              <Tab
                key={section.id}
                icon={section.icon}
                label={section.label}
                iconPosition="start"
                sx={{
                  minHeight: 64,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Content Panels */}
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && renderProfileFields()}
          {tabValue > 0 && renderJourneyField(contentSections[tabValue])}
        </Box>

        {/* Preview Dialog */}
        <Dialog 
          open={previewDialog.open} 
          onClose={() => setPreviewDialog({ open: false, content: '', title: '' })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{t('admin.preview', 'Preview')}: {previewDialog.title}</DialogTitle>
          <DialogContent>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body1" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {previewDialog.content}
              </Typography>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialog({ open: false, content: '', title: '' })}>
              {t('common.close', 'Close')}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminDeveloperContentManager;