import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  IconButton,
  Typography,
  Alert,
  Grid,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

/**
 * ImageUpload Component
 * A reusable component for uploading, previewing, and managing images
 */
const ImageUpload = ({
  section,
  onUpload,
  onDelete,
  onUpdate,
  existingImages = [],
  multiple = false,
  maxFiles = 5,
  accept = "image/jpeg,image/jpg,image/png,image/webp",
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
  title = "Upload Images",
  description = "Drag and drop images here, or click to select files. Only JPEG, PNG, and WebP images are supported.",
  showMetadata = true,
  compact = false
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fileInputRef = useRef(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [editMetadata, setEditMetadata] = useState({});
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setError('');
    setSuccess('');
    
    if (!multiple && files.length > 1) {
      setError(t('imageUpload.singleFileOnly', 'Please select only one file'));
      return;
    }

    if (files.length > maxFiles) {
      setError(t('imageUpload.tooManyFiles', `Maximum ${maxFiles} files allowed`));
      return;
    }

    // Validate files
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      // Check file type - match the validation used in the service layer
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      // Check both MIME type and file extension for better validation
      const isMimeTypeValid = allowedTypes.includes(file.type);
      const isExtensionValid = allowedExtensions.includes(`.${fileExtension}`);
      
      if (!isMimeTypeValid && !isExtensionValid) {
        errors.push(`${file.name}: ${t('imageUpload.invalidFileType', 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.')}`);
        return;
      }

      // Check file size
      if (file.size > maxSizeBytes) {
        const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
        errors.push(`${file.name}: ${t('imageUpload.fileTooLarge', `File too large (max ${maxSizeMB}MB)`)}`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    setSelectedFiles(validFiles);
    
    // Create preview URLs
    const previews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));
    
    setPreviewImages(previews);
  };

  // Handle drag and drop
  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    
    // Simulate file input change
    const fileInput = fileInputRef.current;
    if (fileInput) {
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      fileInput.files = dt.files;
      
      handleFileSelect({ target: { files: dt.files } });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Upload selected files
  const handleUpload = async () => {
    if (!selectedFiles.length) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        setUploadProgress(prev => ({ ...prev, [index]: 0 }));
        
        const metadata = {
          alt: `${section} image ${index + 1}`,
          caption: '',
          category: section,
          isActive: true
        };

        try {
          // Show progress during upload
          setUploadProgress(prev => ({ ...prev, [index]: 25 }));
          
          const result = await onUpload(section, file, metadata);
          
          setUploadProgress(prev => ({ ...prev, [index]: 100 }));
          return result;
        } catch (uploadError) {
          console.error(`Upload failed for ${file.name}:`, uploadError);
          setUploadProgress(prev => ({ ...prev, [index]: -1 })); // Mark as failed
          
          // Provide specific error messages
          let errorMessage = `Failed to upload ${file.name}`;
          if (uploadError.message.includes('not been set up') || uploadError.message.includes('Get Started')) {
            errorMessage += ': Firebase Storage is not enabled. Please go to Firebase Console > Storage and click "Get Started".';
          } else if (uploadError.message.includes('timeout')) {
            errorMessage += ': Upload timed out. This usually means Firebase Storage rules need to be deployed. Please run "firebase deploy --only storage" and try again.';
          } else if (uploadError.message.includes('permission') || uploadError.message.includes('unauthorized')) {
            errorMessage += ': Permission denied. Please ensure Firebase Storage rules are deployed by running "firebase deploy --only storage".';
          } else if (uploadError.message.includes('Storage')) {
            errorMessage += ': Storage error. Please try again or contact support.';
          } else {
            errorMessage += `: ${uploadError.message}`;
          }
          
          throw new Error(errorMessage);
        }
      });

      const results = await Promise.all(uploadPromises);
      
      setSuccess(t('imageUpload.uploadSuccess', `Successfully uploaded ${results.length} image(s)`));
      setSelectedFiles([]);
      setPreviewImages([]);
      setUploadProgress({});
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload process failed:', error);
      setError(error.message || t('imageUpload.uploadError', 'Upload failed. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  // Clear selected files
  const handleClear = () => {
    setSelectedFiles([]);
    setPreviewImages([]);
    setUploadProgress({});
    setError('');
    setSuccess('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle image editing
  const handleEditImage = (image) => {
    setEditingImage(image);
    setEditMetadata({
      alt: image.metadata?.alt || '',
      caption: image.metadata?.caption || '',
      category: image.metadata?.category || section,
      isActive: image.metadata?.isActive !== false
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;

    try {
      await onUpdate(editingImage.id, {
        metadata: editMetadata
      });
      
      setSuccess(t('imageUpload.updateSuccess', 'Image updated successfully'));
      setEditDialogOpen(false);
      setEditingImage(null);
    } catch (error) {
      setError(error.message || t('imageUpload.updateError', 'Update failed'));
    }
  };

  // Handle image viewing
  const handleViewImage = (image) => {
    setViewingImage(image);
    setViewDialogOpen(true);
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId) => {
    try {
      await onDelete(imageId);
      setSuccess(t('imageUpload.deleteSuccess', 'Image deleted successfully'));
    } catch (error) {
      setError(error.message || t('imageUpload.deleteError', 'Delete failed'));
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Upload Area */}
      <Card
        sx={{
          mb: 3,
          border: '2px dashed',
          borderColor: uploading ? 'primary.main' : 'grey.300',
          backgroundColor: uploading ? 'primary.50' : 'grey.50',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.50'
          }
        }}
      >
        <CardContent
          sx={{
            p: compact ? 2 : 4,
            textAlign: 'center',
            cursor: 'pointer'
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          {uploading ? (
            <Box>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="h6" color="primary">
                {t('imageUpload.uploading', 'Uploading...')}
              </Typography>
            </Box>
          ) : (
            <Box>
              <CloudUploadIcon 
                sx={{ 
                  fontSize: compact ? 48 : 64, 
                  color: 'primary.main',
                  mb: 2 
                }} 
              />
              <Typography variant="h6" gutterBottom>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('imageUpload.maxSize', `Max size: ${Math.round(maxSizeBytes / (1024 * 1024))}MB`)}
                {multiple && ` • ${t('imageUpload.maxFiles', `Max files: ${maxFiles}`)}`}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Preview Selected Files */}
      {previewImages.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('imageUpload.selectedFiles', 'Selected Files')}
          </Typography>
          
          <Grid container spacing={2}>
            {previewImages.map((preview, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardMedia
                    component="img"
                    height="120"
                    image={preview.url}
                    alt={preview.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="caption" noWrap>
                      {preview.name}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {formatFileSize(preview.size)}
                    </Typography>
                    
                    {uploadProgress[index] !== undefined && (
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {uploadProgress[index] === -1 ? (
                          // Failed upload indicator
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                            <CircularProgress
                              variant="determinate"
                              value={100}
                              size={20}
                              sx={{ color: 'error.main' }}
                            />
                            <Typography variant="caption" color="error">
                              Failed
                            </Typography>
                          </Box>
                        ) : (
                          // Normal progress indicator
                          <>
                            <CircularProgress
                              variant="determinate"
                              value={uploadProgress[index]}
                              size={20}
                              color={uploadProgress[index] === 100 ? 'success' : 'primary'}
                            />
                            <Typography variant="caption" sx={{ ml: 1 }}>
                              {uploadProgress[index]}%
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading}
              startIcon={<CloudUploadIcon />}
            >
              {t('imageUpload.upload', 'Upload')}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={uploading}
            >
              {t('common.clear', 'Clear')}
            </Button>
          </Box>
        </Box>
      )}

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {t('imageUpload.existingImages', 'Existing Images')}
          </Typography>
          
          <Grid container spacing={2}>
            {existingImages.map((image) => (
              <Grid item xs={12} sm={6} md={4} key={image.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="160"
                    image={image.url || image.downloadURL}
                    alt={image.metadata?.alt || image.fileName}
                    sx={{ objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => handleViewImage(image)}
                  />
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="caption" noWrap>
                      {image.metadata?.caption || image.fileName}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {formatFileSize(image.size)}
                    </Typography>
                    
                    {showMetadata && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={image.metadata?.category || section}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {!image.metadata?.isActive && (
                          <Chip
                            label={t('common.inactive', 'Inactive')}
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ ml: 0.5 }}
                          />
                        )}
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewImage(image)}
                        aria-label={t('common.view', 'View')}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditImage(image)}
                        aria-label={t('common.edit', 'Edit')}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteImage(image.id)}
                        aria-label={t('common.delete', 'Delete')}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('imageUpload.editImage', 'Edit Image')}
        </DialogTitle>
        <DialogContent>
          {editingImage && (
            <Box>
              <CardMedia
                component="img"
                height="200"
                image={editingImage.url || editingImage.downloadURL}
                alt={editingImage.metadata?.alt}
                sx={{ objectFit: 'cover', mb: 2, borderRadius: 1 }}
              />
              
              <TextField
                fullWidth
                label={t('imageUpload.altText', 'Alt Text')}
                value={editMetadata.alt || ''}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, alt: e.target.value }))}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label={t('imageUpload.caption', 'Caption')}
                value={editMetadata.caption || ''}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, caption: e.target.value }))}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label={t('imageUpload.category', 'Category')}
                value={editMetadata.category || ''}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, category: e.target.value }))}
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSaveEdit} variant="contained">
            {t('common.save', 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.9)' }
        }}
      >
        <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {viewingImage?.metadata?.caption || viewingImage?.fileName}
          </Typography>
          <IconButton
            onClick={() => setViewDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {viewingImage && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={viewingImage.url || viewingImage.downloadURL}
                alt={viewingImage.metadata?.alt}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ImageUpload;