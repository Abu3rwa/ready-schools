import React, { useState } from 'react';
import {
  CONTENT_TYPES
} from '../../constants/contentTypes';
import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Download, Upload } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useEmailContent } from '../../contexts/EmailContentContext';
import EmailContentExportDialog from './EmailContentExportDialog';
import ContentSharingRequests from './ContentSharingRequests';

import emailContentService from '../../services/emailContentService';


const EmailContentManager = () => {
  const { currentUser } = useAuth();
  const { 
    contentLibrary, 
    loading, 
    error, 
    addTemplate, 
    updateTemplate, 
    deleteTemplate, 
    bulkUpdate,
    clearError,
    setError,
    loadContentLibrary
  } = useEmailContent();
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [addDialog, setAddDialog] = useState({ open: false, type: '', content: '', isObject: false });
  const [editDialog, setEditDialog] = useState({ open: false, type: '', index: -1, content: '', isObject: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', index: -1 });
  const [success, setSuccess] = useState(null);
  const [exportDialog, setExportDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleAddTemplate = (contentType) => {
    const isObject = contentType === 'visualThemes' || contentType === 'achievementBadges';
    setAddDialog({ 
      open: true, 
      type: contentType, 
      content: '', 
      isObject: isObject 
    });
  };

  const handleEditTemplate = (contentType, index, content) => {
    const isObject = contentType === 'visualThemes' || contentType === 'achievementBadges';
    setEditDialog({ 
      open: true, 
      type: contentType, 
      index: index, 
      content: isObject ? JSON.stringify(content, null, 2) : content,
      isObject: isObject 
    });
  };

  const handleDeleteTemplate = (contentType, index) => {
    setDeleteDialog({ open: true, type: contentType, index: index });
  };

  const handleBulkImport = async (contentType) => {
    try {
      const content = prompt(`Enter ${contentType} content (JSON format):`);
      if (!content) return;
      
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch (e) {
        setError('Invalid JSON format');
        return;
      }

      const success = await bulkUpdate(contentType, parsedContent);
      if (success) {
        setSuccess(`Bulk import for ${contentType} successful!`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error importing content:', err);
    }
  };

  const handleExportContent = async (targetTeacherId, contentTypes, strategy) => {
    try {
      setError(null);
      await emailContentService.shareContentWithTeacher(
        targetTeacherId, 
        contentTypes, 
        strategy
      );
      
      setExportDialog(false);
      setSuccess('Templates sent successfully! The teacher will receive a request to accept the content.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Share error:', err);
      setError('Failed to share templates: ' + err.message);
    }
  };



  const handleExport = (contentType) => {
    const data = contentLibrary[contentType];
    if (!data || data.length === 0) {
      setError(`No content to export for ${contentType}`);
      return;
    }
    downloadJson(data, `${contentType}.json`);
  };

  const downloadJson = (data, filename) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveTemplate = async () => {
    try {
      const { type, content, isObject } = addDialog;
      if (!content.trim()) {
        setError('Template content cannot be empty');
        return;
      }

      let newContent;
      if (isObject) {
        try {
          newContent = JSON.parse(content);
        } catch (e) {
          setError('Invalid JSON format for object content');
          return;
        }
      } else {
        newContent = content.trim();
      }

      const success = await addTemplate(type, newContent);
      if (success) {
        setAddDialog({ open: false, type: '', content: '', isObject: false });
        setSuccess(`Template added to ${type} successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error adding template:', err);
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      const { type, index, content, isObject } = editDialog;
      if (!content.trim()) {
        setError('Template content cannot be empty');
        return;
      }

      let updatedContent;
      if (isObject) {
        try {
          updatedContent = JSON.parse(content);
        } catch (e) {
          setError('Invalid JSON format for object content');
          return;
        }
      } else {
        updatedContent = content.trim();
      }

      const success = await updateTemplate(type, index, updatedContent);
      if (success) {
        setEditDialog({ open: false, type: '', index: -1, content: '', isObject: false });
        setSuccess(`Template updated successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error updating template:', err);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const { type, index } = deleteDialog;
      const success = await deleteTemplate(type, index);
      
      if (success) {
        setDeleteDialog({ open: false, type: '', index: -1 });
        setSuccess(`Template deleted successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Email Content Templates
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage personalized email content templates for unique, engaging emails.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleTabChange} variant="scrollable">
            {CONTENT_TYPES.map((type, index) => (
              <Tab key={type.value} label={type.label} />
            ))}
            <Tab label="Sharing Requests" />
          </Tabs>
        </Box>

        {CONTENT_TYPES.map((type, index) => (
          <div key={type.value} hidden={selectedTab !== index}>
            {selectedTab === index && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {type.label}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  Templates: {contentLibrary[type.value]?.length || 0}
                </Typography>
                
                {/* Show existing templates */}
                {contentLibrary[type.value] && contentLibrary[type.value].length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Current Templates:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {contentLibrary[type.value].map((template, index) => (
                        <Box key={index} sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1, 
                          p: 1, 
                          border: '1px solid #e0e0e0', 
                          borderRadius: 1,
                          bgcolor: '#fafafa'
                        }}>
                          <Box sx={{ flex: 1 }}>
                            {type.value === 'visualThemes' || type.value === 'achievementBadges' ? (
                              <Typography variant="body2">
                                {template.name || `Theme ${index + 1}`}
                              </Typography>
                            ) : (
                              <Typography variant="body2">
                                {typeof template === 'string' && template.length > 50 
                                  ? template.substring(0, 50) + '...' 
                                  : template}
                              </Typography>
                            )}
                          </Box>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditTemplate(type.value, index, template)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteTemplate(type.value, index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => handleAddTemplate(type.value)}
                  >
                    Add Template
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => handleBulkImport(type.value)}
                  >
                    Bulk Import
                  </Button>
                  {contentLibrary[type.value]?.length === 0 && (
                    <Button 
                      variant="text" 
                      color="primary"
                      onClick={() => handleBulkImport(type.value)}
                    >
                      Initialize with Default Content
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<Download />}
                    onClick={() => setExportDialog(true)}
                    color="primary"
                  >
                    Export Templates
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<Upload />}
                    onClick={() => setImportDialog(true)}
                    color="secondary"
                    disabled
                    title="Import functionality has been replaced with direct teacher sharing"
                  >
                    Import Templates (Deprecated)
                  </Button>
                </Box>
              </Box>
            )}
          </div>
        ))}

        {/* Sharing Requests Tab */}
        <div hidden={selectedTab !== CONTENT_TYPES.length}>
          {selectedTab === CONTENT_TYPES.length && (
            <Box sx={{ p: 3 }}>
              <ContentSharingRequests />
            </Box>
          )}
        </div>
      </Card>

      {/* Add Template Dialog */}
      <Dialog 
        open={addDialog.open} 
        onClose={() => setAddDialog({ open: false, type: '', content: '', isObject: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Add Template - {CONTENT_TYPES.find(t => t.value === addDialog.type)?.label}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={addDialog.isObject ? "Template Content (JSON)" : "Template Content"}
            fullWidth
            multiline
            rows={addDialog.isObject ? 8 : 4}
            value={addDialog.content}
            onChange={(e) => setAddDialog(prev => ({ ...prev, content: e.target.value }))}
            helperText={
              addDialog.isObject 
                ? "Enter JSON format for themes/badges. Example: {\"name\": \"Theme Name\", \"primary\": \"#color\"}"
                : "Enter your template content. Use {firstName}, {studentName}, {schoolName}, {teacherName} as placeholders."
            }
            placeholder={
              addDialog.isObject
                ? '{"name": "Theme Name", "primary": "#1459a9", "secondary": "#ed2024"}'
                : "Example: Hello {firstName}! Here's your amazing progress today! ✨"
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog({ open: false, type: '', content: '', isObject: false })}>
            Cancel
          </Button>
          <Button onClick={handleSaveTemplate} variant="contained">
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, type: '', index: -1, content: '', isObject: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Template - {CONTENT_TYPES.find(t => t.value === editDialog.type)?.label}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={editDialog.isObject ? "Template Content (JSON)" : "Template Content"}
            fullWidth
            multiline
            rows={editDialog.isObject ? 8 : 4}
            value={editDialog.content}
            onChange={(e) => setEditDialog(prev => ({ ...prev, content: e.target.value }))}
            helperText={
              editDialog.isObject 
                ? "Edit JSON format for themes/badges"
                : "Edit your template content. Use {firstName}, {studentName}, {schoolName}, {teacherName} as placeholders."
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, type: '', index: -1, content: '', isObject: false })}>
            Cancel
          </Button>
          <Button onClick={handleUpdateTemplate} variant="contained">
            Update Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, type: '', index: -1 })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Delete Template
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this template? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, type: '', index: -1 })}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <EmailContentExportDialog
        open={exportDialog}
        onClose={() => setExportDialog(false)}
        contentLibrary={contentLibrary}
        currentUser={currentUser}
      />


    </Box>
  );
};

export default EmailContentManager;
