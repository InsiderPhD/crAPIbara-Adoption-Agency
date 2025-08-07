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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Pets as PetsIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Close as CloseIcon,
  ArrowBack,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../config/api';
import type { Pet as PetType } from '../hooks/usePets';
import { usePetsByRescue } from '../hooks/usePetsByRescue';
import { useAuth } from '../contexts/AuthContext';
import PromotionForm from '../components/PromotionForm';

const formatSpecies = (species: string) => {
  return species.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatSize = (size: string) => {
  return size.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatAge = (age: number) => {
  return `${age} ${age === 1 ? 'year' : 'years'} old`;
};

// Extend the imported Pet type to include logoUrl in rescue
interface RescueWithLogo {
  id: string;
  name: string;
  location: string;
  contactEmail: string;
  websiteUrl?: string;
  logoUrl?: string;
}

type PetWithRescueLogo = Omit<PetType, 'rescue'> & { rescue: RescueWithLogo };

export default function PetDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [adoptConfirmOpen, setAdoptConfirmOpen] = useState(false);
  const [promotionFormOpen, setPromotionFormOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Promotion toggle mutation
  const promotionMutation = useMutation({
    mutationFn: async (isPromoted: boolean) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const { data } = await axios.put(`${API_URL}/pets/${id}`, 
        { isPromoted },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    },
    onSuccess: () => {
      // Refetch pet data to update the UI
      queryClient.invalidateQueries({ queryKey: ['pet', id] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
    onError: (error) => {
      console.error('Error toggling promotion:', error);
    }
  });

  const handleTogglePromotion = () => {
    if (pet) {
      promotionMutation.mutate(!pet.isPromoted);
    }
  };

  // Add query for user's applications
  const { data: userApplications } = useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return [];
        const { data } = await axios.get(`${API_URL}/applications/my-applications`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        return data.data;
      } catch (error) {
        console.error('Error fetching user applications:', error);
        return [];
      }
    },
    enabled: !!user
  });

  // Check if user has an application for this pet
  const hasApplication = React.useMemo(() => {
    if (!userApplications || !id) return false;
    return userApplications.some((app: any) => app.petId === id);
  }, [userApplications, id]);

  // Add this function to check if user can view internal notes
  const canViewInternalNotes = () => {
    if (!user || !pet) {
      return false;
    }
    return user.role === 'admin' || (user.role === 'rescue' && user.rescueId === pet.rescueId);
  };

  const { data: pet, isLoading, error } = useQuery<PetWithRescueLogo>({
    queryKey: ['pet', id],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_URL}/pets/${id}`);
        return data.data as PetWithRescueLogo;
      } catch (error) {
        console.error('Error fetching pet:', error);
        throw error;
      }
    },
  });

  // Get applications count
  const { data: applicationsData } = useQuery({
    queryKey: ['applications', id],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_URL}/applications/pet/${id}`);
        return data.data;
      } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
      }
    },
    enabled: canViewInternalNotes(),
  });

  // Get other pets from the same rescue
  const { data: otherPetsData } = usePetsByRescue(pet?.rescueId || '', 3);

  // Get all images including main image and gallery
  const allImages = React.useMemo(() => {
    if (!pet) return [];
    const gallery = pet.gallery ? JSON.parse(pet.gallery) : [];
    return [pet.imageUrl, ...gallery];
  }, [pet]);

  // Set initial main image when pet data loads
  React.useEffect(() => {
    if (pet) {
      setMainImage(pet.imageUrl);
      setCurrentImageIndex(0);
    }
  }, [pet]);

  const handleGalleryImageClick = (event: React.MouseEvent<HTMLImageElement>, imageUrl: string) => {
    event.preventDefault();
    event.stopPropagation();
    setMainImage(imageUrl);
    setCurrentImageIndex(allImages.indexOf(imageUrl));
  };

  const handleMainImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (mainImage) {
      setSelectedImage(mainImage);
    }
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const handlePreviousImage = (event: React.MouseEvent) => {
    event.stopPropagation();
    const newIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
    setCurrentImageIndex(newIndex);
    setMainImage(allImages[newIndex]);
  };

  const handleNextImage = (event: React.MouseEvent) => {
    event.stopPropagation();
    const newIndex = (currentImageIndex + 1) % allImages.length;
    setCurrentImageIndex(newIndex);
    setMainImage(allImages[newIndex]);
  };

  const handleDeletePet = async () => {
    try {
      await axios.delete(`${API_URL}/pets/${id}`);
      navigate('/browse');
    } catch (error) {
      console.error('Error deleting pet:', error);
    }
  };

  const handleMarkAsAdopted = async () => {
    try {
      await axios.put(`${API_URL}/pets/${id}`, {
        isAdopted: true
      });
      // Refetch pet data to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error marking pet as adopted:', error);
    }
  };

  const handleMarkAsAvailable = async () => {
    try {
      await axios.put(`${API_URL}/pets/${id}`, {
        isAdopted: false
      });
      // Refetch pet data to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error marking pet as available:', error);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading pet details...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back to Browse
        </Button>
        <Typography color="error">
          Error loading pet details. Please try again.
        </Typography>
      </Container>
    );
  }

  if (!pet) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back to Browse
        </Button>
        <Typography color="error">
          Pet not found. Please check the URL and try again.
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back to Browse
        </Button>

        {user?.rescueId === pet.rescueId && (
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
              {pet.name} is at your rescue {pet.rescue.name}
            </Typography>
          </Alert>
        )}

        {/* Add Rescue Actions */}
        {(user?.rescueId === pet.rescueId || user?.role === 'admin') && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color={pet.isAdopted ? "success" : "primary"}
              onClick={() => pet.isAdopted ? setAdoptConfirmOpen(true) : setAdoptConfirmOpen(true)}
            >
              {pet.isAdopted ? "Mark as Available" : "Mark as Adopted"}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate(`/pets/${id}/applications`)}
            >
              View Applications
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate(`/pets/${id}/edit`)}
            >
              Edit Pet
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete Pet
            </Button>
          </Box>
        )}

        {/* Admin Promotion Toggle */}
        {user?.role === 'admin' && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color={pet.isPromoted ? "warning" : "success"}
              onClick={handleTogglePromotion}
              disabled={promotionMutation.isPending}
            >
              {promotionMutation.isPending ? "Updating..." : 
                pet.isPromoted ? "Remove Promotion" : "Promote Pet"
              }
            </Button>
            {pet.isPromoted && (
              <Chip
                label="Promoted"
                color="error"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
        )}

        {/* Rescue Promotion Banner */}
        {user?.rescueId === pet.rescueId && !pet.isPromoted && !pet.isAdopted && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              '& .MuiAlert-message': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
              }
            }}
          >
            <Typography>
              Promote {pet.name} for only $5 to get more visibility!
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setPromotionFormOpen(true)}
              sx={{ ml: 2 }}
            >
              Promote Now
            </Button>
          </Alert>
        )}

        {pet.isAdopted && (
          <Alert 
            severity="warning" 
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
              Sorry, {pet.name} has already found their forever home!
            </Typography>
          </Alert>
        )}

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4
        }}>
          {/* Pet Images */}
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <Card sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                image={mainImage || pet.imageUrl}
                alt={pet.name}
                onClick={handleMainImageClick}
                sx={{ 
                  height: 400, 
                  objectFit: 'cover',
                  cursor: 'zoom-in',
                  transition: 'opacity 0.2s ease-in-out',
                  '&:hover': {
                    opacity: 0.9,
                  },
                }}
              />
              {/* Navigation Buttons */}
              <IconButton
                onClick={handlePreviousImage}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                  },
                  zIndex: 1,
                }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                onClick={handleNextImage}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                  },
                  zIndex: 1,
                }}
              >
                <ChevronRight />
              </IconButton>
            </Card>
            <Box 
              sx={{ 
                mt: 2, 
                display: 'flex', 
                gap: 1, 
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '4px',
                  '&:hover': {
                    background: '#555',
                  },
                },
                pb: 1,
              }}
            >
              {/* Add main image to gallery */}
              <Card 
                sx={{ 
                  minWidth: 100, 
                  height: 100,
                  cursor: 'pointer',
                  border: mainImage === pet.imageUrl ? '2px solid #1976d2' : 'none',
                  transition: 'opacity 0.2s ease-in-out',
                  '&:hover': {
                    opacity: 0.9,
                  },
                }}
              >
                <CardMedia
                  component="img"
                  image={pet.imageUrl}
                  alt={`${pet.name} main`}
                  onClick={(e) => handleGalleryImageClick(e as React.MouseEvent<HTMLImageElement>, pet.imageUrl)}
                  sx={{ height: '100%', objectFit: 'cover' }}
                />
              </Card>
              {/* Gallery images */}
              {pet.gallery && (() => {
                try {
                  const gallery = JSON.parse(pet.gallery);
                  return Array.isArray(gallery) ? gallery.map((image: string, index: number) => (
                    <Card 
                      key={index} 
                      sx={{ 
                        minWidth: 100, 
                        height: 100,
                        cursor: 'pointer',
                        border: mainImage === image ? '2px solid #1976d2' : 'none',
                        transition: 'opacity 0.2s ease-in-out',
                        '&:hover': {
                          opacity: 0.9,
                        },
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={image}
                        alt={`${pet.name} gallery ${index + 1}`}
                        onClick={(e) => handleGalleryImageClick(e as React.MouseEvent<HTMLImageElement>, image)}
                        sx={{ height: '100%', objectFit: 'cover' }}
                      />
                    </Card>
                  )) : null;
                } catch (error) {
                  console.error('Error parsing gallery:', error);
                  return null;
                }
              })()}
            </Box>
          </Box>

          {/* Pet Details */}
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                {pet.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Reference: {pet.referenceNumber}
              </Typography>

              <Box sx={{ my: 2 }}>
                <Chip 
                  label={formatSpecies(pet.species)} 
                  color="primary" 
                  sx={{ mr: 1 }} 
                />
                <Chip 
                  label={formatSize(pet.size)} 
                  color="secondary" 
                  sx={{ mr: 1 }} 
                />
                <Chip 
                  label={formatAge(pet.age)} 
                  variant="outlined" 
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                About {pet.name}
              </Typography>
              <Typography paragraph>
                {pet.description}
              </Typography>

              {canViewInternalNotes() && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom color="primary">
                    Internal Notes
                  </Typography>
                  <Typography 
                    paragraph 
                    sx={{ 
                      fontStyle: 'italic',
                      color: 'text.secondary',
                      bgcolor: 'action.hover',
                      p: 2,
                      borderRadius: 1
                    }}
                  >
                    {pet.internalNotes || 'No internal notes available.'}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      bgcolor: 'action.hover',
                      p: 2,
                      borderRadius: 1,
                      mt: 1
                    }}
                  >
                    {pet.name} has {applicationsData?.length || 0} application{applicationsData?.length !== 1 ? 's' : ''}
                  </Typography>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mt: 4, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>Rescue Information</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {pet.rescue.logoUrl && (
                    <Box sx={{ minWidth: 80, mr: 2, display: 'flex', justifyContent: 'center' }}>
                      <img
                        src={pet.rescue.logoUrl}
                        alt={pet.rescue.name + ' logo'}
                        style={{ maxWidth: 80, maxHeight: 80, borderRadius: 8, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      />
                    </Box>
                  )}
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>{pet.rescue.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{pet.rescue.location}</Typography>
                    {pet.rescue.websiteUrl && (
                      <Typography variant="body2">
                        <a href={pet.rescue.websiteUrl} target="_blank" rel="noopener noreferrer">
                          {pet.rescue.websiteUrl.replace(/^https?:\/\//, '')}
                        </a>
                      </Typography>
                    )}
                    <Typography variant="body2">Contact: {pet.rescue.contactEmail}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Apply for Pet Button */}
              {!pet.isAdopted && user?.role === 'user' && !hasApplication && user?.rescueId !== pet.rescueId && (
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => navigate(`/pets/${id}/apply`)}
                    sx={{ py: 1.5, px: 4 }}
                  >
                    Apply to Adopt {pet.name}
                  </Button>
                </Box>
              )}
              {user?.role === 'user' && hasApplication && (
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Alert severity="info" sx={{ width: '100%', maxWidth: 600 }}>
                    You have already submitted an application for {pet.name}. You can view the status of your application in your My Applications page.
                  </Alert>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      // TODO: Implement withdraw application logic
                      console.log('Withdraw application clicked');
                    }}
                  >
                    Withdraw Application
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>

        {/* Other Pets Section */}
        {pet && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" gutterBottom>
              Other pets at {pet.rescue.name}
            </Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 3,
              mt: 2
            }}>
              {otherPetsData?.data
                .filter((otherPet: PetWithRescueLogo) => otherPet.id !== pet.id)
                .map((otherPet: PetWithRescueLogo) => (
                  <Card 
                    key={otherPet.id}
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        transition: 'transform 0.2s ease-in-out',
                      },
                    }}
                    onClick={() => navigate(`/pets/${otherPet.id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={otherPet.imageUrl}
                      alt={otherPet.name}
                      sx={{ 
                        objectFit: 'cover',
                        '&:hover': {
                          opacity: 0.9,
                        },
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {otherPet.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {formatSpecies(otherPet.species)} • {formatSize(otherPet.size)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatAge(otherPet.age)}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              
              {/* View All Card */}
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-4px)',
                    transition: 'all 0.2s ease-in-out',
                  },
                }}
                onClick={() => navigate(`/browse?rescueId=${pet.rescueId}`)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    View All Pets at {pet.rescue.name}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}
      </Container>

      {/* Image Zoom Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={handleCloseImage}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden',
            maxHeight: '100vh',
          },
        }}
      >
        <DialogContent 
          sx={{ 
            p: 0, 
            position: 'relative',
            overflow: 'hidden',
            '&.MuiDialogContent-root': {
              padding: 0,
            },
          }}
        >
          <IconButton
            onClick={handleCloseImage}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Zoomed view"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '90vh',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Pet</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {pet.name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeletePet} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mark as Adopted/Available Confirmation Dialog */}
      <Dialog
        open={adoptConfirmOpen}
        onClose={() => setAdoptConfirmOpen(false)}
      >
        <DialogTitle>{pet.isAdopted ? "Mark as Available" : "Mark as Adopted"}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark {pet.name} as {pet.isAdopted ? "available" : "adopted"}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdoptConfirmOpen(false)}>Cancel</Button>
          <Button 
            onClick={pet.isAdopted ? handleMarkAsAvailable : handleMarkAsAdopted} 
            color={pet.isAdopted ? "success" : "primary"} 
            variant="contained"
          >
            {pet.isAdopted ? "Mark as Available" : "Mark as Adopted"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Promotion Form Dialog */}
      <PromotionForm
        open={promotionFormOpen}
        onClose={() => setPromotionFormOpen(false)}
        petId={id || ''}
        petName={pet?.name || ''}
      />
    </Box>
  );
}