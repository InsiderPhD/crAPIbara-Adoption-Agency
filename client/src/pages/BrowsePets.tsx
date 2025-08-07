import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  Slider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../config/api';
import type { Pet, PetFilters } from '../hooks/usePets';
import CloseIcon from '@mui/icons-material/Close';
import { Clear, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usePets } from '../hooks/usePets';

interface FilterState extends PetFilters {}

const initialFilters: FilterState = {
  species: [],
  size: [],
  ageRange: [0, 20],
  search: '',
  sortBy: 'dateListed',
  sortOrder: 'desc',
  showAdopted: false,
};

export default function BrowsePets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Ensure searchParams is available
  const safeSearchParams = searchParams || new URLSearchParams();

  // Fetch rescue information if user is a rescue
  const { data: rescueData } = useQuery({
    queryKey: ['rescue', user?.rescueId],
    queryFn: async () => {
      if (!user?.rescueId) return null;
      const { data } = await axios.get(`${API_URL}/rescues/${user.rescueId}`);
      return data.data;
    },
    enabled: !!user?.rescueId,
  });

  // Fetch all rescues if user is admin
  const { data: rescuesData } = useQuery({
    queryKey: ['rescues'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/rescues`);
      return data.data;
    },
    enabled: user?.role === 'admin',
  });

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Initialize filters from URL parameters when searchParams are available
  useEffect(() => {
    if (safeSearchParams && typeof safeSearchParams.get === 'function') {
      const rescueId = safeSearchParams.get('rescueId') || undefined;
      const species = safeSearchParams.get('species')?.split(',') || [];
      const size = safeSearchParams.get('size')?.split(',') || [];
      const sortBy = safeSearchParams.get('sortBy') || 'dateListed';
      const sortOrder = (safeSearchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
      const minAge = parseInt(safeSearchParams.get('minAge') || '0');
      const maxAge = parseInt(safeSearchParams.get('maxAge') || '20');
      const showAdopted = safeSearchParams.get('showAdopted') === 'true';

      setFilters({
        species,
        size,
        ageRange: [minAge, maxAge],
        search: safeSearchParams.get('search') || '',
        sortBy,
        sortOrder,
        rescueId,
        showAdopted: user?.role === 'admin' ? showAdopted : false,
      });
    }
  }, [safeSearchParams, user?.role]);

  // Update URL when filters change (excluding search)
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.rescueId) params.set('rescueId', filters.rescueId);
    if (filters.species.length > 0) params.set('species', filters.species.join(','));
    if (filters.size.length > 0) params.set('size', filters.size.join(','));
    if (filters.sortBy !== 'dateListed') params.set('sortBy', filters.sortBy);
    if (filters.sortOrder !== 'desc') params.set('sortOrder', filters.sortOrder);
    if (filters.ageRange[0] > 0) params.set('minAge', filters.ageRange[0].toString());
    if (filters.ageRange[1] < 20) params.set('maxAge', filters.ageRange[1].toString());
    if (filters.showAdopted) params.set('showAdopted', 'true');
    
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: debouncedSearch
    }));
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error } = usePets(page, 12, filters);
  
  // Get rescue name from the first pet if filtering by rescue
  const rescueName = data?.data[0]?.rescue?.name;

  const handleSpeciesChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFilters(prev => ({
      ...prev,
      species: typeof event.target.value === 'string' 
        ? event.target.value.split(',') 
        : event.target.value,
    }));
    setPage(1);
  };

  const handleSizeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFilters(prev => ({
      ...prev,
      size: typeof event.target.value === 'string' 
        ? event.target.value.split(',') 
        : event.target.value as string[],
    }));
  };

  const handleAgeRangeChange = (_event: Event, newValue: number | number[]) => {
    setFilters(prev => ({
      ...prev,
      ageRange: newValue as [number, number],
    }));
  };

  const handleSortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const [sortBy, sortOrder] = (event.target.value as string).split('-');
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setPage(1);
    setSearchParams({}); // Clear URL parameters
  };

  const handleBackToAllPets = () => {
    setFilters(prev => ({
      ...prev,
      rescueId: undefined
    }));
    setPage(1);
  };

  const formatSpecies = (species: string) => {
    return species.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatSize = (size: string) => {
    return size.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatAge = (age: number) => {
    return `${age} ${age === 1 ? 'year' : 'years'} old`;
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>, imageUrl: string) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Opening image:', imageUrl);
    setSelectedImage(imageUrl);
  };

  const handleCloseImage = () => {
    console.log('Closing image modal');
    setSelectedImage(null);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading pets...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="error">
          Error loading pets. Please try again.
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {user?.role === 'rescue' && rescueData && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              '& .MuiAlert-message': {
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }
            }}
          >
            <Typography>
              You're logged into {rescueData.name}'s rescue account, you will be able to mark pets as adopted, add new pets, and delete pets
            </Typography>
          </Alert>
        )}

        {filters.rescueId && rescueName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBackToAllPets}
              variant="outlined"
              size="small"
            >
            </Button>
            <Typography variant="h4" gutterBottom>
              All Pets at {rescueName}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Filters Sidebar */}
          <Box sx={{ width: { xs: '100%', md: '25%' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Filters
              </Typography>
              <Button
                startIcon={<Clear />}
                onClick={handleClearFilters}
                size="small"
                color="primary"
                variant="outlined"
              >
                Clear All
              </Button>
            </Box>

            {user?.role === 'admin' ? (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Button
                  variant={filters.showAdopted ? "contained" : "outlined"}
                  onClick={() => setFilters(prev => ({ ...prev, showAdopted: !prev.showAdopted }))}
                  fullWidth
                >
                  {filters.showAdopted ? "Hide Adopted Pets" : "Show Adopted Pets"}
                </Button>
              </FormControl>
            ) : user?.role === 'rescue' && filters.rescueId === user.rescueId && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Button
                  variant={filters.showAdopted ? "contained" : "outlined"}
                  onClick={() => setFilters(prev => ({ ...prev, showAdopted: !prev.showAdopted }))}
                  fullWidth
                >
                  {filters.showAdopted ? "Hide Adopted Pets" : "Show Adopted Pets"}
                </Button>
              </FormControl>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Species</InputLabel>
              <Select
                multiple
                value={filters.species}
                onChange={handleSpeciesChange}
                label="Species"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={formatSpecies(value)} />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="capybara">Capybara</MenuItem>
                <MenuItem value="guinea_pig">Guinea Pig</MenuItem>
                <MenuItem value="rock_cavy">Rock Cavy</MenuItem>
                <MenuItem value="chinchilla">Chinchilla</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Size</InputLabel>
              <Select
                multiple
                value={filters.size}
                onChange={handleSizeChange}
                label="Size"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={formatSize(value)} />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
                <MenuItem value="extra_large">Extra Large</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Age Range</Typography>
              <Slider
                value={filters.ageRange}
                onChange={handleAgeRangeChange}
                valueLabelDisplay="auto"
                min={0}
                max={20}
                marks={[
                  { value: 0, label: '0' },
                  { value: 20, label: '20' },
                ]}
              />
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={handleSortChange}
                label="Sort By"
              >
                <MenuItem value="dateListed-desc">Newest First</MenuItem>
                <MenuItem value="dateListed-asc">Oldest First</MenuItem>
                <MenuItem value="age-asc">Age: Youngest First</MenuItem>
                <MenuItem value="age-desc">Age: Oldest First</MenuItem>
                <MenuItem value="name-asc">Name: A-Z</MenuItem>
                <MenuItem value="name-desc">Name: Z-A</MenuItem>
              </Select>
            </FormControl>

            {/* Rescue Filter */}
            {user?.role === 'rescue' && rescueData && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Button
                  variant={filters.rescueId ? "contained" : "outlined"}
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    rescueId: prev.rescueId ? undefined : user.rescueId 
                  }))}
                  fullWidth
                >
                  {filters.rescueId ? "Show All Pets" : "Show Only My Rescue's Pets"}
                </Button>
              </FormControl>
            )}

            {user?.role === 'admin' && rescuesData && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Filter by Rescue</InputLabel>
                <Select
                  value={filters.rescueId || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    rescueId: e.target.value || undefined 
                  }))}
                  label="Filter by Rescue"
                >
                  <MenuItem value="">All Rescues</MenuItem>
                  {rescuesData.map((rescue: any) => (
                    <MenuItem key={rescue.id} value={rescue.id}>
                      {rescue.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          {/* Pet Grid */}
          <Box sx={{ width: { xs: '100%', md: '75%' } }}>
            <TextField
              fullWidth
              label="Search pets"
              value={searchInput}
              onChange={handleSearchChange}
              sx={{ mb: 3 }}
            />

            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
              mb: 4
            }}>
              {data?.data.map((pet: Pet) => (
                <Card 
                  key={pet.id}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    opacity: pet.isAdopted ? 0.4 : 1,
                    position: 'relative',
                    bgcolor: pet.isPromoted ? '#ffebee' : 'background.paper', // Red background for promoted pets
                    border: pet.isPromoted ? '2px solid #f44336' : 'none', // Red border for promoted pets
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.2s ease-in-out',
                    },
                  }}
                  onClick={() => navigate(`/pets/${pet.id}`)}
                >
                  {pet.isAdopted && (
                    <Chip
                      label="Adopted"
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                      }}
                    />
                  )}
                  {pet.isPromoted && (
                    <Chip
                      label="Promoted"
                      color="error"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        zIndex: 1,
                      }}
                    />
                  )}
                  {user?.rescueId === pet.rescueId && !pet.isPromoted && (
                    <Chip
                      label="At your rescue"
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: pet.isPromoted ? 80 : 8,
                        zIndex: 1,
                      }}
                    />
                  )}
                  <CardMedia
                    component="img"
                    height="200"
                    image={pet.imageUrl}
                    alt={pet.name}
                    sx={{ 
                      objectFit: 'cover',
                      '&:hover': {
                        opacity: 0.9,
                      },
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {pet.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {formatSpecies(pet.species)} • {formatSize(pet.size)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatAge(pet.age)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {data?.pagination && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={data.pagination.totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
} 