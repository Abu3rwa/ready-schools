import React, { useState } from 'react';
import { Box, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import CharacterTraitLeaderboard from '../components/characterTraits/CharacterTraitLeaderboard';
import AssessmentMode from '../components/characterTraits/AssessmentMode';
import { CharacterTraitProvider } from '../contexts/CharacterTraitContext';

// Styled components
const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  paddingTop: theme.spacing(1),
  
  [theme.breakpoints.down('md')]: {
    paddingTop: theme.spacing(0.5),
  }
}));

const CharacterTraits = () => {
  const [assessmentMode, setAssessmentMode] = useState(false);
  const [initialStudentIndex, setInitialStudentIndex] = useState(0);

  // Handle opening assessment mode
  const handleOpenAssessment = (studentIndex = 0) => {
    setInitialStudentIndex(studentIndex);
    setAssessmentMode(true);
  };

  // Handle closing assessment mode
  const handleCloseAssessment = () => {
    setAssessmentMode(false);
  };

  return (
    <CharacterTraitProvider>
      <PageWrapper>
        <Container 
          maxWidth="xl" 
          sx={{ 
            px: { xs: 0, sm: 0.5, md: 1 }, // Reduced padding to prevent overflow
            py: { xs: 0, sm: 1 },
            width: '100%',
            overflowX: 'hidden'
          }}
        >
          {/* Main Leaderboard */}
          <CharacterTraitLeaderboard onOpenAssessment={handleOpenAssessment} />
          
          {/* Assessment Mode Modal */}
          {assessmentMode && (
            <AssessmentMode
              onClose={handleCloseAssessment}
            />
          )}
        </Container>
      </PageWrapper>
    </CharacterTraitProvider>
  );
};

export default CharacterTraits