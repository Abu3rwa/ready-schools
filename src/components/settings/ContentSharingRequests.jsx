import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import { 
  Check as CheckIcon, 
  Close as CloseIcon, 
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import emailContentService from '../../services/emailContentService';

const ContentSharingRequests = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewDialog, setPreviewDialog] = useState({ open: false, request: null });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const pendingRequests = await emailContentService.getPendingSharingRequests();
      setRequests(pendingRequests);
    } catch (err) {
      setError('Failed to load sharing requests: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      setError(null);
      await emailContentService.acceptSharingRequest(requestId);
      setSuccess('Content accepted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      loadRequests(); // Reload the list
    } catch (err) {
      setError('Failed to accept content: ' + err.message);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setError(null);
      await emailContentService.rejectSharingRequest(requestId);
      setSuccess('Request rejected successfully!');
      setTimeout(() => setSuccess(null), 3000);
      loadRequests(); // Reload the list
    } catch (err) {
      setError('Failed to reject request: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStrategyLabel = (strategy) => {
    switch (strategy) {
      case 'merge': return 'Merge with existing';
      case 'add_only': return 'Add only new';
      case 'replace': return 'Replace existing';
      default: return strategy;
    }
  };

  const getStrategyColor = (strategy) => {
    switch (strategy) {
      case 'merge': return 'primary';
      case 'add_only': return 'success';
      case 'replace': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Content Sharing Requests
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {requests.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No pending content sharing requests
          </Typography>
        </Card>
      ) : (
        <List>
          {requests.map((request, index) => (
            <React.Fragment key={request.id}>
              <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {request.fromTeacherName}
                        </Typography>
                        <Chip 
                          label={getStrategyLabel(request.strategy)}
                          color={getStrategyColor(request.strategy)}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {request.fromTeacherEmail}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <ScheduleIcon sx={{ fontSize: 12, mr: 0.5 }} />
                          {formatDate(request.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => setPreviewDialog({ open: true, request })}
                      >
                        Preview
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => handleAccept(request.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={() => handleReject(request.id)}
                      >
                        Reject
                      </Button>
                    </Box>
                  </ListItemSecondaryAction>
                </Box>
                
                <Box sx={{ ml: 7 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Content to share:</strong> {request.contentTypes.join(', ')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{request.sharedItemsCount}</strong> templates will be added to your library
                  </Typography>
                </Box>
              </ListItem>
              {index < requests.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialog.open} 
        onClose={() => setPreviewDialog({ open: false, request: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Preview Shared Content
        </DialogTitle>
        <DialogContent>
          {previewDialog.request && (
            <Box>
              <Typography variant="h6" gutterBottom>
                From: {previewDialog.request.fromTeacherName}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Strategy: {getStrategyLabel(previewDialog.request.strategy)}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Content Types ({previewDialog.request.contentTypes.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {previewDialog.request.contentTypes.map(type => (
                  <Chip key={type} label={type} variant="outlined" />
                ))}
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                Preview of Content:
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {Object.entries(previewDialog.request.content).map(([type, items]) => (
                  <Box key={type} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">
                      {type} ({items.length} items)
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {items.slice(0, 3).map((item, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          {typeof item === 'string' ? item : JSON.stringify(item)}
                        </Typography>
                      ))}
                      {items.length > 3 && (
                        <Typography variant="body2" color="text.secondary">
                          ... and {items.length - 3} more items
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, request: null })}>
            Close
          </Button>
          {previewDialog.request && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => {
                  handleAccept(previewDialog.request.id);
                  setPreviewDialog({ open: false, request: null });
                }}
              >
                Accept
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={() => {
                  handleReject(previewDialog.request.id);
                  setPreviewDialog({ open: false, request: null });
                }}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentSharingRequests;
