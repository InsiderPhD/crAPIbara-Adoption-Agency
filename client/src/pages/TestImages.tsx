import React, { useState } from 'react';
import { Container, Typography, Paper } from '@mui/material';
import ImageUpload from '../components/ImageUpload';

const TestImages: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<string | null>(null);

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
    console.log('Images updated:', newImages);
  };

  const handleMainImageChange = (newMainImage: string | null) => {
    setMainImage(newMainImage);
    console.log('Main image updated:', newMainImage);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Image Upload Test
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This page demonstrates the ImageUpload component. You can:
        </Typography>
        <ul>
          <li>Upload multiple images by clicking or dragging</li>
          <li>Set a main image by clicking the star icon</li>
          <li>Delete images using the delete button</li>
        </ul>
        
        <ImageUpload
          onImagesChange={handleImagesChange}
          onMainImageChange={handleMainImageChange}
          initialImages={images}
          initialMainImage={mainImage || undefined}
        />

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          Current State:
        </Typography>
        <Typography variant="body2" component="pre" sx={{ 
          backgroundColor: 'grey.100', 
          p: 2, 
          borderRadius: 1,
          overflow: 'auto'
        }}>
          {JSON.stringify({ images, mainImage }, null, 2)}
        </Typography>
      </Paper>
    </Container>
  );
};

export default TestImages; 