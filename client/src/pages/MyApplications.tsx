import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Snackbar,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

import { API_BASE_URL, API_URL } from '../config/api';

const formatStatus = (status: string | undefined | null) => {
  if (!status) return 'Unknown Status';
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getStatusColor = (status: string | undefined | null) => {
  if (!status) return 'default';
  switch (status) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'under_review':
      return 'info';
    default:
      return 'default';
  }
};

interface FormData {
  applicantName: string;
  adoptionAddress: {
    street: string;
    city: string;
    postcode: string;
  };
  housingStatus: string;
  hasSecureOutdoorSpace: boolean;
  numberOfAdults: number;
  numberOfChildren: number;
  childrenAges: string;
  hasOtherPets: boolean;
  otherPetsDetails: string;
  workHolidayPlans: string;
  animalExperience: string;
  idealAnimalPersonality: string;
  referenceName: string;
  referencePhone: string;
  referenceEmail: string;
  consent: boolean;
  additionalDetails?: string;
}

interface Application {
  id: number;
  petId: string;
  status: string;
  createdAt: string;
  formData: string;
}

interface ParsedApplication extends Omit<Application, 'formData'> {
  formData: FormData;
}

// Add a helper function to parse form data
const parseFormData = (formDataString: string): FormData => {
  try {
    return JSON.parse(formDataString);
  } catch (error) {
    console.error('Error parsing form data:', error);
    return {} as FormData;
  }
};

interface Pet {
  id: string;
  name: string;
  imageUrl: string;
  rescue: {
    name: string;
  };
}

