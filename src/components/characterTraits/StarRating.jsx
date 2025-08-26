import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Animations
const pulseGlow = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 10px rgba(255, 193, 7, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0);
  }
`;

const sparkle = keyframes`
  0% {
    transform: rotate(0deg) scale(1);
    opacity: 1;
  }
  50% {
    transform: rotate(180deg) scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: rotate(360deg) scale(1);
    opacity: 1;
  }
`;

const bounce = keyframes`
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
`;

// Styled components
const StarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1),
  borderRadius: theme.spacing(2),
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.15)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  },

  [theme.breakpoints.down('md')]: {
    gap: theme.spacing(0.25),
    padding: theme.spacing(0.75),
    borderRadius: theme.spacing(1.5),
  }
}));

const StarButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'isSelected' && prop !== 'isHovered' && prop !== 'size'
})(({ theme, isSelected, isHovered, size }) => ({
  padding: size === 'large' ? theme.spacing(1.5) : theme.spacing(1),
  color: isSelected ? '#FFC107' : theme.palette.grey[400],
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  
  '& .MuiSvgIcon-root': {
    fontSize: size === 'large' ? '2.5rem' : size === 'medium' ? '2rem' : '1.75rem',
    filter: isSelected ? 'drop-shadow(0 2px 8px rgba(255, 193, 7, 0.4))' : 'none',
    transition: 'all 0.2s ease',
  },

  '&:hover': {
    transform: 'scale(1.1)',
    '& .MuiSvgIcon-root': {
      filter: 'drop-shadow(0 4px 12px rgba(255, 193, 7, 0.6))',
    }
  },

  '&:active': {
    transform: 'scale(0.95)',
  },

  ...(isSelected && {
    animation: `${pulseGlow} 0.6s ease-out`,
    '& .MuiSvgIcon-root': {
      animation: `${sparkle} 0.8s ease-in-out`,
    }
  }),

  ...(isHovered && {
    '& .MuiSvgIcon-root': {
      animation: `${bounce} 0.6s ease-in-out`,
    }
  }),

  // Mobile touch optimization
  [theme.breakpoints.down('md')]: {
    minWidth: 44,
    minHeight: 44,
    padding: theme.spacing(0.75),
    
    '& .MuiSvgIcon-root': {
      fontSize: size === 'large' ? '2.25rem' : size === 'medium' ? '1.875rem' : '1.5rem',
    }
  },

  // Extra small screens
  [theme.breakpoints.down('sm')]: {
    minWidth: 40,
    minHeight: 40,
    
    '& .MuiSvgIcon-root': {
      fontSize: size === 'large' ? '2rem' : size === 'medium' ? '1.75rem' : '1.375rem',
    }
  }
}));

const ScoreDisplay = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1.1rem',
  color: theme.palette.primary.main,
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  minWidth: '60px',
  textAlign: 'center',
  
  [theme.breakpoints.down('md')]: {
    fontSize: '1rem',
    minWidth: '50px',
  },

  [theme.breakpoints.down('sm')]: {
    fontSize: '0.9rem',
    minWidth: '45px',
  }
}));

const StarRating = ({ 
  value = 0, 
  onChange, 
  maxStars = 5, 
  size = 'medium', // 'small', 'medium', 'large'
  showScore = true,
  showLabel = false,
  label = '',
  disabled = false,
  readonly = false,
  allowHalfStars = false,
  color = 'primary'
}) => {
  const theme = useTheme();
  const [hoverValue, setHoverValue] = useState(0);
  const [animatingStars, setAnimatingStars] = useState(new Set());

  // Handle star click/touch
  const handleStarClick = (starValue) => {
    if (disabled || readonly) return;
    
    // Add animation to clicked star
    setAnimatingStars(new Set([starValue]));
    
    // Trigger haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    if (onChange) {
      onChange(starValue);
    }
    
    // Remove animation after completion
    setTimeout(() => {
      setAnimatingStars(new Set());
    }, 800);
  };

  // Handle mouse/touch hover
  const handleStarHover = (starValue) => {
    if (disabled || readonly) return;
    setHoverValue(starValue);
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  // Calculate display value (hover takes precedence)
  const displayValue = hoverValue || value;

  // Generate score text
  const getScoreText = () => {
    if (displayValue === 0) return 'Not Rated';
    if (displayValue === 1) return 'Poor';
    if (displayValue === 2) return 'Fair';
    if (displayValue === 3) return 'Good';
    if (displayValue === 4) return 'Great';
    if (displayValue === 5) return 'Excellent';
    return `${displayValue}/${maxStars}`;
  };

  // Get star color based on rating
  const getStarColor = (starIndex) => {
    if (starIndex <= displayValue) {
      if (displayValue <= 2) return '#FF6B6B'; // Red for low scores
      if (displayValue <= 3) return '#FFD93D'; // Yellow for medium scores
      return '#4ECDC4'; // Green for high scores
    }
    return theme.palette.grey[400];
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        width: '100%',
        maxWidth: size === 'large' ? '400px' : size === 'medium' ? '320px' : '280px',
        margin: '0 auto',
      }}
    >
      {showLabel && label && (
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 500,
            textAlign: 'center',
            mb: 0.5
          }}
        >
          {label}
        </Typography>
      )}

      <StarContainer
        onMouseLeave={handleMouseLeave}
        sx={{
          opacity: disabled ? 0.5 : 1,
          cursor: disabled || readonly ? 'default' : 'pointer',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {[...Array(maxStars)].map((_, index) => {
          const starValue = index + 1;
          const isSelected = starValue <= displayValue;
          const isAnimating = animatingStars.has(starValue);
          
          return (
            <StarButton
              key={starValue}
              isSelected={isSelected}
              isHovered={hoverValue === starValue}
              size={size}
              disabled={disabled}
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => handleStarHover(starValue)}
              onTouchStart={() => handleStarHover(starValue)}
              sx={{
                color: getStarColor(starValue),
                ...(isAnimating && {
                  animation: `${pulseGlow} 0.6s ease-out`,
                })
              }}
              aria-label={`Rate ${starValue} out of ${maxStars} stars`}
            >
              {isSelected ? <Star /> : <StarBorder />}
            </StarButton>
          );
        })}
      </StarContainer>

      {showScore && (
        <ScoreDisplay variant="body1">
          {getScoreText()}
        </ScoreDisplay>
      )}
    </Box>
  );
};

export default StarRating;