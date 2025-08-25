import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Alert, LinearProgress,
  RadioGroup, FormControlLabel, Radio,
  Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, Chip
} from '@mui/material';
import { ExpandMore, CloudUpload } from '@mui/icons-material';

const EmailContentImportDialog = ({ open, onClose, onImport }) => {
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [importStrategy, setImportStrategy] = useState('merge');
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportFile(file);
    setIsValidating(true);
    setValidationErrors([]);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const errors = validateImportData(data);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setImportData(null);
      } else {
        setImportData(data);
      }
    } catch (error) {
      setValidationErrors(['Invalid JSON file format']);
      setImportData(null);
    } finally {
      setIsValidating(false);
    }
  };

  const validateImportData = (data) => {
    const errors = [];
    if (!data.content) {
      errors.push('Missing content section in import file');
    }
    if (!data.metadata) {
      errors.push('Missing metadata section in import file');
    }
    return errors;
  };

  const handleImport = async () => {
    if (!importData) return;
    
    setIsImporting(true);
    try {
      await onImport(importData, importStrategy);
    } finally {
      setIsImporting(false);
    }
  };

  const getImportPreview = () => {
    if (!importData?.content) return null;
    
    return Object.entries(importData.content).map(([type, items]) => ({
      type,
      count: Array.isArray(items) ? items.length : 0,
      items: Array.isArray(items) ? items.slice(0, 3) : []
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Email Content Templates</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          Import email content templates from another teacher to enhance your library.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="import-file-input"
          />
          <label htmlFor="import-file-input">
            <Button
              component="span"
              variant="outlined"
              startIcon={<CloudUpload />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Choose Import File (.json)
            </Button>
          </label>
          {importFile && (
            <Typography variant="body2" color="text.secondary">
              Selected: {importFile.name}
            </Typography>
          )}
        </Box>

        {isValidating && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>Validating import file...</Typography>
            <LinearProgress />
          </Box>
        )}

        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>Import validation failed:</Typography>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {importData && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Import Preview</Typography>
            
            {importData.metadata && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Source Information</Typography>
                <Typography variant="body2">
                  Export Date: {importData.metadata.exportDate ? new Date(importData.metadata.exportDate).toLocaleDateString() : 'Unknown'}
                </Typography>
              </Box>
            )}

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Content Types ({getImportPreview()?.length || 0})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {getImportPreview()?.map(({ type, count, items }) => (
                    <ListItem key={type}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{type}</Typography>
                            <Chip label={`${count} items`} size="small" />
                          </Box>
                        }
                        secondary={
                          items.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Preview: {items[0]?.name || items[0] || 'Complex object'}
                              {items.length > 1 && `, ${items[1]?.name || items[1] || 'Complex object'}`}
                              {count > 2 && `, +${count - 2} more...`}
                            </Typography>
                          )
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Import Strategy</Typography>
              <RadioGroup
                value={importStrategy}
                onChange={(e) => setImportStrategy(e.target.value)}
              >
                <FormControlLabel
                  value="merge"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2">Merge with existing content</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Add new templates and keep existing ones. Duplicates will be added as separate items.
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
                        Only add templates that don't already exist (based on exact text match).
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="replace"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" color="error.main">Replace all existing content</Typography>
                      <Typography variant="caption" color="error.main">
                        ⚠️ This will completely replace your current templates with the imported ones.
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!importData || isImporting}
        >
          {isImporting ? 'Importing...' : 'Import Templates'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailContentImportDialog;