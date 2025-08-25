import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Dialog,
  DialogContent,
  IconButton,
  Chip,
  Paper,
  Fade,
  Zoom
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

/**
 * ImageGallery Component
 * A responsive image gallery with lightbox functionality for showcasing developer work
 */
const ImageGallery = ({
  images = [],
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  spacing = 2,
  showCaptions = true,
  showCategories = true,
  aspectRatio = '16:9',
  enableLightbox = true,
  filterByCategory = false,
  categories = [],
  title = null,
  subtitle = null
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Filter images by category
  const filteredImages = filterByCategory && selectedCategory !== 'all' 
    ? images.filter(img => img.metadata?.category === selectedCategory)
    : images;

  // Handle image click for lightbox
  const handleImageClick = (index) => {
    if (enableLightbox) {
      setCurrentImageIndex(index);
      setLightboxOpen(true);
    }
  };

  // Navigate lightbox
  const handlePrevious = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? filteredImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex(prev => 
      prev === filteredImages.length - 1 ? 0 : prev + 1
    );
  };

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (!lightboxOpen) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'Escape':
        setLightboxOpen(false);
        break;
      default:
        break;
    }
  };

  // Add keyboard listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // Calculate aspect ratio
  const getAspectRatio = () => {
    const [width, height] = aspectRatio.split(':').map(Number);
    return (height / width) * 100;
  };

  if (!images.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          {t('gallery.noImages', 'No images to display')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      {(title || subtitle) && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          {title && (
            <Typography variant="h4" gutterBottom>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      {/* Category Filter */}
      {filterByCategory && categories.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Chip
            label={t('gallery.allCategories', 'All')}
            onClick={() => setSelectedCategory('all')}
            color={selectedCategory === 'all' ? 'primary' : 'default'}
            variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
          />
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              onClick={() => setSelectedCategory(category)}
              color={selectedCategory === category ? 'primary' : 'default'}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      )}

      {/* Image Grid */}
      <Grid container spacing={spacing}>
        {filteredImages.map((image, index) => (
          <Grid item {...columns} key={image.id || index}>
            <Fade in timeout={300 + index * 100}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: enableLightbox ? 'pointer' : 'default',
                  transition: 'all 0.3s ease',
                  '&:hover': enableLightbox ? {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                    '& .gallery-overlay': {
                      opacity: 1
                    }
                  } : {}
                }}
                onClick={() => handleImageClick(index)}
              >
                <Box sx={{ position: 'relative', paddingBottom: `${getAspectRatio()}%` }}>
                  <CardMedia
                    component="img"
                    image={image.url}
                    alt={image.metadata?.alt || image.fileName}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  
                  {/* Hover Overlay */}
                  {enableLightbox && (
                    <Box
                      className="gallery-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        color: 'white'
                      }}
                    >
                      <ZoomInIcon sx={{ fontSize: 48 }} />
                    </Box>
                  )}
                </Box>
                
                {/* Caption */}
                {(showCaptions || showCategories) && (
                  <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                    {showCaptions && image.metadata?.caption && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {image.metadata.caption}
                      </Typography>
                    )}
                    
                    {showCategories && image.metadata?.category && (
                      <Chip
                        label={image.metadata.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </CardContent>
                )}
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Lightbox Dialog */}
      {enableLightbox && (
        <Dialog
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          maxWidth={false}
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: 'rgba(0, 0, 0, 0.9)',
              boxShadow: 'none',
              maxHeight: '100vh',
              m: 0
            }
          }}
        >
          <DialogContent
            sx={{
              p: 0,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              bgcolor: 'transparent'
            }}
          >
            {/* Close Button */}
            <IconButton
              onClick={() => setLightboxOpen(false)}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: 'white',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Navigation Buttons */}
            {filteredImages.length > 1 && (
              <>
                <IconButton
                  onClick={handlePrevious}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    color: 'white',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1,
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.7)'
                    }
                  }}
                >
                  <NavigateBeforeIcon />
                </IconButton>
                
                <IconButton
                  onClick={handleNext}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    color: 'white',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1,
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.7)'
                    }
                  }}
                >
                  <NavigateNextIcon />
                </IconButton>
              </>
            )}

            {/* Image */}
            {filteredImages[currentImageIndex] && (
              <Zoom in timeout={300}>
                <Box
                  sx={{
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <img
                    src={filteredImages[currentImageIndex].url}
                    alt={filteredImages[currentImageIndex].metadata?.alt || filteredImages[currentImageIndex].fileName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '80vh',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                  />
                  
                  {/* Image Info */}
                  {filteredImages[currentImageIndex].metadata?.caption && (
                    <Paper
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        maxWidth: '80%'
                      }}
                    >
                      <Typography variant="body1" align="center">
                        {filteredImages[currentImageIndex].metadata.caption}
                      </Typography>
                      {filteredImages[currentImageIndex].metadata?.category && (
                        <Box sx={{ mt: 1, textAlign: 'center' }}>
                          <Chip
                            label={filteredImages[currentImageIndex].metadata.category}
                            size="small"
                            color="primary"
                          />
                        </Box>
                      )}
                    </Paper>
                  )}
                  
                  {/* Image Counter */}
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      color: 'white',
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1
                    }}
                  >
                    {currentImageIndex + 1} / {filteredImages.length}
                  </Typography>
                </Box>
              </Zoom>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default ImageGallery;