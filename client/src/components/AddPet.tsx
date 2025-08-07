import React, { useState } from 'react';
import { getApiUrl } from '../services/api';import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../services/api';import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../services/api';import axios from 'axios';
import { getApiUrl } from '../services/api';
interface PetFormData {
  name: string;
  species: string;
  age: number;
  size: string;
  description: string;
  internalNotes: string;
  images: File[];
}

const SPECIES_OPTIONS = [
  { value: 'capybara', label: 'Capybara' },
  { value: 'guinea_pig', label: 'Guinea Pig' },
  { value: 'rock_cavy', label: 'Rock Cavy' },
  { value: 'chinchilla', label: 'Chinchilla' }
];

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra_large', label: 'Extra Large' }
];

const AddPet: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    species: '',
    age: 0,
    size: '',
    description: '',
    internalNotes: '',
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Redirect if not a rescue user
  if (!user || user.role !== 'rescue') {
    navigate('/');
    return null;
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'age') {
      const ageValue = parseInt(value);
      setFormData((prev) => ({ ...prev, age: isNaN(ageValue) ? 0 : ageValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: string }>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value as string }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({ ...prev, images: Array.from(e.target.files) }));
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const response = await axios.post('http://localhost:4000/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        uploadedUrls.push(`http://localhost:4000/images/${response.data.filename}`);
      } catch (err) {
        console.error('Error uploading image:', err);
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (formData.name.length < 2) {
      setError('Name must be at least 2 characters');
      setLoading(false);
      return;
    }

    if (!['capybara', 'guinea_pig', 'rock_cavy', 'chinchilla'].includes(formData.species)) {
      setError('Please select a valid species');
      setLoading(false);
      return;
    }

    if (!['small', 'medium', 'large', 'extra_large'].includes(formData.size)) {
      setError('Please select a valid size');
      setLoading(false);
      return;
    }

    if (formData.age < 0 || formData.age > 20) {
      setError('Age must be between 0 and 20');
      setLoading(false);
      return;
    }

    if (formData.description.length < 10) {
      setError('Description must be at least 10 characters');
      setLoading(false);
      return;
    }

    if (formData.internalNotes.length < 20) {
      setError('Internal notes must be at least 20 characters');
      setLoading(false);
      return;
    }

    try {
      // Upload images first
      const imageUrls = await uploadImages(formData.images);

      // Prepare pet data
      const petData = {
        name: formData.name,
        species: formData.species,
        age: Number(formData.age),
        size: formData.size,
        description: formData.description,
        imageUrl: imageUrls[0],
        gallery: imageUrls.slice(1),
        rescueId: user?.id,
        internalNotes: formData.internalNotes,
      };

      // Create pet
      await axios.post(/pets', petData);
      navigate('/browse');
    } catch (err) {
      setError('Failed to add pet. Please try again.');
      console.error('Error adding pet:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.role === 'rescue') {
    navigate('/');
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 4,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Add New Pet
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleTextChange}
            margin="normal"
            required
            error={formData.name.length < 2 && loading}
            helperText={formData.name.length < 2 && loading ? 'Name must be at least 2 characters' : ''}
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Species</InputLabel>
            <Select
              value={formData.species}
              onChange={handleSelectChange}
              name="species"
              label="Species"
              required
              error={!['capybara', 'guinea_pig', 'rock_cavy', 'chinchilla'].includes(formData.species) && loading}
            >
              {SPECIES_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Age"
            name="age"
            value={formData.age}
            onChange={handleTextChange}
            margin="normal"
            required
            inputProps={{
              min: 0,
              max: 20,
              step: 1
            }}
            error={(formData.age < 0 || formData.age > 20) && loading}
            helperText={(formData.age < 0 || formData.age > 20) && loading ? 'Age must be between 0 and 20' : ''}
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Size</InputLabel>
            <Select
              value={formData.size}
              onChange={handleSelectChange}
              name="size"
              label="Size"
              required
              error={!['small', 'medium', 'large', 'extra_large'].includes(formData.size) && loading}
            >
              {SIZE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleTextChange}
            margin="normal"
            required
            error={formData.description.length < 10 && loading}
            helperText={formData.description.length < 10 && loading ? 'Description must be at least 10 characters' : ''}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Internal Notes"
            name="internalNotes"
            value={formData.internalNotes}
            onChange={handleTextChange}
            margin="normal"
            error={formData.internalNotes.length < 20 && loading}
            helperText={formData.internalNotes.length < 20 && loading ? 'Internal notes must be at least 20 characters' : ''}
          />
          <Box sx={{ mt: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="raised-button-file"
              multiple
              type="file"
              onChange={handleImageChange}
            />
            <label htmlFor="raised-button-file">
              <Button
                variant="contained"
                component="span"
                fullWidth
                sx={{ mb: 2 }}
              >
                Upload Pet Images
              </Button>
            </label>
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Pet'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AddPet;
