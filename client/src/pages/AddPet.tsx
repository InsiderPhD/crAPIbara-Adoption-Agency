import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from '../components/ImageUpload';

import { API_BASE_URL, API_URL } from '../config/api';

const speciesOptions = [
  { value: 'capybara', label: 'Capybara' },
  { value: 'guinea_pig', label: 'Guinea Pig' },
  { value: 'rock_cavy', label: 'Rock Cavy' },
  { value: 'chinchilla', label: 'Chinchilla' },
];

const sizeOptions = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export default function AddPet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Fetch user profile to get rescueId
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/users/profile`);
      return data.data;
    },
    enabled: !!user,
  });

  // Add pet mutation
  const addPetMutation = useMutation({
    mutationFn: async (petData: any) => {
      const { data } = await axios.post(`${API_URL}/pets`, petData);
      return data;
    },
    onSuccess: () => {
      navigate('/browse');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to add pet');
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const petData = {
      name: formData.get('name'),
      species: formData.get('species'),
      age: parseInt(formData.get('age') as string),
      size: formData.get('size'),
      description: formData.get('description'),
      imageUrl: mainImage,
      gallery: galleryImages,
      rescueId: userProfile?.rescueId,
      internalNotes: formData.get('internalNotes'),
    };

    addPetMutation.mutate(petData);
  };

  if (!user || user.role !== 'rescue') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          You must be logged in as a rescue to add pets.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Add New Pet
        </Typography>

        <Paper sx={{ p: 4, mt: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                required
                name="name"
                label="Pet Name"
                fullWidth
              />

              <TextField
                required
                select
                name="species"
                label="Species"
                fullWidth
              >
                {speciesOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                required
                name="age"
                label="Age"
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
              />

              <TextField
                required
                select
                name="size"
                label="Size"
                fullWidth
              >
                {sizeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                required
                name="description"
                label="Description"
                multiline
                rows={4}
                fullWidth
              />

              <Typography variant="subtitle1" gutterBottom>
                Pet Images
              </Typography>
              <ImageUpload
                onMainImageChange={setMainImage}
                onImagesChange={setGalleryImages}
              />

              <TextField
                name="internalNotes"
                label="Internal Notes"
                multiline
                rows={3}
                fullWidth
                helperText="Private notes for rescue staff only"
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/browse')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={addPetMutation.isPending || !mainImage}
                >
                  {addPetMutation.isPending ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Add Pet'
                  )}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