export default function MyApplications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<ParsedApplication | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const { data } = await axios.get(`${API_URL}/applications/my-applications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Applications data:', data.data);
      return data.data;
    },
  });

  // Fetch pet details for each application
  const { data: petsData } = useQuery({
    queryKey: ['pets', applications?.map((app: Application) => app.petId)],
    queryFn: async () => {
      if (!applications?.length) return {};
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const petPromises = applications.map(async (app: Application) => {
        try {
          const { data } = await axios.get(`${API_URL}/pets/${app.petId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          return [app.petId, data.data];
        } catch (error) {
          console.error(`Error fetching pet ${app.petId}:`, error);
          return [app.petId, null];
        }
      });

      const results = await Promise.all(petPromises);
      return Object.fromEntries(results);
    },
    enabled: !!applications?.length,
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, details }: { applicationId: number; details: string }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.patch(
        `${API_URL}/applications/${applicationId}`,
        {
          additionalDetails: details
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      setShowSuccess(true);
      setIsDialogOpen(false);
      setSelectedApplication(null);
      setAdditionalDetails('');
    },
    onError: (error) => {
      console.error('Error updating application:', error);
      // Don't clear the token on error
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Only redirect to login if it's an authentication error
        navigate('/login', { state: { from: '/my-applications' } });
      }
    }
  });

  const handleViewApplication = (application: Application) => {
    console.log('Selected application:', application);
    const parsedFormData = parseFormData(application.formData);
    setSelectedApplication({
      ...application,
      formData: parsedFormData
    });
    setAdditionalDetails(parsedFormData.additionalDetails || '');
    setIsDialogOpen(true);
  };

  const handleUpdateApplication = () => {
    if (selectedApplication) {
      updateApplicationMutation.mutate({
        applicationId: selectedApplication.id,
        details: additionalDetails
      });
    }
  };

  // Check if user is authenticated after all hooks are called
  if (!user) {
    navigate('/login', { state: { from: '/my-applications' } });
    return null;
  }

  // Check if user is a regular user
  if (user.role !== 'user') {
    navigate('/browse');
    return null;
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    console.error('Error in MyApplications component:', error);
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Error loading applications. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back
        </Button>

        <Typography variant="h4" component="h1" gutterBottom>
          My Applications
        </Typography>

        {!applications || applications.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              You haven't submitted any applications yet.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/browse')}
              sx={{ mt: 2 }}
            >
              Browse Available Pets
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {applications.map((application: Application) => {
              const pet = petsData?.[application.petId] as Pet | undefined;
              
              return (
                <Card key={application.id} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                  <CardMedia
                    component="img"
                    sx={{ 
                      width: { xs: '100%', md: 200 },
                      height: { xs: 200, md: 'auto' },
                      objectFit: 'cover'
                    }}
                    image={pet?.imageUrl || '/placeholder-pet.jpg'}
                    alt={pet?.name || 'Pet'}
                  />
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h5" component="h2">
                          {pet?.name || 'Unknown Pet'}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                          {pet?.rescue?.name || 'Unknown Rescue'}
                        </Typography>
                      </Box>
                      <Chip
                        label={formatStatus(application.status)}
                        color={getStatusColor(application.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      Applied on: {new Date(application.createdAt).toLocaleDateString()}
                    </Typography>

                    {application.status === 'pending' && (
                      <Typography variant="body2" color="text.secondary">
                        Your application is being reviewed by the rescue. We'll notify you when there's an update.
                      </Typography>
                    )}

                    {application.status === 'under_review' && (
                      <Typography variant="body2" color="text.secondary">
                        The rescue is currently reviewing your application. This may involve a home check or additional questions.
                      </Typography>
                    )}

                    {application.status === 'approved' && (
                      <Typography variant="body2" color="text.secondary">
                        Congratulations! Your application has been approved. The rescue will contact you to arrange the adoption.
                      </Typography>
                    )}

                    {application.status === 'rejected' && (
                      <Typography variant="body2" color="text.secondary">
                        Unfortunately, your application was not successful this time. You can apply for other pets or try again in the future.
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      {pet?.id && (
                        <Button
                          variant="outlined"
                          onClick={() => navigate(`/pets/${pet.id}`)}
                        >
                          View Pet Details
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        onClick={() => handleViewApplication(application)}
                      >
                        View Application
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>

      {/* Application Details Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                General Information
              </Typography>
              <Typography variant="body1">
                <strong>Applicant Name:</strong> {selectedApplication.formData.applicantName}
              </Typography>
              <Typography variant="body1">
                <strong>Housing Status:</strong> {selectedApplication.formData.housingStatus ? selectedApplication.formData.housingStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Not specified'}
              </Typography>
              <Typography variant="body1">
                <strong>Number of Adults:</strong> {selectedApplication.formData.numberOfAdults}
              </Typography>
              <Typography variant="body1">
                <strong>Number of Children:</strong> {selectedApplication.formData.numberOfChildren}
              </Typography>
              {selectedApplication.formData.numberOfChildren > 0 && (
                <Typography variant="body1">
                  <strong>Children's Ages:</strong> {selectedApplication.formData.childrenAges}
                </Typography>
              )}
              <Typography variant="body1">
                <strong>Has Other Pets:</strong> {selectedApplication.formData.hasOtherPets ? 'Yes' : 'No'}
              </Typography>
              {selectedApplication.formData.hasOtherPets && selectedApplication.formData.otherPetsDetails && (
                <Typography variant="body1">
                  <strong>Other Pets Details:</strong> {selectedApplication.formData.otherPetsDetails}
                </Typography>
              )}
              <Typography variant="body1">
                <strong>Work/Holiday Plans:</strong> {selectedApplication.formData.workHolidayPlans}
              </Typography>
              <Typography variant="body1">
                <strong>Animal Experience:</strong> {selectedApplication.formData.animalExperience}
              </Typography>
              <Typography variant="body1">
                <strong>Ideal Animal Personality:</strong> {selectedApplication.formData.idealAnimalPersonality ? selectedApplication.formData.idealAnimalPersonality.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Not specified'}
              </Typography>

              <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
                Reference Information
              </Typography>
              <Typography variant="body1">
                <strong>Reference Name:</strong> {selectedApplication.formData.referenceName}
              </Typography>
              {selectedApplication.formData.referencePhone && (
                <Typography variant="body1">
                  <strong>Reference Phone:</strong> {selectedApplication.formData.referencePhone}
                </Typography>
              )}
              {selectedApplication.formData.referenceEmail && (
                <Typography variant="body1">
                  <strong>Reference Email:</strong> {selectedApplication.formData.referenceEmail}
                </Typography>
              )}

              <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
                Additional Details
              </Typography>
              {selectedApplication.formData.additionalDetails && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Current Additional Details:
                  </Typography>
                  <Typography variant="body2">
                    {selectedApplication.formData.additionalDetails}
                  </Typography>
                </Paper>
              )}
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Add or update additional details"
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                margin="normal"
                helperText="You can add more information about your living situation, experience, or any other relevant details"
              />

              <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
                Application Status
              </Typography>
              <Chip
                label={formatStatus(selectedApplication.status)}
                color={getStatusColor(selectedApplication.status)}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Applied on: {new Date(selectedApplication.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          <Button 
            onClick={handleUpdateApplication}
            variant="contained"
            disabled={updateApplicationMutation.isPending}
            startIcon={updateApplicationMutation.isPending ? <CircularProgress size={20} /> : null}
          >
            {updateApplicationMutation.isPending ? 'Updating...' : 'Update Application'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        message="Application updated successfully"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
} 