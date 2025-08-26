import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useCharacterTrait } from '../../contexts/CharacterTraitContext';
import { useStudents } from '../../contexts/StudentContext';

const ManualCharacterTraitInput = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { setStudentContent, yesterdayContent } = useCharacterTrait();
  const { students } = useStudents();
  
  const [editingStudent, setEditingStudent] = useState(null);
  const [tempData, setTempData] = useState({ quote: '', challenge: '', characterTrait: 'Character Development' });

  const handleStartEdit = (student) => {
    const existingContent = yesterdayContent[student.id];
    setEditingStudent(student.id);
    setTempData({
      quote: existingContent?.quote || '',
      challenge: existingContent?.challenge || '',
      characterTrait: existingContent?.characterTrait || 'Character Development'
    });
  };

  const handleSave = () => {
    if (!editingStudent) return;
    
    setStudentContent(editingStudent, tempData.quote, tempData.challenge, tempData.characterTrait);
    setEditingStudent(null);
    setTempData({ quote: '', challenge: '', characterTrait: 'Character Development' });
  };

  const handleCancel = () => {
    setEditingStudent(null);
    setTempData({ quote: '', challenge: '', characterTrait: 'Character Development' });
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '16px',
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600,
          color: theme.palette.primary.main,
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          📝 Set Character Trait Content
        </Typography>
        <IconButton onClick={onClose} size={isMobile ? 'small' : 'medium'}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Manually set quotes and challenges for each student. This content will be used during assessments.
          </Typography>
        </Alert>

        <Grid container spacing={2}>
          {students.map((student) => {
            const content = yesterdayContent[student.id];
            const isEditing = editingStudent === student.id;

            return (
              <Grid item xs={12} key={student.id}>
                <Card 
                  elevation={isEditing ? 4 : 1}
                  sx={{
                    border: isEditing ? `2px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 3
                    }
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      mb: 2
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.125rem' }
                      }}>
                        👤 {student.firstName} {student.lastName}
                      </Typography>
                      {!isEditing ? (
                        <Button
                          startIcon={<EditIcon />}
                          onClick={() => handleStartEdit(student)}
                          size={isMobile ? 'small' : 'medium'}
                          variant="outlined"
                        >
                          Edit
                        </Button>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            variant="contained"
                            color="primary"
                            size={isMobile ? 'small' : 'medium'}
                          >
                            Save
                          </Button>
                          <Button
                            startIcon={<CancelIcon />}
                            onClick={handleCancel}
                            variant="outlined"
                            size={isMobile ? 'small' : 'medium'}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          💫 Quote
                        </Typography>
                        {isEditing ? (
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={tempData.quote}
                            onChange={(e) => setTempData(prev => ({ ...prev, quote: e.target.value }))}
                            placeholder="Enter an inspirational quote..."
                            variant="outlined"
                            size={isMobile ? 'small' : 'medium'}
                          />
                        ) : (
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: theme.palette.grey[100], 
                            borderRadius: 1,
                            minHeight: 80,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <Typography variant="body2" sx={{ 
                              fontStyle: content?.quote ? 'italic' : 'normal',
                              color: content?.quote ? 'text.primary' : 'text.secondary'
                            }}>
                              {content?.quote || 'No quote set'}
                            </Typography>
                          </Box>
                        )}
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          🎯 Challenge
                        </Typography>
                        {isEditing ? (
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={tempData.challenge}
                            onChange={(e) => setTempData(prev => ({ ...prev, challenge: e.target.value }))}
                            placeholder="Enter a character challenge..."
                            variant="outlined"
                            size={isMobile ? 'small' : 'medium'}
                          />
                        ) : (
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: theme.palette.grey[100], 
                            borderRadius: 1,
                            minHeight: 80,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <Typography variant="body2" sx={{ 
                              color: content?.challenge ? 'text.primary' : 'text.secondary'
                            }}>
                              {content?.challenge || 'No challenge set'}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                    </Grid>

                    {isEditing && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          🌟 Character Trait
                        </Typography>
                        <TextField
                          fullWidth
                          value={tempData.characterTrait}
                          onChange={(e) => setTempData(prev => ({ ...prev, characterTrait: e.target.value }))}
                          placeholder="e.g., Perseverance, Kindness, Courage..."
                          variant="outlined"
                          size={isMobile ? 'small' : 'medium'}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManualCharacterTraitInput;