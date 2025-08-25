import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Fab,
  Fade,
  Slide,
  useTheme,
  useMediaQuery,
  Skeleton,
  Alert,
  Divider
} from '@mui/material';
import {
  KeyboardArrowUp as ArrowUpIcon,
  School as TeachingIcon,
  Code as CodeIcon,
  Photo as PhotoIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getDeveloperPageImages, getDeveloperPageContent } from '../services/developerPageService';
import AdminDeveloperImageDashboard from '../components/admin/AdminDeveloperImageDashboard';
import AdminDeveloperContentManager from '../components/admin/AdminDeveloperContentManager';

const DeveloperPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser, isAdmin } = useAuth();
  
  const [images, setImages] = useState({});
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Debug logging
  console.log('DeveloperPage - currentUser:', currentUser?.email);
  console.log('DeveloperPage - isAdmin:', isAdmin);
  console.log('DeveloperPage - userProfile:', currentUser);

  useEffect(() => {
    loadData();
    
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both images and content in parallel
      const [imageData, contentData] = await Promise.all([
        getDeveloperPageImages(),
        getDeveloperPageContent()
      ]);
      
      // Group images by section
      const groupedImages = {};
      imageData.forEach(img => {
        const section = img.section || 'general';
        if (!groupedImages[section]) {
          groupedImages[section] = [];
        }
        groupedImages[section].push(img);
      });
      
      setImages(groupedImages);
      setContent(contentData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load content. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    try {
      setError(null);
      const imageData = await getDeveloperPageImages();
      
      // Group images by section
      const groupedImages = {};
      imageData.forEach(img => {
        const section = img.section || 'general';
        if (!groupedImages[section]) {
          groupedImages[section] = [];
        }
        groupedImages[section].push(img);
      });
      
      setImages(groupedImages);
    } catch (err) {
      console.error('Error loading images:', err);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getProfileImage = () => {
    return images.profile?.[0]?.downloadURL || null;
  };

  const getImagesBySection = (section) => {
    return images[section] || [];
  };

  const renderImageGallery = (sectionImages, title, description) => {
    if (loading) {
      return (
        <Box sx={{ mb: { xs: 3, sm: 4, md: 6 } }}>
          <Skeleton 
            variant="text" 
            width={{ xs: '80%', sm: '60%', md: '200px' }}
            height={{ xs: 32, sm: 40 }} 
            sx={{ mb: 2, mx: { xs: 'auto', sm: 0 } }} 
          />
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ width: '100%', margin: 0 }}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i} sx={{ width: '100%' }}>
                <Skeleton 
                  variant="rectangular" 
                  height={{ xs: 150, sm: 180, md: 200 }}
                  sx={{ borderRadius: { xs: '12px', md: '16px' } }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      );
    }

    if (!sectionImages || sectionImages.length === 0) {
      return (
        <Box sx={{ mb: { xs: 3, sm: 4, md: 6 } }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: { xs: 1.5, sm: 2 }, 
              fontWeight: 600,
              fontSize: {
                xs: '1.1rem',
                sm: '1.25rem',
                md: '1.4rem',
                lg: '1.5rem'
              },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            {title}
          </Typography>
          <Alert 
            severity="info" 
            icon={<PhotoIcon />}
            sx={{ 
              bgcolor: `${theme.palette.background.paper}20`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.primary.contrastText}30`,
              color: theme.palette.primary.contrastText,
              borderRadius: { xs: '12px', sm: '16px' },
              '& .MuiAlert-message': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }
            }}
          >
            {description}
          </Alert>
        </Box>
      );
    }

    return (
      <Box sx={{ mb: { xs: 3, sm: 4, md: 6 } }}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: { xs: 2, sm: 2.5, md: 3 }, 
            fontWeight: 600,
            fontSize: {
              xs: '1.1rem',
              sm: '1.25rem',
              md: '1.4rem',
              lg: '1.5rem'
            },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          {title}
        </Typography>
        <Grid container spacing={{ xs: 1, sm: 1.5, md: 2, lg: 3 }} sx={{ width: '100%', margin: 0 }}>
          {sectionImages.map((image, index) => (
            <Grid item xs={12} sm={6} md={4} key={image.id} sx={{ width: '100%' }}>
              <Fade in timeout={800 + index * 200}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    background: `${theme.palette.background.paper}20`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.primary.contrastText}30`,
                    borderRadius: { xs: '12px', md: '16px' },
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    // Ensure card doesn't exceed container
                    maxWidth: '100%',
                    width: '100%',
                    '&:hover': {
                      transform: { xs: 'translateY(-2px)', md: 'translateY(-6px)' },
                      boxShadow: {
                        xs: `0 8px 24px ${theme.palette.primary.main}20`,
                        md: `0 20px 40px ${theme.palette.primary.main}30`
                      },
                      background: `${theme.palette.background.paper}30`,
                    },
                    // Prevent overflow on mobile
                    '@media (max-width: 768px)': {
                      '&:hover': {
                        transform: 'translateY(-2px)',
                      }
                    }
                  }}
                >
                  <Box
                    component="img"
                    src={image.downloadURL}
                    alt={image.metadata?.description || 'Gallery image'}
                    sx={{
                      width: '100%',
                      height: { xs: 150, sm: 180, md: 200 },
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                      maxWidth: '100%'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {image.metadata?.description && (
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {image.metadata.description}
                      </Typography>
                    </CardContent>
                  )}
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        paddingTop: '64px', // Account for fixed header height
        overflowX: 'hidden', // Prevent horizontal scroll
        width: '100vw', // Use viewport width
        maxWidth: '100%', // Prevent exceeding viewport
        // Mobile optimizations
        '@media (max-width: 768px)': {
          background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          paddingTop: '56px',
          minHeight: '100dvh', // Use dynamic viewport height on mobile
          width: '100vw'
        },
        // Ensure no horizontal overflow on very small screens
        '@media (max-width: 480px)': {
          paddingTop: '56px',
          paddingLeft: 0,
          paddingRight: 0,
          width: '100vw'
        }
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: 'radial-gradient(circle at 25px 25px, white 2px, transparent 0)',
          backgroundSize: '50px 50px'
        }}
      />

      <Container 
        maxWidth="lg" 
        sx={{ 
          position: 'relative', 
          py: { xs: 1, sm: 2, md: 4, lg: 6 }, 
          px: { xs: 0.5, sm: 1, md: 2, lg: 3 },
          // Ensure container doesn't exceed viewport
          maxWidth: { xs: '100%', sm: '100%', md: 'lg' },
          width: '100%',
          // Prevent horizontal overflow
          overflowX: 'hidden'
        }}
      >
        {/* Hero Section */}
        <Fade in timeout={800}>
          <Box sx={{ 
            textAlign: 'center', 
            mb: { xs: 4, md: 8 },
            // Prevent text overflow
            width: '100%',
            overflow: 'hidden'
          }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                color: 'white',
                mb: { xs: 1, sm: 2 },
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3.5rem' },
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                px: { xs: 0.5, sm: 0 },
                lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                textAlign: 'center',
                wordBreak: 'break-word'
              }}
            >
              {t('developerPage.title', 'Meet Your Teacher-Developer')}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                mb: { xs: 2, sm: 3, md: 4, lg: 6 },
                maxWidth: { xs: '100%', sm: '600px', md: '800px' },
                mx: 'auto',
                fontWeight: 300,
                lineHeight: { xs: 1.4, sm: 1.5, md: 1.6 },
                fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem', lg: '1.5rem' },
                px: { xs: 0.5, sm: 1, md: 0 },
                textAlign: 'center'
              }}
            >
              {t('developerPage.subtitle', 'Bridging education and technology to create meaningful learning experiences')}
            </Typography>
          </Box>
        </Fade>

        {/* Profile Section */}
        <Slide direction="up" in timeout={1000}>
          <Card
            elevation={0}
            sx={{
              mb: { xs: 2, sm: 3, md: 4, lg: 6 },
              background: `${theme.palette.background.paper}30`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.primary.contrastText}30`,
              borderRadius: { xs: '12px', sm: '16px', md: '20px', lg: '24px' },
              overflow: 'hidden',
              mx: { xs: 0, sm: 'auto' },
              // Better mobile shadow
              boxShadow: {
                xs: '0 8px 32px rgba(0, 0, 0, 0.2)',
                sm: '0 12px 48px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            <CardContent sx={{ 
              p: { xs: 1.5, sm: 2, md: 4, lg: 6 },
              '&:last-child': { pb: { xs: 1.5, sm: 2, md: 4, lg: 6 } }
            }}>
              <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} alignItems="center" sx={{ width: '100%', margin: 0 }}>
                <Grid item xs={12} md={4} sx={{ textAlign: 'center', width: '100%' }}>
                  {loading ? (
                    <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
                  ) : (
                    <Avatar
                      src={getProfileImage()}
                      sx={{
                        width: { xs: 120, sm: 150, md: 180, lg: 200 },
                        height: { xs: 120, sm: 150, md: 180, lg: 200 },
                        mx: 'auto',
                        border: {
                          xs: `2px solid ${theme.palette.primary.contrastText}50`,
                          sm: `3px solid ${theme.palette.primary.contrastText}50`,
                          md: `4px solid ${theme.palette.primary.contrastText}50`
                        },
                        boxShadow: {
                          xs: `0 4px 16px ${theme.palette.primary.main}40`,
                          sm: `0 6px 24px ${theme.palette.primary.main}40`,
                          md: `0 8px 32px ${theme.palette.primary.main}40`
                        }
                      }}
                    >
                      <TeachingIcon sx={{ 
                      fontSize: { xs: 60, sm: 70, md: 80 }, 
                      color: 'primary.main' 
                    }} />
                    </Avatar>
                  )}
                </Grid>
                <Grid item xs={12} md={8} sx={{ width: '100%' }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.primary.contrastText,
                      mb: { xs: 1, sm: 1.5, md: 2 },
                      textAlign: { xs: 'center', md: 'left' },
                      fontSize: {
                        xs: '1.25rem',
                        sm: '1.5rem', 
                        md: '1.75rem',
                        lg: '2.125rem'
                      },
                      lineHeight: { xs: 1.2, sm: 1.3 },
                      wordBreak: 'break-word'
                    }}
                  >
                    {content?.profile?.name || 'Teacher & Developer'}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: `${theme.palette.primary.contrastText}CC`,
                      mb: { xs: 1, sm: 1.5, md: 2 },
                      textAlign: { xs: 'center', md: 'left' },
                      fontWeight: 400,
                      fontSize: {
                        xs: '0.9rem',
                        sm: '1rem',
                        md: '1.125rem',
                        lg: '1.25rem'
                      },
                      wordBreak: 'break-word'
                    }}
                  >
                    {content?.profile?.role || 'Educator & Software Developer'}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: `${theme.palette.primary.contrastText}E6`,
                      mb: { xs: 2, sm: 2.5, md: 3 },
                      lineHeight: { xs: 1.5, sm: 1.6, md: 1.7 },
                      fontSize: {
                        xs: '0.875rem',
                        sm: '0.95rem',
                        md: '1rem',
                        lg: '1.1rem'
                      },
                      textAlign: { xs: 'center', md: 'left' },
                      wordBreak: 'break-word',
                      hyphens: 'auto'
                    }}
                  >
                    {content?.profile?.bio || 'Passionate educator turned developer, creating technology solutions that enhance learning experiences. Every line of code I write is informed by real classroom challenges and student needs.'}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: { xs: 1, sm: 2 }, 
                    flexWrap: 'wrap', 
                    justifyContent: { xs: 'center', md: 'flex-start' },
                    '& .MuiChip-root': {
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      height: { xs: 28, sm: 32 }
                    }
                  }}>
                    <Chip
                      icon={<TeachingIcon />}
                      label="Education"
                      sx={{
                        bgcolor: theme.palette.accent.main,
                        color: theme.palette.accent.contrastText,
                        fontWeight: 500
                      }}
                    />
                    <Chip
                      icon={<CodeIcon />}
                      label="Development"
                      sx={{
                        bgcolor: theme.palette.accent.main,
                        color: theme.palette.accent.contrastText,
                        fontWeight: 500
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Slide>

        {/* Teacher-Developer Journey */}
        <Box sx={{ mb: { xs: 3, sm: 4, md: 6, lg: 8 } }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: 'white',
              mb: { xs: 1, sm: 1.5, md: 2 },
              textAlign: 'center',
              fontSize: {
                xs: '1.3rem',
                sm: '1.6rem', 
                md: '2rem',
                lg: '2.5rem'
              },
              px: { xs: 0.5, sm: 1, md: 0 },
              lineHeight: { xs: 1.2, sm: 1.3 },
              wordBreak: 'break-word'
            }}
          >
            {t('developerPage.teacherJourney', 'My Teaching to Technology Journey')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: `${theme.palette.primary.contrastText}CC`,
              mb: { xs: 2, sm: 3, md: 4, lg: 6 },
              textAlign: 'center',
              maxWidth: { xs: '100%', sm: '600px', md: '800px' },
              mx: 'auto',
              fontWeight: 300,
              lineHeight: { xs: 1.4, sm: 1.5, md: 1.6 },
              fontSize: {
                xs: '0.8rem',
                sm: '0.95rem',
                md: '1.1rem',
                lg: '1.25rem'
              },
              px: { xs: 0.5, sm: 1, md: 0 }
            }}
          >
            {t('developerPage.journeyIntro', 'Every line of code I write is informed by real classroom experience. Here\'s the story of how teaching challenges led to innovative solutions.')}
          </Typography>

          <Grid container spacing={{ xs: 1, sm: 1.5, md: 2, lg: 3 }} sx={{ width: '100%', margin: 0 }}>
            {[
              {
                field: 'motivation',
                title: t('developerPage.motivation', 'The Spark'),
                subtitle: t('developerPage.motivationSubtitle', 'What drove me to code'),
                icon: '⭐',
                color: 'primary',
                delay: '0.2s'
              },
              {
                field: 'painPoints',
                title: t('developerPage.painPoints', 'The Challenge'),
                subtitle: t('developerPage.painPointsSubtitle', 'Problems I faced daily'),
                icon: '🎯',
                color: 'secondary',
                delay: '0.4s'
              },
              {
                field: 'philosophy',
                title: t('developerPage.philosophy', 'The Solution'),
                subtitle: t('developerPage.philosophySubtitle', 'My approach to ed-tech'),
                icon: '💡',
                color: 'success',
                delay: '0.6s'
              }
            ].map((item, index) => (
              <Grid item xs={12} sm={12} md={4} key={item.field} sx={{ width: '100%' }}>
                <Fade in timeout={1200 + index * 200}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      background: `${theme.palette.background.paper}20`,
                      backdropFilter: 'blur(15px)',
                      border: `1px solid ${theme.palette.primary.contrastText}30`,
                      borderRadius: { xs: '12px', sm: '14px', md: '16px', lg: '20px' },
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      // Ensure card doesn't exceed container
                      maxWidth: '100%',
                      width: '100%',
                      // Mobile-specific hover effects
                      '&:hover': {
                        transform: { 
                          xs: 'translateY(-2px)', 
                          sm: 'translateY(-4px)', 
                          md: 'translateY(-8px) scale(1.01)'
                        },
                        boxShadow: {
                          xs: `0 8px 24px ${theme.palette.primary.main}20`,
                          md: `0 25px 50px ${theme.palette.primary.main}30`
                        },
                        background: `${theme.palette.background.paper}30`,
                      },
                      // Prevent scaling on mobile to avoid overflow
                      '@media (max-width: 768px)': {
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        }
                      }
                    }}
                  >
                    <CardContent sx={{ 
                      p: { xs: 1.5, sm: 2, md: 3, lg: 4 }, 
                      textAlign: 'center',
                      '&:last-child': { pb: { xs: 1.5, sm: 2, md: 3, lg: 4 } }
                    }}>
                      <Typography
                        variant="h2"
                        sx={{
                          mb: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
                          fontSize: { 
                            xs: '1.5rem', 
                            sm: '1.8rem', 
                            md: '2.2rem',
                            lg: '2.5rem'
                          },
                          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
                        }}
                      >
                        {item.icon}
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.primary.contrastText,
                          mb: { xs: 1, sm: 1.5, md: 2 },
                          fontSize: { 
                            xs: '1rem', 
                            sm: '1.15rem', 
                            md: '1.3rem',
                            lg: '1.5rem'
                          },
                          lineHeight: { xs: 1.2, sm: 1.3 }
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: `${theme.palette.primary.contrastText}CC`,
                          mb: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
                          lineHeight: { xs: 1.4, sm: 1.5, md: 1.6 },
                          fontSize: { 
                            xs: '0.8rem', 
                            sm: '0.875rem',
                            md: '0.95rem',
                            lg: '1rem'
                          }
                        }}
                      >
                        {item.subtitle}
                      </Typography>
                      <Divider sx={{ 
                        bgcolor: `${theme.palette.primary.contrastText}30`, 
                        mb: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
                        mx: { xs: 1, sm: 0 }
                      }} />
                      <Typography
                        variant="body2"
                        sx={{
                          color: `${theme.palette.primary.contrastText}E6`,
                          lineHeight: { xs: 1.4, sm: 1.5, md: 1.6 },
                          textAlign: 'left',
                          minHeight: { xs: '32px', sm: '40px', md: '48px', lg: '60px' },
                          display: '-webkit-box',
                          WebkitLineClamp: { xs: 2, sm: 2, md: 3 },
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: { 
                            xs: '0.7rem', 
                            sm: '0.75rem',
                            md: '0.8rem',
                            lg: '0.875rem'
                          },
                          px: { xs: 0.5, sm: 0 }
                        }}
                      >
                        {content?.journey?.[item.field] || t(`developerPage.${item.field}Coming`, `${item.title} story coming soon...`)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Image Galleries */}
        <Box sx={{ color: theme.palette.primary.contrastText }}>
          {renderImageGallery(
            getImagesBySection('classroom'),
            t('developerPage.classroomImages', 'My Classroom Environment'),
            t('developerPage.noClassroomImages', 'Classroom photos coming soon')
          )}

          {renderImageGallery(
            getImagesBySection('credentials'),
            t('developerPage.teachingCredentials', 'Teaching Excellence'),
            t('developerPage.noCredentials', 'Teaching credentials coming soon')
          )}

          {renderImageGallery(
            getImagesBySection('skills'),
            t('developerPage.technicalSkills', 'Technical Expertise'),
            t('developerPage.noSkills', 'Technical skills coming soon')
          )}

          {renderImageGallery(
            getImagesBySection('gallery'),
            t('developerPage.imageGallery', 'Visual Portfolio'),
            t('developerPage.noGalleryImages', 'Portfolio Coming Soon')
          )}
        </Box>

        {/* Admin Section - Enhanced with Debug Info */}
        {currentUser && (
          <Box sx={{ mt: { xs: 3, sm: 4, md: 6, lg: 8 } }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: 'white',
                mb: { xs: 1.5, sm: 2 },
                textAlign: 'center',
                fontSize: {
                  xs: '1.2rem',
                  sm: '1.4rem', 
                  md: '1.6rem',
                  lg: '2rem'
                },
                wordBreak: 'break-word'
              }}
            >
              {isAdmin ? '🔧 Admin Panel' : '👤 User Panel'}
            </Typography>
            
            {/* Debug Info Card */}
            <Card
              elevation={0}
              sx={{
                mb: { xs: 2, sm: 3 },
                background: `${theme.palette.background.paper}30`,
                backdropFilter: 'blur(15px)',
                border: `2px solid ${isAdmin ? theme.palette.accent.main : theme.palette.secondary.main}`,
                borderRadius: { xs: '12px', sm: '14px', md: '16px' },
                mx: { xs: 0, sm: 'auto' }
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Typography variant="h6" sx={{ 
                  color: 'white', 
                  mb: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                }}>
                  🐛 Debug Information:
                </Typography>
                <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ width: '100%', margin: 0 }}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                      <strong>User:</strong> {currentUser?.email || 'Not logged in'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" sx={{ 
                      color: 'white', 
                      mb: 1,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap'
                    }}>
                      <strong>Is Admin:</strong> <Chip 
                        label={isAdmin ? 'Yes' : 'No'} 
                        color={isAdmin ? 'success' : 'warning'} 
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" sx={{ 
                      color: 'white',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      wordBreak: 'break-all'
                    }}>
                      <strong>User ID:</strong> {currentUser?.uid ? `${currentUser.uid.substring(0, 8)}...` : 'No UID'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Admin Dashboard */}
            {isAdmin ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
                {/* Content Management */}
                <Card
                  elevation={0}
                  sx={{
                    background: `${theme.palette.background.paper}20`,
                    backdropFilter: 'blur(15px)',
                    border: `1px solid ${theme.palette.accent.main}`,
                    borderRadius: { xs: '12px', md: '16px' },
                    overflow: 'hidden'
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <AdminDeveloperContentManager onContentUpdate={loadData} />
                  </CardContent>
                </Card>
                
                {/* Image Management */}
                <Card
                  elevation={0}
                  sx={{
                    background: `${theme.palette.background.paper}20`,
                    backdropFilter: 'blur(15px)',
                    border: `1px solid ${theme.palette.accent.main}`,
                    borderRadius: { xs: '12px', md: '16px' },
                    overflow: 'hidden'
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <AdminDeveloperImageDashboard onImagesUpdate={loadImages} />
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Alert 
                severity="info"
                icon={<TeachingIcon />}
                sx={{
                  bgcolor: `${theme.palette.background.paper}20`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.palette.primary.contrastText}30`,
                  color: 'white',
                  borderRadius: { xs: '12px', sm: '16px' },
                  '& .MuiAlert-icon': {
                    color: theme.palette.accent.main
                  },
                  '& .MuiAlert-message': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              >
                <Typography variant="body1" sx={{ 
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  👋 Hello! You need admin privileges to edit this page content.
                </Typography>
                <Typography variant="body2" sx={{ 
                  mt: 1, 
                  opacity: 0.8,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}>
                  Contact an administrator to request access if you need to manage images and content.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </Container>

      {/* Scroll to Top Button */}
      <Fade in={showScrollTop}>
        <Fab
          color="primary"
          size={isMobile ? "small" : "medium"}
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24, md: 32 },
            right: { xs: 16, sm: 24, md: 32 },
            bgcolor: theme.palette.accent.main,
            color: theme.palette.accent.contrastText,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.accent.main}`,
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            zIndex: 1000,
            '&:hover': {
              bgcolor: theme.palette.secondary.main,
            }
          }}
        >
          <ArrowUpIcon sx={{ 
            color: theme.palette.accent.contrastText,
            fontSize: { xs: '1.2rem', sm: '1.5rem' }
          }} />
        </Fab>
      </Fade>
    </Box>
  );
};

export default DeveloperPage;