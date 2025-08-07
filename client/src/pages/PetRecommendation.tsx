import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import PetRecommendationBot from '../components/PetRecommendationBot';

const PetRecommendation: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Find Your Perfect Pet
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Let our AI assistant help you find the perfect companion
        </Typography>
      </Box>
      
      <PetRecommendationBot />
    </Container>
  );
};

export default PetRecommendation; 