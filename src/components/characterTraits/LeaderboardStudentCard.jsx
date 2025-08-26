import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  useTheme,
  IconButton,
  Tooltip,
  Zoom,
  Fade
} from '@mui/material';
import {
  Star,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  EmojiEvents,
  Psychology,
  Assignment,
  School
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Animation keyframes - inspired by Blooket's smooth transitions
const slideUpAnimation = keyframes`
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

const rankUpAnimation = keyframes`
  0% {
    transform: translateY(0) scale(1);
    background: rgba(76, 205, 196, 0.1);
  }
  50% {
    transform: translateY(-10px) scale(1.02);
    background: rgba(76, 205, 196, 0.3);
    box-shadow: 0 8px 32px rgba(76, 205, 196, 0.4);
  }
  100% {
    transform: translateY(0) scale(1);
    background: rgba(76, 205, 196, 0.1);
  }
`;

const rankDownAnimation = keyframes`
  0% {
    transform: translateY(0) scale(1);
    background: rgba(255, 107, 107, 0.1);
  }
  50% {
    transform: translateY(10px) scale(0.98);
    background: rgba(255, 107, 107, 0.3);
  }
  100% {
    transform: translateY(0) scale(1);
    background: rgba(255, 107, 107, 0.1);
  }
`;

const starShimmer = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 4px 20px rgba(255, 193, 7, 0.3);
  }
  50% {
    box-shadow: 0 8px 40px rgba(255, 193, 7, 0.6);
  }
`;

// Styled components with glassmorphism (like DeveloperPage)
const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'rank' && prop !== 'rankChange' && prop !== 'isTopPerformer'
})(({ theme, rank, rankChange, isTopPerformer }) => ({
  background: `${theme.palette.background.paper}${rank <= 3 ? '30' : '20'}`,
  backdropFilter: 'blur(10px)',
  border: `2px solid ${
    rank === 1 ? '#FFD700' : 
    rank === 2 ? '#C0C0C0' : 
    rank === 3 ? '#CD7F32' : 
    `${theme.palette.primary.contrastText}30`
  }`,
  borderRadius: { xs: '12px', sm: '14px', md: '16px' },
  position: 'relative',
  overflow: 'visible',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  animation: `${slideUpAnimation} 0.6s ease-out`,
  maxWidth: '100%',
  width: '100%',
  
  '&:hover': {
    transform: {
      xs: 'translateY(-2px)',
      sm: 'translateY(-4px)',
      md: 'translateY(-6px) scale(1.02)'
    },
    boxShadow: {
      xs: `0 8px 24px ${theme.palette.primary.main}20`,
      md: `0 20px 40px ${theme.palette.primary.main}30`
    },
    background: `${theme.palette.background.paper}40`,
    borderColor: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : theme.palette.primary.main,
  },

  ...(rankChange > 0 && {
    animation: `${rankUpAnimation} 1.2s ease-out`,
  }),

  ...(rankChange < 0 && {
    animation: `${rankDownAnimation} 1.2s ease-out`,
  }),

  ...(isTopPerformer && {
    animation: `${pulseGlow} 2s infinite`,
  }),

  // Mobile responsiveness
  [theme.breakpoints.down('md')]: {
    '&:hover': {
      transform: 'translateY(-2px)',
    }
  }
}));

