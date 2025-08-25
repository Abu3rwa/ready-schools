import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Avatar, 
  Button, 
  TextField, 
  Divider, 
  Card, 
  CardContent, 
  CardHeader, 
  IconButton,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  School as SchoolIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, uploadProfileImage } from '../services/userService';

/**
 * User Profile Page Component
 * Allows users to view and edit their profile information
 */
const UserProfile = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          const profileData = await getUserProfile(currentUser.uid);
          setProfile(profileData);
          setFormData(profileData);
          setLoading(false);
        } catch (error) {
          console.error("Error loading profile:", error);
          setSnackbar({
            open: true,
            message: t('profile.errorLoadingProfile', 'Error loading profile data'),
            severity: 'error'
          });
          setLoading(false);
        }
      }
    };

    loadProfile();
  }, [currentUser, t]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit - reset form data
      setFormData(profile);
      setEditMode(false);
      setImageFile(null);
      setImagePreview(null);
    } else {
      setEditMode(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      // Upload image if selected
      if (imageFile) {
        setUploading(true);
        const imageUrl = await uploadProfileImage(currentUser.uid, imageFile);
        formData.photoURL = imageUrl;
        setUploading(false);
      }
      
      // Update profile data
      const updatedProfile = await updateUserProfile(currentUser.uid, formData);
      setProfile(updatedProfile);
      setEditMode(false);
      setSnackbar({
        open: true,
        message: t('profile.profileUpdated', 'Profile updated successfully'),
        severity: 'success'
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbar({
        open: true,
        message: t('profile.errorUpdatingProfile', 'Error updating profile'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Loading state
  if (loading && !profile) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper
        elevation={0}
        sx={{
          mt: 3,
          mb: 4,
          p: { xs: 2.5, sm: 3.5 },
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || '#0c4a8e'} 100%)`,
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(20, 89, 169, 0.15)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 6px 25px rgba(20, 89, 169, 0.2)'
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background: 'url(https://source.unsplash.com/random/1200x400/?education,classroom)',
            opacity: 0.12,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
            filter: 'blur(1px)',
            transform: 'scale(1.03)' // Slight scale to avoid blur edges showing
          }}
        />
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'linear-gradient(to right, rgba(20, 89, 169, 0.9) 0%, rgba(42, 125, 215, 0.75) 100%)',
            zIndex: 0
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontSize: { xs: '1.75rem', md: '2.125rem' },
              fontWeight: 700,
              letterSpacing: 0.5,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              '&::before': {
                content: '""',
                display: 'block',
                width: '24px',
                height: '24px',
                background: theme.palette.accent.main,
                marginRight: 1.5,
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }
            }} 
            gutterBottom
          >
            {t('profile.title', 'User Profile')}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              opacity: 0.9,
              maxWidth: '600px',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              pl: 0.5
            }} 
            paragraph
          >
            {t('profile.subtitle', 'View and manage your profile information')}
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        {/* Left column - Profile image and basic info */}
        <Grid item xs={12} md={4}>
          <Card sx={{
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'visible',
            position: 'relative',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
              transform: 'translateY(-4px)'
            },
          }}>
            <CardHeader 
              title={t('profile.basicInfo', 'Basic Information')}
              sx={{
                pb: 0,
                pt: 2.5,
                '& .MuiCardHeader-title': {
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  color: 'primary.main',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: 0,
                    width: '40px',
                    height: '3px',
                    borderRadius: '2px',
                    backgroundColor: theme.palette.accent.main,
                  }
                }
              }}
              action={
                <IconButton 
                  onClick={handleEditToggle}
                  aria-label={editMode ? t('common.cancel', 'Cancel') : t('common.edit', 'Edit')}
                  sx={{ 
                    width: { xs: 44, sm: 48 },
                    height: { xs: 44, sm: 48 },
                    bgcolor: editMode ? 'error.light' : 'primary.light',
                    color: 'white',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: editMode ? 'error.main' : 'primary.main',
                      transform: 'rotate(15deg)'
                    }
                  }}
                >
                  {editMode ? <CancelIcon /> : <EditIcon />}
                </IconButton>
              }
            />
            <CardContent sx={{ textAlign: 'center', pt: 0, position: 'relative', zIndex: 1 }}>
              <Box 
                sx={{ 
                  position: 'relative', 
                  display: 'inline-block',
                  mt: 3,
                  mb: 2,
                  '&::after': !editMode && !uploading ? {
                    content: '""',
                    position: 'absolute',
                    top: '5%',
                    left: '5%',
                    width: '90%',
                    height: '90%',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    zIndex: -1,
                    transform: 'scale(1.1)',
                    filter: 'blur(10px)',
                  } : {}
                }}
              >
                <Avatar 
                  src={imagePreview || profile?.photoURL} 
                  alt={profile?.displayName || currentUser?.email}
                  sx={{ 
                    width: { xs: 130, md: 160 }, 
                    height: { xs: 130, md: 160 }, 
                    mx: 'auto', 
                    border: '5px solid',
                    borderColor: 'white',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': {
                      transform: !editMode ? 'scale(1.05) translateY(-5px)' : 'none',
                      boxShadow: !editMode ? '0 15px 30px rgba(0,0,0,0.2)' : '0 10px 25px rgba(0,0,0,0.15)',
                      borderColor: !editMode ? theme.palette.accent.main : 'white',
                    }
                  }}
                />
                  {editMode && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        right: 0,
                        transform: 'translate(25%, 25%)',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translate(25%, 25%) scale(1.1)',
                        }
                      }}
                    >
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="profile-image-upload"
                        type="file"
                        onChange={handleImageChange}
                      />
                      <label htmlFor="profile-image-upload">
                        <IconButton 
                          component="span"
                          sx={{ 
                            bgcolor: theme.palette.accent.main, 
                            color: 'white',
                            width: { xs: 48, sm: 52 },
                            height: { xs: 48, sm: 52 },
                            boxShadow: '0 5px 15px rgba(255, 193, 7, 0.4)',
                            '&:hover': { 
                              bgcolor: theme.palette.accent.dark || '#e6ac00', 
                              transform: 'scale(1.1) rotate(8deg)',
                              boxShadow: '0 8px 20px rgba(255, 193, 7, 0.5)'
                            },
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                          }}
                          size="large"
                          aria-label={t('profile.uploadNewImage', 'Upload new image')}
                        >
                          <CloudUploadIcon fontSize="medium" />
                        </IconButton>
                      </label>
                    </Box>
                  )}
              </Box>
              
              {uploading && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center',
                    mt: 1, 
                    mb: 1 
                  }}
                >
                  <CircularProgress 
                    size={38} 
                    thickness={4}
                    sx={{ 
                      color: theme.palette.accent.main,
                      animationDuration: '1.2s'
                    }} 
                  />
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      mt: 1, 
                      fontWeight: 500,
                      animation: 'pulse 1.5s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 0.6 },
                        '50%': { opacity: 1 },
                        '100%': { opacity: 0.6 }
                      }
                    }}
                  >
                    {t('profile.uploading', 'Uploading image...')}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ my: 2 }}>
                {editMode ? (
                  <TextField
                    fullWidth
                    label={t('profile.displayName', 'Display Name')}
                    name="displayName"
                    value={formData.displayName || ''}
                    onChange={handleInputChange}
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      sx: { 
                        borderRadius: 2,
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 2px rgba(20, 89, 169, 0.2)'
                        },
                      }
                    }}
                  />
                ) : (
                  <>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700,
                        color: 'text.primary',
                        mb: 0.5,
                        fontSize: { xs: '1.4rem', md: '1.6rem' },
                        letterSpacing: 0.5,
                        textAlign: 'center',
                      }}
                    >
                      {profile?.displayName || currentUser?.email}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.7,
                        mb: 3,
                        fontWeight: 500,
                        opacity: 0.8,
                        fontSize: '0.9rem',
                        '& svg': {
                          color: theme.palette.primary.main,
                          opacity: 0.8
                        }
                      }}
                    >
                      <PersonIcon fontSize="small" />
                      {profile?.email || currentUser?.email}
                    </Typography>
                  </>
                )}
              
              {editMode && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                  sx={{ 
                    mt: 2,
                    py: { xs: 1.2 },
                    px: { xs: 3 },
                    minHeight: 48,
                    borderRadius: 2,
                    bgcolor: theme.palette.primary.main,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(20, 89, 169, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      bgcolor: theme.palette.primary.dark || '#0c4a8e',
                      boxShadow: '0 6px 15px rgba(20, 89, 169, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    '&:active': {
                      boxShadow: '0 2px 8px rgba(20, 89, 169, 0.4)',
                      transform: 'translateY(1px)'
                    }
                  }}
                >
                  {t('common.save', 'Save Changes')}
                </Button>
              )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column - Tabbed content */}
        <Grid item xs={12} md={8}>
          <Card sx={{
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
            },
          }}>
            <Box sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              background: 'linear-gradient(to right, rgba(20, 89, 169, 0.05), rgba(255, 255, 255, 0.05))',
            }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="profile tabs"
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 54,
                    py: { xs: 1.5 },
                    transition: 'all 0.2s ease',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    '&:hover': {
                      color: theme.palette.primary.main,
                      backgroundColor: 'rgba(20, 89, 169, 0.04)',
                    },
                  },
                  '& .Mui-selected': {
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '50%',
                      height: '3px',
                      backgroundColor: theme.palette.primary.main,
                      borderTopLeftRadius: '3px',
                      borderTopRightRadius: '3px',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderTopLeftRadius: '3px',
                    borderTopRightRadius: '3px',
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
              >
                <Tab 
                  icon={<PersonIcon />} 
                  iconPosition="start" 
                  label={t('profile.personalInfo', 'Personal Info')} 
                  sx={{ minHeight: 48, py: { xs: 1.5 } }}
                />
                <Tab 
                  icon={<SchoolIcon />} 
                  iconPosition="start" 
                  label={t('profile.schoolInfo', 'School Info')} 
                  sx={{ 
                    minHeight: 48, 
                    py: { xs: 1.5 },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.3rem',
                      marginRight: '8px'
                    }
                  }}
                />
                <Tab 
                  icon={<LockIcon />} 
                  iconPosition="start" 
                  label={t('profile.security', 'Security')} 
                  sx={{ 
                    minHeight: 48, 
                    py: { xs: 1.5 },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.3rem',
                      marginRight: '8px'
                    }
                  }}
                />
              </Tabs>
            </Box>
            
            {/* Personal Info Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3} sx={{ pt: { xs: 1 } }}>
                {editMode ? (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('profile.firstName', 'First Name')}
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleInputChange}
                        variant="outlined"
                        InputProps={{
                          sx: { 
                            borderRadius: 1.5,
                            '&.Mui-focused': {
                              boxShadow: '0 0 0 2px rgba(20, 89, 169, 0.2)'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('profile.lastName', 'Last Name')}
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleInputChange}
                        variant="outlined"
                        InputProps={{
                          sx: { 
                            borderRadius: 1.5,
                            '&.Mui-focused': {
                              boxShadow: '0 0 0 2px rgba(20, 89, 169, 0.2)'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('profile.bio', 'Bio')}
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleInputChange}
                        multiline
                        rows={3}
                        variant="outlined"
                        InputProps={{
                          sx: { 
                            borderRadius: 1.5,
                            '&.Mui-focused': {
                              boxShadow: '0 0 0 2px rgba(20, 89, 169, 0.2)'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('profile.phoneNumber', 'Phone Number')}
                        name="phoneNumber"
                        value={formData.phoneNumber || ''}
                        onChange={handleInputChange}
                        variant="outlined"
                        InputProps={{
                          sx: { 
                            borderRadius: 1.5,
                            '&.Mui-focused': {
                              boxShadow: '0 0 0 2px rgba(20, 89, 169, 0.2)'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('profile.location', 'Location')}
                        name="location"
                        value={formData.location || ''}
                        onChange={handleInputChange}
                        variant="outlined"
                        InputProps={{
                          sx: { 
                            borderRadius: 1.5,
                            '&.Mui-focused': {
                              boxShadow: '0 0 0 2px rgba(20, 89, 169, 0.2)'
                            }
                          }
                        }}
                      />
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={12} md={6}>
                      <Typography 
                        variant="subtitle2"
                        sx={{ 
                          color: 'primary.main', 
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          mb: 0.5
                        }}
                      >
                        {t('profile.firstName', 'First Name')}
                      </Typography>
                      <Paper 
                        elevation={0}
                        sx={{
                          p: 1.5,
                          backgroundColor: 'rgba(20, 89, 169, 0.04)',
                          borderRadius: 2,
                          border: '1px solid rgba(20, 89, 169, 0.08)',
                          mb: 2
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{
                            fontWeight: profile?.firstName ? 500 : 400,
                            color: profile?.firstName ? 'text.primary' : 'text.secondary',
                            fontStyle: profile?.firstName ? 'normal' : 'italic'
                          }}
                        >
                          {profile?.firstName || t('profile.notSpecified', 'Not specified')}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography 
                        variant="subtitle2"
                        sx={{ 
                          color: 'primary.main', 
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          mb: 0.5
                        }}
                      >
                        {t('profile.lastName', 'Last Name')}
                      </Typography>
                      <Paper 
                        elevation={0}
                        sx={{
                          p: 1.5,
                          backgroundColor: 'rgba(20, 89, 169, 0.04)',
                          borderRadius: 2,
                          border: '1px solid rgba(20, 89, 169, 0.08)',
                          mb: 2
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{
                            fontWeight: profile?.lastName ? 500 : 400,
                            color: profile?.lastName ? 'text.primary' : 'text.secondary',
                            fontStyle: profile?.lastName ? 'normal' : 'italic'
                          }}
                        >
                          {profile?.lastName || t('profile.notSpecified', 'Not specified')}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography 
                        variant="subtitle2"
                        sx={{ 
                          color: 'primary.main', 
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          mb: 0.5
                        }}
                      >
                        {t('profile.bio', 'Bio')}
                      </Typography>
                      <Paper 
                        elevation={0}
                        sx={{
                          p: 2,
                          backgroundColor: 'rgba(20, 89, 169, 0.04)',
                          borderRadius: 2,
                          border: '1px solid rgba(20, 89, 169, 0.08)',
                          mb: 2,
                          minHeight: '80px'
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{
                            fontWeight: profile?.bio ? 400 : 400,
                            color: profile?.bio ? 'text.primary' : 'text.secondary',
                            fontStyle: profile?.bio ? 'normal' : 'italic',
                            lineHeight: 1.6
                          }}
                        >
                          {profile?.bio || t('profile.notSpecified', 'Not specified')}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography 
                        variant="subtitle2"
                        sx={{ 
                          color: 'primary.main', 
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          mb: 0.5
                        }}
                      >
                        {t('profile.phoneNumber', 'Phone Number')}
                      </Typography>
                      <Paper 
                        elevation={0}
                        sx={{
                          p: 1.5,
                          backgroundColor: 'rgba(20, 89, 169, 0.04)',
                          borderRadius: 2,
                          border: '1px solid rgba(20, 89, 169, 0.08)',
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        {profile?.phoneNumber && <Box 
                          component="span" 
                          sx={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.palette.accent.main,
                            color: 'white',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            mr: 1
                          }}
                        >
                          <i className="fas fa-phone" style={{ fontSize: '0.9rem' }} />  
                        </Box>}
                        <Typography 
                          variant="body1" 
                          sx={{
                            fontWeight: profile?.phoneNumber ? 500 : 400,
                            color: profile?.phoneNumber ? 'text.primary' : 'text.secondary',
                            fontStyle: profile?.phoneNumber ? 'normal' : 'italic'
                          }}
                        >
                          {profile?.phoneNumber || t('profile.notSpecified', 'Not specified')}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography 
                        variant="subtitle2"
                        sx={{ 
                          color: 'primary.main', 
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          mb: 0.5
                        }}
                      >
                        {t('profile.location', 'Location')}
                      </Typography>
                      <Paper 
                        elevation={0}
                        sx={{
                          p: 1.5,
                          backgroundColor: 'rgba(20, 89, 169, 0.04)',
                          borderRadius: 2,
                          border: '1px solid rgba(20, 89, 169, 0.08)',
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        {profile?.location && <Box 
                          component="span" 
                          sx={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.palette.primary.light,
                            color: 'white',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            mr: 1
                          }}
                        >
                          <i className="fas fa-map-marker-alt" style={{ fontSize: '0.9rem' }} />  
                        </Box>}
                        <Typography 
                          variant="body1" 
                          sx={{
                            fontWeight: profile?.location ? 500 : 400,
                            color: profile?.location ? 'text.primary' : 'text.secondary',
                            fontStyle: profile?.location ? 'normal' : 'italic'
                          }}
                        >
                          {profile?.location || t('profile.notSpecified', 'Not specified')}
                        </Typography>
                      </Paper>
                    </Grid>
                  </>
                )}
              </Grid>
            </TabPanel>
            
            {/* School Info Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={2} sx={{ pt: { xs: 1 } }}>
                {editMode ? (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('profile.schoolName', 'School Name')}
                        name="school_name"
                        value={formData.school_name || ''}
                        onChange={handleInputChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('profile.schoolLogoUrl', 'School Logo URL')}
                        name="school_logo_url"
                        value={formData.school_logo_url || ''}
                        onChange={handleInputChange}
                        helperText={t('profile.schoolLogoUrlHelp', 'Enter URL to your school logo image')}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('profile.teacherDisplayName', 'Teacher Display Name')}
                        name="teacher_display_name"
                        value={formData.teacher_display_name || ''}
                        onChange={handleInputChange}
                        helperText={t('profile.teacherNameHelp', 'This name will be displayed in emails to parents')}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('profile.emailSignature', 'Email Signature')}
                        name="email_signature"
                        value={formData.email_signature || ''}
                        onChange={handleInputChange}
                        multiline
                        rows={3}
                      />
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">
                        {t('profile.schoolName', 'School Name')}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {profile?.school_name || t('profile.notSpecified', 'Not specified')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">
                        {t('profile.teacherDisplayName', 'Teacher Display Name')}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {profile?.teacher_display_name || t('profile.notSpecified', 'Not specified')}
                      </Typography>
                    </Grid>
                    {profile?.school_logo_url && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2">
                          {t('profile.schoolLogo', 'School Logo')}
                        </Typography>
                        <Box sx={{ mt: 1, mb: 2 }}>
                          <img 
                            src={profile.school_logo_url} 
                            alt="School Logo" 
                            style={{ 
                              maxWidth: '200px', 
                              maxHeight: '100px',
                              border: '1px solid #eee',
                              borderRadius: '4px',
                              padding: '8px'
                            }} 
                          />
                        </Box>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">
                        {t('profile.emailSignature', 'Email Signature')}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {profile?.email_signature || t('profile.notSpecified', 'Not specified')}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </TabPanel>
            
            {/* Security Tab */}
            <TabPanel value={tabValue} index={2}>
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 4,
                  '& .MuiAlert-icon': {
                    color: theme.palette.primary.main
                  },
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  '& .MuiAlert-message': {
                    padding: '8px 0'
                  }
                }}
              >
                {t('profile.securityInfo', 'Security settings for your account. For security reasons, password changes are handled through Firebase Authentication.')}
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid rgba(20, 89, 169, 0.08)',
                      backgroundColor: 'rgba(20, 89, 169, 0.02)',
                      mb: 3,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        backgroundColor: theme.palette.primary.main,
                        borderTopLeftRadius: 2,
                        borderBottomLeftRadius: 2
                      }
                    }}
                  >
                    <Typography 
                      variant="subtitle2"
                      sx={{ 
                        color: 'primary.main', 
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(20, 89, 169, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="fas fa-calendar-alt" style={{ fontSize: '0.8rem', color: theme.palette.primary.main }} />
                      </Box>
                      {t('profile.accountCreated', 'Account Created')}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{
                        pl: 4,
                        fontWeight: 500,
                        fontSize: '1.1rem',
                        color: 'text.primary'
                      }}
                    >
                      {profile?.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : t('profile.unknown', 'Unknown')}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid rgba(20, 89, 169, 0.08)',
                      backgroundColor: 'rgba(20, 89, 169, 0.02)',
                      mb: 3,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        backgroundColor: theme.palette.accent.main,
                        borderTopLeftRadius: 2,
                        borderBottomLeftRadius: 2
                      }
                    }}
                  >
                    <Typography 
                      variant="subtitle2"
                      sx={{ 
                        color: 'primary.main', 
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 193, 7, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="fas fa-clock" style={{ fontSize: '0.8rem', color: theme.palette.accent.main }} />
                      </Box>
                      {t('profile.lastLogin', 'Last Login')}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{
                        pl: 4,
                        fontWeight: 500,
                        fontSize: '1.1rem',
                        color: 'text.primary'
                      }}
                    >
                      {currentUser?.metadata?.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : t('profile.unknown', 'Unknown')}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, textAlign: { xs: 'center', sm: 'left' } }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<LockIcon />}
                  sx={{ 
                    mt: 2,
                    py: { xs: 1.5 },
                    px: { xs: 4 },
                    minHeight: 48,
                    borderRadius: 2,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(20, 89, 169, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      boxShadow: '0 6px 15px rgba(20, 89, 169, 0.3)',
                      transform: 'translateY(-2px)'
                    },
                    '&:active': {
                      boxShadow: '0 2px 8px rgba(20, 89, 169, 0.3)',
                      transform: 'translateY(1px)'
                    }
                  }}
                  onClick={() => alert(t('profile.resetEmailSent', 'Password reset functionality would be implemented here'))}
                >
                  {t('profile.resetPassword', 'Reset Password')}
                </Button>
              </Box>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }
        }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            },
            '& .MuiAlert-message': {
              fontWeight: 500,
              fontSize: '0.95rem'
            },
            '& .MuiAlert-action': {
              paddingTop: 0
            }
          }}
          elevation={6}
          icon={snackbar.severity === 'success' ? <i className="fas fa-check-circle" /> : undefined}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
      style={{
        opacity: value === index ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      {value === index && (
        <Box 
          sx={{ 
            p: { xs: 2.5, sm: 3.5 },
            animation: value === index ? 'fadeIn 0.5s ease-in-out' : 'none',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(10px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

export default UserProfile;