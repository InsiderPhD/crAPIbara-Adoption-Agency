import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from '../components/ImageUpload';

import { API_BASE_URL, API_URL } from '../config/api';
const IMAGE_BASE_URL = 'http://localhost:4000';

interface PetFormData {
  name: string;
  species: string;
  size: string;
  age: number;
  description: string;
  internalNotes: string;
}

const initialFormData: PetFormData = {
  name: '',
  species: '',
  size: '',
  age: 0,
  description: '',
  internalNotes: '',
};

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
  { value: 'extra_large', label: 'Extra Large' },
];

export default function EditPet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<PetFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: pet, isLoading: queryLoading } = useQuery({
    queryKey: ['pet', id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/pets/${id}`);
      return data.data;
    },
  });

  useEffect(() => {
    if (pet) {
      // Handle gallery data
      let galleryData: string[] = [];
      if (pet.gallery) {
        try {
          // If it's already a string, parse it to ensure it's valid JSON
          galleryData = typeof pet.gallery === 'string' ? JSON.parse(pet.gallery) : pet.gallery;
          // Ensure all gallery URLs have the proper base URL
          galleryData = galleryData.map(url => 
            url.startsWith('http') ? url : `${IMAGE_BASE_URL}${url}`
          );
        } catch (e) {
          console.error('Error parsing gallery:', e);
          galleryData = [];
        }
      }

      setFormData({
        name: pet.name,
        species: pet.species,
        size: pet.size,
        age: pet.age,
        description: pet.description,
        internalNotes: pet.internalNotes || '',
      });

      // Ensure main image URL has the proper base URL
      setMainImage(pet.imageUrl.startsWith('http') ? pet.imageUrl : `${IMAGE_BASE_URL}${pet.imageUrl}`);
      setGalleryImages(galleryData);
    }
  }, [pet]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: unknown } }
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formattedData = {
        name: formData.name,
        species: formData.species,
        size: formData.size,
        age: Number(formData.age),
        description: formData.description,
        internalNotes: formData.internalNotes || null,
        imageUrl: mainImage,
        gallery: galleryImages,
        rescueId: pet.rescueId,
        isAdopted: pet.isAdopted,
      };

      await axios.put(`${API_URL}/pets/${id}`, formattedData);
      navigate(`/pets/${id}`);
    } catch (error: any) {
      console.error('Error updating pet:', error);
      setError(error.response?.data?.message || 'Failed to update pet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (queryLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!pet) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="error">Pet not found</Typography>
      </Container>
    );
  }

  if (user?.rescueId !== pet.rescueId && user?.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="error">You don't have permission to edit this pet</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/pets/${id}`)}
          sx={{ mb: 3 }}
        >
          Back to Pet Details
        </Button>

        <Typography variant="h4" gutterBottom>
          Edit {pet.name}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                fullWidth
              />

              <FormControl fullWidth required>
                <InputLabel>Species</InputLabel>
                <Select
                  name="species"
                  value={formData.species}
                  onChange={handleChange}
                  label="Species"
                >
                  {speciesOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Size</InputLabel>
                <Select
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  label="Size"
                >
                  {sizeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ min: 0, max: 20 }}
              />

              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                fullWidth
                multiline
                rows={4}
              />

              <Typography variant="subtitle1" gutterBottom>
                Pet Images
              </Typography>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ImageUpload
                  onMainImageChange={setMainImage}
                  onImagesChange={setGalleryImages}
                  initialMainImage={mainImage}
                  initialImages={galleryImages}
                />
              )}

              <TextField
                label="Internal Notes"
                name="internalNotes"
                value={formData.internalNotes}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/pets/${id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || !mainImage}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Save Changes'
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