const RankBadge = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'rank'
})(({ theme, rank }) => ({
  position: 'absolute',
  top: -8,
  left: -8,
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${
    rank === 1 ? '#FFD700, #FFA000' : 
    rank === 2 ? '#C0C0C0, #9E9E9E' : 
    rank === 3 ? '#CD7F32, #BF6000' : 
    `${theme.palette.primary.main}, ${theme.palette.primary.dark}`
  })`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '1rem',
  color: 'white',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  zIndex: 2,

  [theme.breakpoints.down('md')]: {
    width: 36,
    height: 36,
    fontSize: '0.9rem',
    top: -6,
    left: -6,
  },

  [theme.breakpoints.down('sm')]: {
    width: 32,
    height: 32,
    fontSize: '0.8rem',
    top: -4,
    left: -4,
  }
}));

const TrophyIcon = styled(EmojiEvents)(({ theme }) => ({
  position: 'absolute',
  top: -12,
  right: -12,
  fontSize: '2rem',
  color: '#FFD700',
  filter: 'drop-shadow(0 2px 8px rgba(255, 215, 0, 0.5))',
  animation: `${starShimmer} 2s infinite`,

  [theme.breakpoints.down('md')]: {
    fontSize: '1.75rem',
    top: -10,
    right: -10,
  },

  [theme.breakpoints.down('sm')]: {
    fontSize: '1.5rem',
    top: -8,
    right: -8,
  }
}));

const StarsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1),
  background: 'rgba(255, 193, 7, 0.1)',
  borderRadius: theme.spacing(3),
  border: '1px solid rgba(255, 193, 7, 0.3)',

  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.25, 0.75),
    gap: theme.spacing(0.25),
  }
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),

  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.75),
  }
}));

const LeaderboardStudentCard = ({ 
  student, 
  rank, 
  onCardClick,
  showDetails = true,
  animationDelay = 0,
  yesterdayContent = {} // Add yesterdayContent prop
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [previousRank, setPreviousRank] = useState(rank);

  // Get content for this student
  const studentContent = yesterdayContent[student.studentId] || {};
  const { quote = '', challenge = '', characterTrait = 'Character Development' } = studentContent;

  // Trigger entrance animation with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay * 100);

    return () => clearTimeout(timer);
  }, [animationDelay]);

  // Track rank changes for animations
  useEffect(() => {
    if (previousRank !== rank) {
      setPreviousRank(rank);
    }
  }, [rank, previousRank]);

  const rankChange = previousRank - rank; // Positive = moved up, Negative = moved down
  const isTopPerformer = rank === 1;
  const isTopThree = rank <= 3;

  // Calculate progress percentage (out of max possible stars)
  const maxPossibleStars = 310; // Assuming 31 days * 10 max stars per day
  const progressPercentage = Math.min((student.totalStars / maxPossibleStars) * 100, 100);

  // Get trend icon based on rank change
  const getTrendIcon = () => {
    if (rankChange > 0) return <TrendingUp sx={{ color: '#4ECDC4', fontSize: '1.2rem' }} />;
    if (rankChange < 0) return <TrendingDown sx={{ color: '#FF6B6B', fontSize: '1.2rem' }} />;
    return <TrendingFlat sx={{ color: theme.palette.grey[500], fontSize: '1.2rem' }} />;
  };

  // Get rank suffix
  const getRankSuffix = (rank) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  // Get performance color
  const getPerformanceColor = () => {
    if (student.averageScore >= 4.5) return '#4ECDC4'; // Excellent
    if (student.averageScore >= 3.5) return '#FFD93D'; // Good
    if (student.averageScore >= 2.5) return '#FF9F43'; // Fair
    return '#FF6B6B'; // Needs improvement
  };

  return (
    <Fade in={isVisible} timeout={600}>
      <StyledCard
        rank={rank}
        rankChange={rankChange}
        isTopPerformer={isTopPerformer}
        onClick={() => onCardClick && onCardClick(student)}
        sx={{
          width: '100%',
          height: { xs: 'auto', sm: '320px', md: '340px' }, // Increased height for quotes/challenges
          minHeight: { xs: '280px', sm: '320px' }, // Increased minimum height
        }}
      >
        {/* Rank Badge */}
        <RankBadge rank={rank}>
          {rank}
        </RankBadge>

        {/* Trophy for #1 */}
        {isTopPerformer && <TrophyIcon />}

        <CardContent sx={{ 
          p: { xs: 1.5, sm: 2, md: 2.5 },
          pb: { xs: 1.5, sm: 2, md: 2.5 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* Student Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: 1 }}>
            <Avatar
              src={student.studentImage || student.photoURL}
              sx={{ 
                width: { xs: 70, sm: 76, md: 84 }, 
                height: { xs: 70, sm: 76, md: 84 },
                border: `3px solid ${isTopThree ? 
                  (rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32') : 
                  theme.palette.primary.main}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {student.studentName?.charAt(0)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {student.studentName}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  {rank}{getRankSuffix(rank)} Place
                </Typography>
                
                {rankChange !== 0 && (
                  <Tooltip title={`${rankChange > 0 ? 'Up' : 'Down'} ${Math.abs(rankChange)} position${Math.abs(rankChange) > 1 ? 's' : ''}`}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getTrendIcon()}
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>

          {/* Stars Display */}
          <StarsContainer>
            <Star sx={{ color: '#FFC107', fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: '#FFC107',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
              }}
            >
              {student.totalStars}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              stars
            </Typography>
          </StarsContainer>

          {showDetails && (
            <Box sx={{ mt: 1 }}>
              {/* Quote and Challenge Content */}
              {(quote || challenge) ? (
                <Box sx={{ mb: 2 }}>
                  {/* Quote Section */}
                  {quote && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          color: '#9C27B0',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          display: 'block',
                          mb: 0.5
                        }}
                      >
                        💫 Today's Quote
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.8rem' },
                          fontStyle: 'italic',
                          color: theme.palette.text.secondary,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          textOverflow: 'ellipsis',
                          background: 'rgba(156, 39, 176, 0.05)',
                          padding: '8px',
                          borderRadius: '8px',
                          border: '1px solid rgba(156, 39, 176, 0.1)'
                        }}
                      >
                        "{quote}"
                      </Typography>
                    </Box>
                  )}

                  {/* Challenge Section */}
                  {challenge && (
                    <Box sx={{ mb: 1 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          color: '#FF9800',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          display: 'block',
                          mb: 0.5
                        }}
                      >
                        🎯 Today's Challenge
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.8rem' },
                          color: theme.palette.text.secondary,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          textOverflow: 'ellipsis',
                          background: 'rgba(255, 152, 0, 0.05)',
                          padding: '8px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 152, 0, 0.1)'
                        }}
                      >
                        {challenge}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ 
                  mb: 2, 
                  textAlign: 'center',
                  py: 2,
                  background: 'rgba(0, 0, 0, 0.03)',
                  borderRadius: '8px',
                  border: '1px dashed rgba(0, 0, 0, 0.1)'
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      fontStyle: 'italic'
                    }}
                  >
                    📝 No daily content available yet
                  </Typography>
                </Box>
              )}

              {/* Performance Breakdown */}
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 0.5, sm: 1 }, 
                mb: 1,
                flexWrap: 'wrap'
              }}>
                <Chip
                  icon={<Psychology />}
                  label={`${student.quoteStars || 0} Quote Stars`}
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    height: { xs: 22, sm: 24 },
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    color: theme.palette.text.primary,
                    '& .MuiChip-icon': {
                      fontSize: { xs: '0.8rem', sm: '0.9rem' }
                    }
                  }}
                />
                <Chip
                  icon={<Assignment />}
                  label={`${student.challengeStars || 0} Challenge Stars`}
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    height: { xs: 22, sm: 24 },
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    color: theme.palette.text.primary,
                    '& .MuiChip-icon': {
                      fontSize: { xs: '0.8rem', sm: '0.9rem' }
                    }
                  }}
                />
              </Box>

              {/* Progress Bar */}
              <ProgressContainer>
                <School sx={{ color: theme.palette.text.secondary, fontSize: '1rem' }} />
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{
                      height: { xs: 6, sm: 8 },
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getPerformanceColor(),
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    fontWeight: 500
                  }}
                >
                  {student.averageScore.toFixed(1)}/5
                </Typography>
              </ProgressContainer>

              {/* Assessment Count */}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  display: 'block',
                  textAlign: 'center',
                  mt: 0.5
                }}
              >
                {student.assessmentCount} assessment{student.assessmentCount !== 1 ? 's' : ''} completed
              </Typography>
            </Box>
          )}
        </CardContent>
      </StyledCard>
    </Fade>
  );
};

export default LeaderboardStudentCard;