 import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Fab,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  useMediaQuery,
  Zoom,
  Slide
} from '@mui/material';
import {
  Assessment,
  EmojiEvents,
  TrendingUp,
  Star,
  School,
  CalendarToday,
  Refresh,
  BarChart,
  FilterList,
  Sort
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import LeaderboardStudentCard from './LeaderboardStudentCard';
import { useCharacterTrait } from '../../contexts/CharacterTraitContext';
import { useStudents } from '../../contexts/StudentContext';

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

const bounceIn = keyframes`
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Main page background container (child-friendly design)
const PageBackground = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: `
    linear-gradient(135deg, 
      #FF6B9D 0%, 
      #C44569 15%,
      #F8B500 30%,
      #FFA726 45%,
      #66BB6A 60%,
      #42A5F5 75%,
      #AB47BC 90%,
      #EC407A 100%
    )
  `,
  position: 'relative',
  overflow: 'hidden',
  paddingTop: 0,
  overflowX: 'hidden',
  width: '100%',
  maxWidth: '100vw',
  
  // Add floating shapes for children
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.3) 2px, transparent 2px),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.2) 3px, transparent 3px),
      radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
    `,
    backgroundSize: '100px 100px, 150px 150px, 80px 80px',
    animation: 'float 20s infinite linear',
    pointerEvents: 'none'
  },
  
  // Mobile optimizations
  '@media (max-width: 768px)': {
    background: `
      linear-gradient(180deg, 
        #FF6B9D 0%, 
        #F8B500 25%,
        #66BB6A 50%,
        #42A5F5 75%,
        #AB47BC 100%
      )
    `,
    minHeight: '100dvh',
    width: '100%'
  },
  
  '@media (max-width: 480px)': {
    paddingLeft: 0,
    paddingRight: 0,
    width: '100%'
  },
  
  // Floating animation
  '@keyframes float': {
    '0%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-10px)' },
    '100%': { transform: 'translateY(0px)' }
  }
}));

// Child-friendly decorative elements
const ChildFriendlyDecorations = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
  
  '&::before': {
    content: '"🌟"',
    position: 'absolute',
    top: '10%',
    left: '5%',
    fontSize: '2rem',
    animation: 'twinkle 3s infinite',
    opacity: 0.7
  },
  
  '&::after': {
    content: '"🎉"',
    position: 'absolute',
    top: '20%',
    right: '8%',
    fontSize: '1.5rem',
    animation: 'bounce 2s infinite',
    opacity: 0.6
  },
  
  '@keyframes twinkle': {
    '0%, 100%': { opacity: 0.7, transform: 'scale(1)' },
    '50%': { opacity: 1, transform: 'scale(1.2)' }
  },
  
  '@keyframes bounce': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' }
  }
}));

// Content container with glassmorphism
const PageContainer = styled(Container)(({ theme }) => ({
  position: 'relative',
  paddingTop: '64px',
  maxWidth: { xs: '100%', sm: '100%', md: 'lg' },
  width: '100%',
  minHeight: '100vh',
  overflowX: 'hidden',
  animation: `${fadeInUp} 0.8s ease-out`,

  [theme.breakpoints.down('md')]: {
    paddingTop: '56px'
  },

  // Mobile optimizations
  '@media (max-width: 768px)': {
    paddingTop: '56px'
  },

  // Ensure no horizontal overflow on very small screens
  '@media (max-width: 480px)': {
    paddingTop: '56px',
    width: '100vw'
  }
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  background: `
    linear-gradient(135deg, 
      rgba(255, 255, 255, 0.95) 0%, 
      rgba(255, 255, 255, 0.85) 100%
    )
  `,
  backdropFilter: 'blur(20px)',
  border: '3px solid rgba(255, 255, 255, 0.8)',
  color: '#2E3A59',
  marginBottom: theme.spacing(3),
  borderRadius: '20px',
  overflow: 'visible',
  position: 'relative',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
  transform: 'perspective(1000px) rotateX(5deg)',
  
  // Fun floating animation
  animation: 'headerFloat 6s ease-in-out infinite',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-10px',
    left: '-10px',
    right: '-10px',
    bottom: '-10px',
    background: `
      linear-gradient(45deg, 
        #FF6B9D, #F8B500, #66BB6A, #42A5F5, #AB47BC
      )
    `,
    borderRadius: '25px',
    zIndex: -1,
    filter: 'blur(15px)',
    opacity: 0.7
  },
  
  '@keyframes headerFloat': {
    '0%, 100%': { transform: 'perspective(1000px) rotateX(5deg) translateY(0px)' },
    '50%': { transform: 'perspective(1000px) rotateX(5deg) translateY(-5px)' }
  },

  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(2),
    borderRadius: '16px',
    transform: 'none',
    '&::before': {
      borderRadius: '20px'
    }
  },

  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(1.5),
    borderRadius: '12px',
    '&::before': {
      borderRadius: '16px'
    }
  }
}));

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: '16px',
  background: `
    linear-gradient(135deg, 
      rgba(255, 255, 255, 0.9) 0%, 
      rgba(255, 255, 255, 0.7) 100%
    )
  `,
  backdropFilter: 'blur(15px)',
  border: '2px solid rgba(255, 255, 255, 0.5)',
  color: '#2E3A59',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  maxWidth: '100%',
  width: '100%',
  position: 'relative',
  
  // Fun hover effects for children
  '&:hover': {
    transform: 'translateY(-8px) scale(1.05)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    background: `
      linear-gradient(135deg, 
        rgba(255, 255, 255, 0.95) 0%, 
        rgba(255, 255, 255, 0.85) 100%
      )
    `,
  },
  
  // Add colorful border animations
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      linear-gradient(45deg, 
        #FF6B9D, #F8B500, #66BB6A, #42A5F5, #AB47BC, #FF6B9D
      )
    `,
    borderRadius: '16px',
    padding: '2px',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'exclude',
    zIndex: -1,
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  
  '&:hover::before': {
    opacity: 1
  },

  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1.5),
    borderRadius: '12px',
    '&:hover': {
      transform: 'translateY(-4px) scale(1.02)',
    }
  },

  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    borderRadius: '10px',
  }
}));

const LeaderboardGrid = styled(Grid)(({ theme }) => ({
  '& .MuiGrid-item': {
    display: 'flex',
    '& > *': {
      width: '100%',
    }
  }
}));

const FloatingActionButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  background: `
    linear-gradient(135deg, 
      #FF6B9D 0%, 
      #F8B500 50%, 
      #66BB6A 100%
    )
  `,
  color: 'white',
  zIndex: 1000,
  width: 64,
  height: 64,
  fontSize: '1.5rem',
  fontWeight: 'bold',
  border: '3px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
  
  // Fun animations for children
  animation: 'fabPulse 2s infinite, fabFloat 3s ease-in-out infinite',
  
  '&:hover': {
    transform: 'scale(1.2) rotate(10deg)',
    background: `
      linear-gradient(135deg, 
        #F8B500 0%, 
        #66BB6A 50%, 
        #42A5F5 100%
      )
    `,
    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4)',
  },
  
  // Pulse animation
  '@keyframes fabPulse': {
    '0%': { boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)' },
    '50%': { boxShadow: '0 8px 25px rgba(255, 107, 157, 0.6)' },
    '100%': { boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)' }
  },
  
  // Float animation
  '@keyframes fabFloat': {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-8px)' }
  },

  [theme.breakpoints.down('md')]: {
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    width: 56,
    height: 56,
    fontSize: '1.25rem',
  },

  [theme.breakpoints.down('sm')]: {
    bottom: theme.spacing(1.5),
    right: theme.spacing(1.5),
    width: 52,
    height: 52,
    fontSize: '1.1rem',
  }
}));

