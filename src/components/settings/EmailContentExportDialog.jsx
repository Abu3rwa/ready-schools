import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, FormGroup, FormControlLabel, 
  Checkbox, Autocomplete, TextField, Avatar, Chip,
  RadioGroup, Radio, Alert, CircularProgress
} from '@mui/material';
import { Share, Person } from '@mui/icons-material';
import emailContentService from '../../services/emailContentService';

const EmailContentExportDialog = ({ open, onClose, contentLibrary, currentUser }) => {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [targetTeacher, setTargetTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [shareStrategy, setShareStrategy] = useState('merge');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      loadTeachers();
    }
  }, [open]);

  const loadTeachers = async () => {
    try {
      setIsLoading(true);
      const teachersList = await emailContentService.getTeachersList();
      // Filter out current user
      const otherTeachers = teachersList.filter(teacher => teacher.id !== currentUser.uid);
      setTeachers(otherTeachers);
    } catch (err) {
      setError('Failed to load teachers list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedTypes(prev => 
      checked ? [...prev, name] : prev.filter(type => type !== name)
    );
  };

  const handleShare = async () => {
    if (!targetTeacher || selectedTypes.length === 0) return;

    try {
      setIsLoading(true);
      await emailContentService.shareContentWithTeacher(
        targetTeacher.id, 
        selectedTypes, 
        shareStrategy
      );
      
      onClose();
      // Success handled by parent component
    } catch (err) {
      setError('Failed to share content: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const contentTypes = Object.keys(contentLibrary || {});
  const hasContent = selectedTypes.length > 0;
  const totalItemsToShare = selectedTypes.reduce((total, type) => {
    return total + (contentLibrary[type]?.length || 0);
  }, 0);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: 'white',
          minHeight: '400px'
        }
      }}
    >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Share />
          Share Email Content Templates
        </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          Share your email content templates directly with another teacher in your system.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Teacher Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            1. Select Target Teacher
          </Typography>
          <Autocomplete
            value={targetTeacher}
            onChange={(event, newValue) => setTargetTeacher(newValue)}
            options={teachers}
            getOptionLabel={(option) => `${option.displayName} (${option.email})`}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={option.photoURL} sx={{ width: 32, height: 32 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="body2">{option.displayName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search for a teacher..."
                fullWidth
                disabled={isLoading}
              />
            )}
            disabled={isLoading}
          />
        </Box>

        {/* Content Type Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            2. Choose Content to Share
        </Typography>
        <FormGroup>
          {contentTypes.map(type => (
            <FormControlLabel
              key={type}
                control={
                  <Checkbox 
                    checked={selectedTypes.includes(type)} 
                    onChange={handleCheckboxChange} 
                    name={type}
                    disabled={!contentLibrary[type] || contentLibrary[type].length === 0}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{type}</Typography>
                    <Chip 
                      label={`${contentLibrary[type]?.length || 0} items`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                }
            />
          ))}
        </FormGroup>
          
          {hasContent && (
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              Total: {totalItemsToShare} templates selected
            </Typography>
          )}
        </Box>

        {/* Share Strategy */}
        {hasContent && targetTeacher && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              3. Choose Sharing Strategy
            </Typography>
            <RadioGroup
              value={shareStrategy}
              onChange={(e) => setShareStrategy(e.target.value)}
            >
              <FormControlLabel
                value="merge"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2">Merge with existing content</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Add your templates to their existing library (recommended)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="add_only"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2">Add only new content</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only add templates they don't already have
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="replace"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" color="error.main">Replace their content</Typography>
                    <Typography variant="caption" color="error.main">
                      ⚠️ This will replace their existing templates with yours
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </Box>
        )}

        {/* Summary */}
        {hasContent && targetTeacher && (
          <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Ready to Share:
            </Typography>
            <Typography variant="body2">
              → Sharing {totalItemsToShare} templates with{' '}
              <strong>{targetTeacher.displayName}</strong>
            </Typography>
            <Typography variant="body2">
              → Strategy: {shareStrategy}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleShare}
          variant="contained"
          disabled={!targetTeacher || selectedTypes.length === 0 || isLoading}
          startIcon={isLoading ? <CircularProgress size={16} /> : <Share />}
        >
          {isLoading ? 'Sharing...' : 'Share Templates'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailContentExportDialog;