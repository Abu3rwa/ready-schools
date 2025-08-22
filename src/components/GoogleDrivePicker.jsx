import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, CircularProgress } from "@mui/material";
import useDrivePicker from 'react-google-drive-picker';

export default function GoogleDrivePicker({ open, onClose, onFileSelect }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openPicker] = useDrivePicker();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
      setIsLoading(false);
    }
  }, [open]);

  const handleOpenPicker = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load the picker in an iframe instead of popup
      openPicker({
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        developerKey: "AIzaSyAYI6vd9LWfIsuTM6sCFtDz915QLlFlOdc",
        viewId: 'DOCS',
        showUploadView: false,
        setIncludeFolders: false,
        multiselect: false,
        customScopes: ['https://www.googleapis.com/auth/drive.readonly'],
        setOrigin: window.location.origin,
        setParentFolder: '',
        setSelectFolderEnabled: false,
        callbackFunction: (data) => {
          console.log('Picker callback received:', data);
          setIsLoading(false);
          
          if (data.action === 'picked') {
            const selectedFile = data.docs[0];
            if (selectedFile) {
              console.log('File selected:', selectedFile);
              const transformedFile = {
                id: selectedFile.id,
                name: selectedFile.name,
                mimeType: selectedFile.mimeType,
                iconLink: selectedFile.iconUrl,
                webViewLink: selectedFile.url,
                size: selectedFile.sizeBytes
              };
              
              onFileSelect && onFileSelect(transformedFile);
              onClose();
            }
          } else if (data.action === 'cancel') {
            setIsLoading(false);
            console.log('User cancelled');
          }
        },
        onAuthFailed: (data) => {
          console.error('Auth failed:', data);
          setIsLoading(false);
          setError(`Authentication failed: ${data.error || 'Unknown error'}. Please try again.`);
        },
        onPickerInited: (picker) => {
          console.log('Picker initialized successfully');
          setIsLoading(false);
        }
      });
    } catch (err) {
      console.error('Failed to open picker:', err);
      setIsLoading(false);
      setError('Failed to open Google Drive picker. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Check if required environment variables are set
  const missingEnvVars = [];
  if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) missingEnvVars.push('REACT_APP_GOOGLE_CLIENT_ID');
  if (!process.env.REACT_APP_GOOGLE_API_KEY) missingEnvVars.push('REACT_APP_GOOGLE_API_KEY');

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="sm"
      sx={{ 
        zIndex: 99999,
        '& .MuiDialog-paper': {
          zIndex: 99999,
          position: 'relative'
        }
      }}
      BackdropProps={{
        sx: { 
          zIndex: 99998,
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }
      }}
      disablePortal={false}
      keepMounted
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Select from Google Drive
        <Button
          onClick={handleClose}
          disabled={isLoading}
          sx={{ 
            minWidth: 'auto', 
            p: 0.5,
            color: 'text.secondary',
            '&:hover': { color: 'text.primary' }
          }}
        >
          ✕
        </Button>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', py: 3 }}>
          {error ? (
            <Box sx={{ color: 'error.main', mb: 2 }}>
              <Typography variant="body2">{error}</Typography>
            </Box>
          ) : null}
          
          {missingEnvVars.length > 0 ? (
            <Box sx={{ color: 'error.main', mb: 2 }}>
              <Typography variant="body2">
                Missing required environment variables: {missingEnvVars.join(', ')}
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Click the button below to open Google Drive and select a file.
              </Typography>
              
              <Button
                variant="contained"
                onClick={handleOpenPicker}
                disabled={isLoading}
                size="large"
                sx={{ minWidth: 200 }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Opening...
                  </>
                ) : (
                  'Open Google Drive'
                )}
              </Button>
            </>
          )}
          
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 2, fontSize: '0.8em', color: 'text.secondary' }}>
              Client ID: {process.env.REACT_APP_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}<br/>
              API Key: {process.env.REACT_APP_GOOGLE_API_KEY ? '✅ Set' : '❌ Missing'}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