const SkeletonCard = styled(Card)(({ theme }) => ({
  height: 220,
  background: `linear-gradient(90deg, 
    ${theme.palette.grey[300]} 25%, 
    ${theme.palette.grey[200]} 50%, 
    ${theme.palette.grey[300]} 75%)`,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s infinite`,
  borderRadius: theme.spacing(2),

  [theme.breakpoints.down('sm')]: {
    height: 180,
    borderRadius: theme.spacing(1),
  }
}));

const CharacterTraitLeaderboard = ({ onOpenAssessment }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    leaderboard,
    loading,
    monthlyStats,
    currentMonth,
    currentMonthTrait,
    refreshLeaderboard,
    yesterdayContent // Add yesterdayContent from context
  } = useCharacterTrait();
  
  const { students } = useStudents();
  
  const [sortBy, setSortBy] = useState('rank'); // 'rank', 'stars', 'assessments'
  const [animateCards, setAnimateCards] = useState(false);

  // Trigger card animations when leaderboard updates
  useEffect(() => {
    if (leaderboard.length > 0) {
      setAnimateCards(true);
      const timer = setTimeout(() => setAnimateCards(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [leaderboard]);

  // Sort leaderboard based on selected criteria
  const sortedLeaderboard = React.useMemo(() => {
    const sorted = [...leaderboard];
    
    switch (sortBy) {
      case 'stars':
        return sorted.sort((a, b) => b.totalStars - a.totalStars);
      case 'assessments':
        return sorted.sort((a, b) => b.assessmentCount - a.assessmentCount);
      case 'average':
        return sorted.sort((a, b) => b.averageScore - a.averageScore);
      default:
        return sorted.sort((a, b) => a.rank - b.rank);
    }
  }, [leaderboard, sortBy]);

  // Get current month display name
  const getMonthDisplayName = () => {
    const [year, month] = currentMonth.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Handle student card click
  const handleStudentCardClick = (student) => {
    // Navigate to assessment mode or student details
    console.log('Student clicked:', student);
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshLeaderboard();
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
    }
  };

  // Get grid layout based on screen size
  const getGridProps = () => {
    if (isSmall) return { xs: 12 }; // 1 column on mobile for better readability
    if (isMobile) return { xs: 12, sm: 6 }; // 1 column mobile, 2 on small tablets
    return { xs: 12, sm: 6, md: 4, lg: 3 }; // More responsive breakpoints
  };

  // Render skeleton loading cards
  const renderSkeletonCards = () => {
    return Array.from({ length: 8 }).map((_, index) => (
      <Grid item {...getGridProps()} key={`skeleton-${index}`}>
        <SkeletonCard />
      </Grid>
    ));
  };

  return (
    <PageBackground>
      {/* Child-Friendly Decorative Elements */}
      <ChildFriendlyDecorations />
      
      <PageContainer 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 1, sm: 2, md: 4, lg: 6 }, 
          px: { xs: 1, sm: 2, md: 3 }, // Reduced padding to prevent overflow
          // Ensure container doesn't exceed viewport
          maxWidth: { xs: '100%', sm: '100%', md: 'lg' },
          width: '100%',
          // Prevent horizontal overflow
          overflowX: 'hidden',
          // Box sizing to include padding in width calculation
          boxSizing: 'border-box'
        }}
      >
      {/* Header */}
      <Slide in={true} direction="down" timeout={600}>
        <HeaderCard sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: { xs: 1, sm: 2 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                <Box sx={{ 
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                  animation: 'bounce 1s infinite',
                  '@keyframes bounce': {
                    '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                    '40%': { transform: 'translateY(-10px)' },
                    '60%': { transform: 'translateY(-5px)' }
                  }
                }}>
                  🏆
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      background: 'linear-gradient(45deg, #FF6B9D, #F8B500, #66BB6A, #42A5F5)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem', lg: '2.5rem' },
                      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
                      lineHeight: { xs: 1.2, sm: 1.3 },
                      wordBreak: 'break-word',
                      fontFamily: '"Comic Sans MS", cursive, sans-serif'
                    }}
                  >
                    ⭐ Character Stars Leaderboard ⭐
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: '#2E3A59',
                      fontWeight: 500,
                      fontSize: { xs: '0.8rem', sm: '0.95rem', md: '1.1rem', lg: '1.25rem' },
                      fontFamily: '"Comic Sans MS", cursive, sans-serif'
                    }}
                  >
                    🌟 {getMonthDisplayName()} - {currentMonthTrait ? `${currentMonthTrait.name} Heroes` : 'Who\'s Shining?'} 🌟
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 0.5, sm: 1 },
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', sm: 'flex-end' }
              }}>
                <IconButton 
                  onClick={handleRefresh}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{ 
                    color: '#2E3A59',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,1)',
                      transform: 'rotate(180deg) scale(1.1)',
                      transition: 'all 0.3s ease'
                    },
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                    border: '2px solid rgba(255, 107, 157, 0.3)'
                  }}
                >
                  <Refresh sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </IconButton>
                
                <Button
                  variant="contained"
                  startIcon={<span style={{ fontSize: '1.2em' }}>🎆</span>}
                  onClick={() => onOpenAssessment && onOpenAssessment(0)}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    background: 'linear-gradient(45deg, #FF6B9D, #F8B500)',
                    '&:hover': { 
                      background: 'linear-gradient(45deg, #F8B500, #66BB6A)',
                      transform: 'scale(1.05)',
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
                    },
                    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                    px: { xs: 1, sm: 1.5, md: 2 },
                    minWidth: { xs: '90px', sm: '120px' },
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    color: 'white',
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                    fontFamily: '"Comic Sans MS", cursive, sans-serif'
                  }}
                >
                  {isMobile ? 'Rate!' : 'Start Rating!'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </HeaderCard>
      </Slide>

      {/* Stats Overview */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        {/* Character Trait Info */}
        {currentMonthTrait && (
          <Grid item xs={12}>
            <Zoom in={true} timeout={600}>
              <StatsCard sx={{ bgcolor: 'rgba(255, 193, 7, 0.1)', border: '2px solid #FFC107' }}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h6" sx={{ 
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    fontWeight: 'bold',
                    color: '#F57C00',
                    mb: 1
                  }}>
                    🎆 This Month's Focus: {currentMonthTrait.name} 🎆
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#2E3A59',
                    fontStyle: 'italic'
                  }}>
                    {currentMonthTrait.description}
                  </Typography>
                  {currentMonthTrait.primary && (
                    <Typography variant="caption" sx={{ 
                      color: '#666',
                      display: 'block',
                      mt: 0.5
                    }}>
                      Category: {currentMonthTrait.primary}
                    </Typography>
                  )}
                </Box>
              </StatsCard>
            </Zoom>
          </Grid>
        )}
        
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} timeout={600} style={{ transitionDelay: '100ms' }}>
            <StatsCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>⭐</Box>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 'bold',
                    color: '#FF6B9D'
                  }}>
                    {monthlyStats.totalAssessments}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#2E3A59',
                    fontFamily: '"Comic Sans MS", cursive, sans-serif'
                  }}>
                    Star Ratings
                  </Typography>
                </Box>
              </Box>
            </StatsCard>
          </Zoom>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} timeout={600} style={{ transitionDelay: '200ms' }}>
            <StatsCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>📈</Box>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 'bold',
                    color: '#F8B500'
                  }}>
                    {monthlyStats.averageClassScore.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#2E3A59',
                    fontFamily: '"Comic Sans MS", cursive, sans-serif'
                  }}>
                    Class Average
                  </Typography>
                </Box>
              </Box>
            </StatsCard>
          </Zoom>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} timeout={600} style={{ transitionDelay: '300ms' }}>
            <StatsCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>👩‍🎓</Box>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 'bold',
                    color: '#66BB6A'
                  }}>
                    {students.length}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#2E3A59',
                    fontFamily: '"Comic Sans MS", cursive, sans-serif'
                  }}>
                    Amazing Students
                  </Typography>
                </Box>
              </Box>
            </StatsCard>
          </Zoom>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} timeout={600} style={{ transitionDelay: '400ms' }}>
            <StatsCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>🎆</Box>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 'bold',
                    color: '#42A5F5'
                  }}>
                    {students.length}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#2E3A59',
                    fontFamily: '"Comic Sans MS", cursive, sans-serif'
                  }}>
                    Ready to Shine
                  </Typography>
                </Box>
              </Box>
            </StatsCard>
          </Zoom>
        </Grid>
      </Grid>

      {/* Sort Options */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: { xs: 0.5, sm: 1 }, 
        mb: { xs: 2, sm: 3 },
        flexWrap: 'wrap',
        px: { xs: 0.5, sm: 0 }
      }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            fontWeight: 500
          }}
        >
          Sort by:
        </Typography>
        {[
          { key: 'rank', label: 'Rank', icon: '🏆' },
          { key: 'stars', label: 'Stars', icon: '⭐' },
          { key: 'assessments', label: 'Assessments', icon: '📝' },
          { key: 'average', label: 'Average', icon: '📊' }
        ].map((option) => (
          <Chip
            key={option.key}
            label={`${option.icon} ${isMobile && option.key === 'assessments' ? 'Assess' : option.label}`}
            onClick={() => setSortBy(option.key)}
            variant={sortBy === option.key ? 'filled' : 'outlined'}
            color={sortBy === option.key ? 'primary' : 'default'}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              transition: 'all 0.3s ease',
              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
              bgcolor: sortBy === option.key ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.5)',
              '&:hover': {
                transform: 'scale(1.05)',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'white'
              },
              '& .MuiChip-label': {
                px: { xs: 1, sm: 1.5 }
              }
            }}
          />
        ))}
      </Box>

      {/* Leaderboard Grid */}
      {loading ? (
        <LeaderboardGrid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {renderSkeletonCards()}
        </LeaderboardGrid>
      ) : sortedLeaderboard.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Alert 
            severity="info" 
            sx={{ 
              maxWidth: 400, 
              mx: 'auto',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
              color: '#2E3A59',
              borderRadius: '20px',
              border: '3px solid rgba(255, 107, 157, 0.3)',
              fontFamily: '"Comic Sans MS", cursive, sans-serif'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ 
              fontWeight: 'bold',
              color: '#FF6B9D'
            }}>
              🌟 No stars yet! 🌟
            </Typography>
            <Typography variant="body2" sx={{ color: '#2E3A59' }}>
              Let's start rating students to see the magic happen! 🎆
            </Typography>
          </Alert>
        </Box>
      ) : (
        <LeaderboardGrid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {sortedLeaderboard.map((student, index) => (
            <Grid item {...getGridProps()} key={student.studentId}>
              <LeaderboardStudentCard
                student={student}
                rank={student.rank}
                onCardClick={handleStudentCardClick}
                animationDelay={index}
                yesterdayContent={yesterdayContent} // Pass yesterdayContent prop
              />
            </Grid>
          ))}
        </LeaderboardGrid>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => {
          onOpenAssessment && onOpenAssessment(0);
        }}
        sx={{
          animation: loading ? 'none' : `${bounceIn} 0.8s ease-out`,
          animationDelay: '1s',
          animationFillMode: 'both'
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>🎆</span>
      </FloatingActionButton>
    </PageContainer>
    </PageBackground>
  );
};

export default CharacterTraitLeaderboard;