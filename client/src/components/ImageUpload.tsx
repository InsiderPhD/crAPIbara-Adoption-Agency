import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  styled,
} from '@mui/material';
import { Delete as DeleteIcon, Star as StarIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

interface ImageUploadProps {
  onImagesChange?: (images: string[]) => void;
  onMainImageChange?: (mainImage: string | null) => void;
  initialImages?: string[];
  initialMainImage?: string | null;
}

interface ImageFile {
  url: string;
  name: string;
}

const UploadArea = styled(Paper)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  marginBottom: theme.spacing(3),
  transition: 'background-color 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const GalleryContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
}));

const GalleryItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: 150,
}));

const ImageContainer = styled(Box)<{ isMain?: boolean }>(({ theme, isMain }) => ({
  position: 'relative',
  width: 120,
  height: 120,
  border: `2px solid ${isMain ? theme.palette.error.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  '&:hover .overlay': {
    opacity: 1,
  },
}));

const Overlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  opacity: 0,
  transition: 'opacity 0.3s ease',
}));

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChange,
  onMainImageChange,
  initialImages = [],
  initialMainImage = null,
}) => {
  const [mainImage, setMainImageState] = useState<ImageFile | null>(null);
  const [galleryImages, setGalleryImages] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize images when props change
  useEffect(() => {
    if (!isInitialized && (initialMainImage || initialImages.length > 0)) {
      setMainImageState(
        initialMainImage ? {
          url: initialMainImage.startsWith('http') ? initialMainImage : `${API_BASE_URL}${initialMainImage}`,
          name: initialMainImage.split('/').pop() || '',
        } : null
      );

      setGalleryImages(
        initialImages
          .filter(url => url !== initialMainImage)
          .map(url => ({
            url: url.startsWith('http') ? url : `${API_BASE_URL}${url}`,
            name: url.split('/').pop() || '',
          }))
      );
      setIsInitialized(true);
    }
  }, [initialMainImage, initialImages, isInitialized]);

  const handleFiles = useCallback(async (files: FileList) => {
    const newImages: ImageFile[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload only image files.');
        continue;
      }

      // Check for duplicates
      if (galleryImages.some(img => img.name === file.name) || 
          (mainImage && mainImage.name === file.name)) {
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const imageUrl = `${API_BASE_URL}${response.data.url}`;
        newImages.push({
          url: imageUrl,
          name: file.name,
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image. Please try again.');
      }
    }

    if (newImages.length > 0) {
      // If there's no main image, set the first new image as main
      if (!mainImage && newImages.length > 0) {
        const [firstImage, ...remainingImages] = newImages;
        setMainImageState(firstImage);
        setGalleryImages([...galleryImages, ...remainingImages]);
        onMainImageChange?.(firstImage.url);
        onImagesChange?.([...galleryImages.map(img => img.url), ...remainingImages.map(img => img.url)]);
      } else {
        const updatedImages = [...galleryImages, ...newImages];
        setGalleryImages(updatedImages);
        onImagesChange?.(updatedImages.map(img => img.url));
      }
    }
  }, [galleryImages, mainImage, onMainImageChange, onImagesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleSetMainImage = useCallback((index: number) => {
    const selectedImage = galleryImages[index];
    const updatedGalleryImages = galleryImages.filter((_, i) => i !== index);
    
    // If there was a previous main image, add it back to the gallery
    if (mainImage) {
      updatedGalleryImages.push(mainImage);
    }
    
    setMainImageState(selectedImage);
    setGalleryImages(updatedGalleryImages);
    
    onMainImageChange?.(selectedImage.url);
    onImagesChange?.(updatedGalleryImages.map(img => img.url));
  }, [galleryImages, mainImage, onMainImageChange, onImagesChange]);

  const deleteImage = useCallback((index: number) => {
    const updatedImages = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(updatedImages);
    onImagesChange?.(updatedImages.map(img => img.url));
  }, [galleryImages, onImagesChange]);

  const deleteMainImage = useCallback(() => {
    if (mainImage) {
      // If there are other images in the gallery, move the main image there
      if (galleryImages.length > 0) {
        setGalleryImages([...galleryImages, mainImage]);
        setMainImageState(null);
        onMainImageChange?.(null);
        onImagesChange?.([...galleryImages.map(img => img.url), mainImage.url]);
      } else {
        // If this was the last image, clear all states
        setMainImageState(null);
        onMainImageChange?.(null);
        onImagesChange?.([]);
      }
    }
  }, [galleryImages, mainImage, onMainImageChange, onImagesChange]);

  return (
    <Box>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        style={{ display: 'none' }}
        id="file-input"
      />
      <label htmlFor="file-input">
        <UploadArea
          sx={{ 
            backgroundColor: (!mainImage && galleryImages.length === 0) 
              ? 'var(--mui-palette-Alert-errorStandardBg, rgb(253, 237, 237))' 
              : 'background.paper',
            '&:hover': {
              backgroundColor: (!mainImage && galleryImages.length === 0) 
                ? 'var(--mui-palette-Alert-errorStandardBg, rgb(253, 237, 237))' 
                : 'action.hover',
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Typography color={(!mainImage && galleryImages.length === 0) ? 'error.main' : 'textSecondary'}>
            {(!mainImage && galleryImages.length === 0) 
              ? 'No images available. Click or drag to upload an image'
              : 'Upload an image or drag an image to this box'}
          </Typography>
        </UploadArea>
      </label>

      <GalleryContainer>
        {mainImage && (
          <GalleryItem>
            <ImageContainer isMain={true}>
              <img
                src={mainImage.url}
                alt={mainImage.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'cover',
                }}
              />
            </ImageContainer>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={deleteMainImage}
              sx={{ width: '100%' }}
            >
              Remove Main
            </Button>
          </GalleryItem>
        )}
        {galleryImages.map((image, index) => (
          <GalleryItem key={image.url}>
            <ImageContainer>
              <img
                src={image.url}
                alt={image.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'cover',
                }}
              />
              <Overlay className="overlay">
                <IconButton
                  color="primary"
                  onClick={() => handleSetMainImage(index)}
                  sx={{ backgroundColor: 'white' }}
                >
                  <StarIcon />
                </IconButton>
              </Overlay>
            </ImageContainer>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => deleteImage(index)}
              sx={{ width: '100%' }}
            >
              Delete
            </Button>
          </GalleryItem>
        ))}
      </GalleryContainer>
    </Box>
  );
};

export default ImageUpload; 