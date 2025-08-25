 import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon,
  Dashboard as DashboardIcon,
  Image as ImageIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import ImageUpload from '../common/ImageUpload';
import {
  getDeveloperPageImages,
  deleteDeveloperPageImage,
  updateDeveloperPageImage,
  uploadDeveloperPageImage,
  bulkUploadDeveloperPageImages
} from '../../services/developerPageService';

/**
 * AdminDeveloperImageDashboard Component
 * Admin dashboard for managing all developer page images
 */
const AdminDeveloperImageDashboard = ({ onImagesUpdate }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [images, setImages] = useState({
    profile: [],
    classroom: [],
    projects: [],
    gallery: [],
    all: []
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sections = ['profile', 'classroom', 'projects', 'gallery'];

  // Load all images
  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        
        const [profileImages, classroomImages, projectImages, galleryImages] = await Promise.all([
          getDeveloperPageImages('profile'),
          getDeveloperPageImages('classroom'),
          getDeveloperPageImages('projects'),
          getDeveloperPageImages('gallery')
        ]);
        
        const allImages = [...profileImages, ...classroomImages, ...projectImages, ...galleryImages];
        
        setImages({
          profile: profileImages,
          classroom: classroomImages,
          projects: projectImages,
          gallery: galleryImages,
          all: allImages
        });
        
      } catch (error) {
        setError(error.message || t('admin.loadError', 'Failed to load images'));
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      loadImages();
    }
  }, [isAdmin, t]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedImages([]);
  };

  // Get current images based on selected tab
  const getCurrentImages = () => {
    const sectionMap = ['all', 'profile', 'classroom', 'projects', 'gallery'];
    const section = sectionMap[tabValue];
    return images[section] || [];
  };

  // Handle image selection
  const handleImageSelect = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedImages.length === 0) return;

    try {
      if (bulkAction === 'delete') {
        await Promise.all(selectedImages.map(id => deleteDeveloperPageImage(id)));
        setSuccess(t('admin.bulkDeleteSuccess', `Deleted ${selectedImages.length} images`));
      } else if (bulkAction === 'deactivate') {
        await Promise.all(selectedImages.map(id => 
          updateDeveloperPageImage(id, { 'metadata.isActive': false })
        ));
        setSuccess(t('admin.bulkDeactivateSuccess', `Deactivated ${selectedImages.length} images`));
      }
      
      // Reload images
      window.location.reload();
    } catch (error) {
      setError(error.message || t('admin.bulkActionError', 'Bulk action failed'));
    }
    
    setSelectedImages([]);
    setBulkAction('');
  };

  // Handle single image delete
  const handleDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      await deleteDeveloperPageImage(imageToDelete.id);
      setSuccess(t('admin.deleteSuccess', 'Image deleted successfully'));
      
      // Remove from state
      setImages(prev => {
        const section = imageToDelete.section;
        return {
          ...prev,
          [section]: prev[section].filter(img => img.id !== imageToDelete.id),
          all: prev.all.filter(img => img.id !== imageToDelete.id)
        };
      });
      
      // Notify parent component
      if (onImagesUpdate) {
        onImagesUpdate();
      }
      
    } catch (error) {
      setError(error.message || t('admin.deleteError', 'Failed to delete image'));
    }
    
    setDeleteDialogOpen(false);
    setImageToDelete(null);
  };

  // Handle image upload
  const handleImageUpload = async (section, file, metadata) => {
    try {
      console.log('🔄 Starting upload:', { section, fileName: file.name, fileSize: file.size });
      setError(''); // Clear previous errors
      setSuccess(''); // Clear previous success messages
      
      const result = await uploadDeveloperPageImage(section, file, metadata);
      console.log('✅ Upload successful:', result);
      
      // Add to state
      setImages(prev => ({
        ...prev,
        [section]: [...(prev[section] || []), result],
        all: [...(prev.all || []), result]
      }));
      
      setSuccess(t('admin.uploadSuccess', 'Image uploaded successfully'));
      
      // Notify parent component
      if (onImagesUpdate) {
        onImagesUpdate();
      }
      
      return result; // Return result for ImageUpload component
    } catch (error) {
      console.error('❌ Upload failed:', error);
      const errorMessage = error.message || t('admin.uploadError', 'Failed to upload image');
      setError(errorMessage);
      throw error; // Re-throw so ImageUpload component can handle it
    }
  };

  // Handle image delete from upload component
  const handleImageDelete = async (imageId, section) => {
    try {
      console.log('🗑️ Deleting image:', imageId);
      await deleteDeveloperPageImage(imageId);
      
      // Remove from state
      setImages(prev => ({
        ...prev,
        [section]: (prev[section] || []).filter(img => img.id !== imageId),
        all: (prev.all || []).filter(img => img.id !== imageId)
      }));
      
      setSuccess(t('admin.deleteSuccess', 'Image deleted successfully'));
      
      // Notify parent component
      if (onImagesUpdate) {
        onImagesUpdate();
      }
    } catch (error) {
      console.error('❌ Delete failed:', error);
      setError(error.message || t('admin.deleteError', 'Failed to delete image'));
      throw error; // Re-throw for ImageUpload component
    }
  };

  // Handle image update
  const handleImageUpdate = async (imageId, updates, section) => {
    try {
      await updateDeveloperPageImage(imageId, updates);
      
      // Update state
      setImages(prev => {
        const updateImage = (imgList) => 
          imgList.map(img => img.id === imageId ? { ...img, ...updates } : img);
        
        return {
          ...prev,
          [section]: updateImage(prev[section]),
          all: updateImage(prev.all)
        };
      });
      
      setSuccess(t('admin.updateSuccess', 'Image updated successfully'));
    } catch (error) {
      setError(error.message || t('admin.updateError', 'Failed to update image'));
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

  if (!isAdmin) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          {t('admin.accessDenied', 'Access denied. Admin privileges required.')}
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const currentImages = getCurrentImages();

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          <DashboardIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          {t('admin.imageManagement', 'Developer Page Image Management')}
        </Typography>
        <Typography variant="body1">
          {t('admin.imageManagementDesc', 'Manage all images for the developer page')}
        </Typography>
      </Paper>

      {/* Error/Success Messages */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }} 
          onClose={() => setError('')}
        >
          <Typography variant="body2"><strong>Upload Error:</strong></Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }} 
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {sections.map((section) => (
          <Grid item xs={12} sm={6} md={3} key={section}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ImageIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4">{images[section].length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(`admin.${section}Images`, `${section.charAt(0).toUpperCase() + section.slice(1)} Images`)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable">
          <Tab label={t('admin.allImages', 'All Images')} />
          <Tab label={t('admin.profileImages', 'Profile')} />
          <Tab label={t('admin.classroomImages', 'Classroom')} />
          <Tab label={t('admin.projectImages', 'Projects')} />
          <Tab label={t('admin.galleryImages', 'Gallery')} />
        </Tabs>

        {/* Upload Section - Show for specific tabs only */}
        {tabValue > 0 && (
          <Box sx={{ p: 3, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              <CloudUploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('admin.uploadImages', `Upload ${sections[tabValue - 1]} Images`)}
            </Typography>
            <ImageUpload
              section={sections[tabValue - 1]}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              onUpdate={handleImageUpdate}
              existingImages={images[sections[tabValue - 1]] || []}
              multiple={tabValue !== 1} // Profile allows only 1, others allow multiple
              maxFiles={tabValue === 1 ? 1 : 10}
              title={t('admin.uploadTitle', `Upload ${sections[tabValue - 1]} Images`)}
              description={t('admin.uploadDescription', 'Drag and drop images or click to select files. Only JPEG, PNG, and WebP images are supported.')}
              showMetadata={true}
              compact={false}
            />
          </Box>
        )}

        {/* Bulk Actions */}
        {selectedImages.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography>
              {t('admin.selectedImages', `${selectedImages.length} selected`)}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('admin.bulkAction', 'Action')}</InputLabel>
              <Select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                label={t('admin.bulkAction', 'Action')}
              >
                <MenuItem value="delete">{t('admin.delete', 'Delete')}</MenuItem>
                <MenuItem value="deactivate">{t('admin.deactivate', 'Deactivate')}</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleBulkAction}
              disabled={!bulkAction}
            >
              {t('admin.apply', 'Apply')}
            </Button>
          </Box>
        )}

        {/* Images Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedImages(currentImages.map(img => img.id));
                      } else {
                        setSelectedImages([]);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{t('admin.image', 'Image')}</TableCell>
                <TableCell>{t('admin.filename', 'Filename')}</TableCell>
                <TableCell>{t('admin.section', 'Section')}</TableCell>
                <TableCell>{t('admin.size', 'Size')}</TableCell>
                <TableCell>{t('admin.uploaded', 'Uploaded')}</TableCell>
                <TableCell>{t('admin.status', 'Status')}</TableCell>
                <TableCell>{t('admin.actions', 'Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentImages.map((image) => (
                <TableRow key={image.id}>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedImages.includes(image.id)}
                      onChange={() => handleImageSelect(image.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Avatar
                      src={image.url}
                      alt={image.fileName}
                      variant="rounded"
                      sx={{ width: 60, height: 60 }}
                    />
                  </TableCell>
                  <TableCell>{image.fileName}</TableCell>
                  <TableCell>
                    <Chip label={image.section} size="small" />
                  </TableCell>
                  <TableCell>{formatFileSize(image.size)}</TableCell>
                  <TableCell>
                    {new Date(image.uploadedAt?.toDate?.() || image.uploadedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={image.metadata?.isActive !== false ? t('admin.active', 'Active') : t('admin.inactive', 'Inactive')}
                      color={image.metadata?.isActive !== false ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => window.open(image.url, '_blank')}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => {
                        setImageToDelete(image);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('admin.confirmDelete', 'Confirm Delete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('admin.deleteConfirmMessage', 'Are you sure you want to delete this image? This action cannot be undone.')}
          </Typography>
          {imageToDelete && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Avatar
                src={imageToDelete.url}
                alt={imageToDelete.fileName}
                variant="rounded"
                sx={{ width: 100, height: 100, mx: 'auto' }}
              />
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {imageToDelete.fileName}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleDeleteImage} color="error" variant="contained">
            {t('admin.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDeveloperImageDashboard;