import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  Avatar,
  Paper,
  IconButton,
  Button,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Chip
} from '@mui/material';
import {
  Close,
  CheckCircle
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useCharacterTrait } from '../../contexts/CharacterTraitContext';
import { useStudents } from '../../contexts/StudentContext';
import { useAuth } from '../../contexts/AuthContext';

// Full-screen container with colorful background
const FullScreenContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
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
  zIndex: 1300,
  overflow: 'auto',
  padding: theme.spacing(2),
  
  // Floating decorative elements
  '&::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.2) 2px, transparent 2px),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.15) 3px, transparent 3px)
    `,
    backgroundSize: '100px 100px, 150px 150px',
    animation: 'float 20s infinite linear',
    pointerEvents: 'none',
    zIndex: -1
  },
  
  '@keyframes float': {
    '0%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-10px)' },
    '100%': { transform: 'translateY(0px)' }
  }
}));

// Header section
const HeaderSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '20px',
  backdropFilter: 'blur(20px)',
  border: '3px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
}));

// Student row container
const StudentRow = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '16px',
  border: '2px solid rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(20px)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    background: 'rgba(255, 255, 255, 1)'
  },
  
  // Animated border
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
    flexDirection: 'column',
    gap: theme.spacing(2),
    textAlign: 'center'
  }
}));

// Student avatar with ranking colors
const StudentAvatar = styled(Avatar)(({ theme, rank }) => ({
  width: { xs: 70, sm: 80, md: 90 },
  height: { xs: 70, sm: 80, md: 90 },
  border: `4px solid ${
    rank === 1 ? '#FFD700' : 
    rank === 2 ? '#C0C0C0' : 
    rank === 3 ? '#CD7F32' : 
    '#42A5F5'
  }`,
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.8rem' },
  fontWeight: 'bold'
}));

// Level badge
const LevelBadge = styled(Chip)(({ theme, level }) => ({
  background: `
    linear-gradient(135deg, 
      ${level >= 4 ? '#66BB6A' : level >= 3 ? '#FFA726' : level >= 2 ? '#FF7043' : '#FF5252'} 0%, 
      ${level >= 4 ? '#4CAF50' : level >= 3 ? '#FF9800' : level >= 2 ? '#FF5722' : '#F44336'} 100%
    )
  `,
  color: 'white',
  fontWeight: 'bold',
  fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
  fontFamily: '"Comic Sans MS", cursive, sans-serif',
  border: '2px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
}));

const AssessmentMode = ({ onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { assessStudent, loading, currentMonthTrait, yesterdayContent, leaderboard, getTodaysAssessments, refreshLeaderboard } = useCharacterTrait();
  const { students } = useStudents();
  const { currentUser } = useAuth();
  
  const [studentRatings, setStudentRatings] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedStudents, setSavedStudents] = useState(new Set());
  
  // Load existing ratings when component mounts
  useEffect(() => {
    const loadExistingRatings = () => {
      const todaysAssessments = getTodaysAssessments();
      const existingRatings = {};
      const alreadySaved = new Set();
      
      todaysAssessments.forEach(assessment => {
        existingRatings[assessment.studentId] = assessment.starRating || assessment.totalScore || 0;
        alreadySaved.add(assessment.studentId);
      });
      
      setStudentRatings(existingRatings);
      setSavedStudents(alreadySaved);
    };
    
    if (getTodaysAssessments) {
      loadExistingRatings();
    }
  }, [getTodaysAssessments, currentUser]);
  
  // Get all students for assessment sorted by their current stars
  const allStudents = React.useMemo(() => {
    if (!students || students.length === 0) return [];
    
    // Create student data with current leaderboard stats
    const studentsWithStats = students.map(student => {
      const leaderboardEntry = leaderboard.find(entry => entry.studentId === student.id);
      
      return {
        ...student,
        totalStars: leaderboardEntry?.totalStars || 0,
        averageScore: leaderboardEntry?.averageScore || 0,
        assessmentCount: leaderboardEntry?.assessmentCount || 0,
        rank: leaderboardEntry?.rank || 999
      };
    });
    
    // Sort by total stars (descending), then by average score
    return studentsWithStats.sort((a, b) => {
      if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars;
      return b.averageScore - a.averageScore;
    });
  }, [students, leaderboard]);
  
  // Calculate level based on star rating
  const getLevel = (stars) => {
    if (stars >= 5) return 'Master';
    if (stars >= 4) return 'Expert';
    if (stars >= 3) return 'Good';
    if (stars >= 2) return 'Learning';
    if (stars >= 1) return 'Beginner';
    return 'Not Rated';
  };
  
  // Handle star rating change with auto-save
  const handleRatingChange = async (studentId, rating) => {
    setStudentRatings(prev => ({
      ...prev,
      [studentId]: rating
    }));
    
    // Auto-save the rating immediately
    if (rating > 0) {
      const student = allStudents.find(s => s.id === studentId);
      
      if (student) {
        try {
          await assessStudent(
            studentId,
            rating,
            `Character assessment: ${rating} stars for ${currentMonthTrait?.name || 'Character Development'}`
          );
          
          // Force immediate leaderboard refresh
          if (refreshLeaderboard) {
            await refreshLeaderboard();
          }
          if (window.refreshCharacterLeaderboard) {
            window.refreshCharacterLeaderboard();
          }
          
          // Mark as saved
          setSavedStudents(prev => new Set([...prev, studentId]));
          
          // Remove saved indicator after 2 seconds
          setTimeout(() => {
            setSavedStudents(prev => {
              const newSet = new Set(prev);
              newSet.delete(studentId);
              return newSet;
            });
          }, 2000);
          
        } catch (error) {
          console.error('Error auto-saving assessment:', error);
        }
      }
    }
  };
  
  // Handle save individual student
  const handleSaveStudent = async (student) => {
    const rating = studentRatings[student.id];
    if (!rating) {
      alert('Please select a star rating before saving');
      return;
    }
    
    setSaving(true);
    try {
      await assessStudent(
        student.id,
        rating,
        `Character assessment: ${rating} stars`
      );
      
      setSavedStudents(prev => new Set([...prev, student.id]));
      
      // Show success animation
      setTimeout(() => {
        setSavedStudents(prev => {
          const newSet = new Set(prev);
          newSet.delete(student.id);
          return newSet;
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error saving assessment:', error);
      alert(`Failed to save assessment for ${student.firstName}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };
  
  // Save all ratings
  const handleSaveAll = async () => {
    const studentsToSave = allStudents.filter(student => 
      studentRatings[student.id] && !savedStudents.has(student.id)
    );
    
    if (studentsToSave.length === 0) {
      alert('No new ratings to save');
      return;
    }
    
    setSaving(true);
    try {
      for (const student of studentsToSave) {
        await assessStudent(
          student.id,
          studentRatings[student.id],
          `Character assessment: ${studentRatings[student.id]} stars`
        );
        setSavedStudents(prev => new Set([...prev, student.id]));
      }
    } catch (error) {
      console.error('Error saving assessments:', error);
      alert('Failed to save some assessments. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  

  

  
  if (loading) {
    return (
      <FullScreenContainer>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2
        }}>
          <LinearProgress sx={{ width: '100%', maxWidth: 300 }} />
          <Typography sx={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
            Loading students...
          </Typography>
        </Box>
      </FullScreenContainer>
    );
  }

  // Check authentication
  if (!currentUser?.uid) {
    return (
      <FullScreenContainer>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 3,
          textAlign: 'center',
          maxWidth: 500,
          mx: 'auto',
          p: 3
        }}>
          <Typography variant="h4" sx={{ 
            color: 'white', 
            fontWeight: 'bold',
            mb: 1
          }}>
            🔒 Authentication Required
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            mb: 2
          }}>
            Please log in to access the Character Assessment Mode
          </Typography>
          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              background: 'linear-gradient(45deg, #FF6B9D, #F8B500)',
              fontWeight: 'bold',
              borderRadius: '12px',
              px: 4,
              py: 1.5
            }}
          >
            Go Back
          </Button>
        </Box>
      </FullScreenContainer>
    );
  }
  
  return (
    <FullScreenContainer>
      {/* Header */}
      <HeaderSection>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ fontSize: '2rem', animation: 'bounce 1s infinite' }}>
            🌟
          </Box>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #FF6B9D, #F8B500, #66BB6A, #42A5F5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              fontFamily: '"Comic Sans MS", cursive, sans-serif'
            }}>
              Character Assessment Mode
            </Typography>
            <Typography variant="subtitle1" sx={{ 
              color: '#2E3A59',
              fontFamily: '"Comic Sans MS", cursive, sans-serif',
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
            }}>
              🎯 {currentMonthTrait ? `This Month: ${currentMonthTrait.name}` : 'Rate each student\'s character development'}
            </Typography>
            {currentMonthTrait && (
              <Typography variant="body2" sx={{ 
                color: '#666',
                fontStyle: 'italic',
                mt: 0.5
              }}>
                {currentMonthTrait.description}
              </Typography>
            )}
          </Box>
        </Box>
        
        <IconButton 
          onClick={onClose}
          sx={{ 
            bgcolor: 'rgba(244, 67, 54, 0.1)',
            color: '#F44336',
            '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
          }}
        >
          <Close />
        </IconButton>
      </HeaderSection>
      
      {/* Students List */}
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {allStudents.length === 0 ? (
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center', 
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px'
          }}>
            <Typography variant="h6" sx={{ color: '#2E3A59' }}>
              No students available for assessment
            </Typography>
          </Paper>
        ) : (
          allStudents.map((student, index) => {
            const currentRating = studentRatings[student.id] || 0;
            const isSaved = savedStudents.has(student.id);
            const level = getLevel(currentRating);
            const studentContent = yesterdayContent[student.id] || {};
            const currentRank = index + 1; // Dynamic ranking based on current sort
            
            return (
              <Fade in={true} timeout={500} style={{ transitionDelay: `${index * 100}ms` }} key={student.id}>
                <StudentRow>
                  {/* Dynamic Rank */}
                  <Box sx={{ 
                    minWidth: 60, 
                    textAlign: 'center',
                    mr: { xs: 1, sm: 2, md: 3 }
                  }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 'bold',
                      color: currentRank === 1 ? '#FFD700' : currentRank === 2 ? '#C0C0C0' : currentRank === 3 ? '#CD7F32' : '#42A5F5',
                      fontFamily: '"Comic Sans MS", cursive, sans-serif'
                    }}>
                      #{currentRank}
                    </Typography>
                  </Box>
                  
                  {/* Student Image */}
                  <StudentAvatar
                    src={student.photoURL || student.studentImage}
                    rank={currentRank}
                    sx={{ mr: { xs: 1, sm: 2, md: 3 } }}
                  >
                    {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                  </StudentAvatar>
                  
                  {/* Student Info & Content */}
                  <Box sx={{ 
                    minWidth: { xs: 200, sm: 250, md: 300 }, 
                    mr: { xs: 1, sm: 2, md: 3 }
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold',
                      color: '#2E3A59',
                      fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
                      fontFamily: '"Comic Sans MS", cursive, sans-serif'
                    }}>
                      {student.firstName} {student.lastName}
                    </Typography>
                  </Box>
                  
                  {/* Star Rating */}
                  <Box sx={{ 
                    mr: { xs: 1, sm: 2, md: 3 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Rating
                      value={currentRating}
                      onChange={(_, value) => handleRatingChange(student.id, value || 0)}
                      size={isMobile ? 'medium' : 'large'}
                      sx={{ 
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                        '& .MuiRating-iconFilled': {
                          color: '#FFC107'
                        },
                        '& .MuiRating-iconHover': {
                          color: '#FFC107'
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ 
                      color: '#666',
                      fontWeight: 'bold'
                    }}>
                      {currentRating > 0 ? `${currentRating} star${currentRating > 1 ? 's' : ''}` : 'Not rated'}
                    </Typography>
                  </Box>
                  
                  {/* Level Badge */}
                  <Box sx={{ mr: { xs: 1, sm: 2, md: 3 } }}>
                    <LevelBadge 
                      label={level}
                      level={currentRating}
                    />
                  </Box>
                  
                  {/* Total Stars - Using Actual Data */}
                  <Box sx={{ 
                    minWidth: 80,
                    textAlign: 'center',
                    mr: { xs: 1, sm: 2 }
                  }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 'bold',
                      color: '#F8B500',
                      fontFamily: '"Comic Sans MS", cursive, sans-serif'
                    }}>
                      ⭐ {student.totalStars}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#666',
                      display: 'block'
                    }}>
                      Total Stars
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#666',
                      display: 'block',
                      fontSize: '0.7rem'
                    }}>
                      Avg: {student.averageScore.toFixed(1)}
                    </Typography>
                  </Box>
                  
                  {/* Save Button */}
                  <Box>
                    {isSaved ? (
                      <Chip
                        icon={<CheckCircle />}
                        label="Saved!"
                        color="success"
                        sx={{ fontWeight: 'bold' }}
                      />
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleSaveStudent(student)}
                        disabled={!currentRating || saving}
                        sx={{
                          background: currentRating ? 'linear-gradient(45deg, #FF6B9D, #F8B500)' : undefined,
                          minWidth: 80,
                          fontWeight: 'bold',
                          borderRadius: '12px'
                        }}
                      >
                        {saving ? 'Saving...' : 'Manual Save'}
                      </Button>
                    )}
                  </Box>
                </StudentRow>
              </Fade>
            );
          })
        )}
      </Box>
    </FullScreenContainer>
  );
};

export default AssessmentMode;