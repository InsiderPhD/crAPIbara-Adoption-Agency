import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

import { API_BASE_URL, API_URL } from '../config/api';

interface Application {
  id: string;
  petId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'unsuccessful';
  formData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    experience: string;
    homeType: string;
    otherPets: string;
    children: string;
    workHours: string;
    additionalInfo: string;
  };
  createdAt: string;
  pet: {
    name: string;
    species: string;
    rescueId: string;
    rescue: {
      name: string;
    };
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`application-tabpanel-${index}`}
      aria-labelledby={`application-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AllApplications() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'pending' | 'accepted' | 'unsuccessful'>('pending');
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data } = await api.get('/applications');
      return data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/applications/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setStatusDialogOpen(false);
      setSelectedApplication(null);
      setNewStatus('pending');
    },
    onError: (error) => {
      console.error('Error updating application status:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setDeleteDialogOpen(false);
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStatusChange = (application: Application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setStatusDialogOpen(true);
  };

  const handleDelete = (application: Application) => {
    setSelectedApplication(application);
    setDeleteDialogOpen(true);
  };

  const handleView = (application: Application) => {
    setSelectedApplication(application);
    setViewDialogOpen(true);
  };

  const filteredApplications = applications?.filter((app: Application) => {
    // Filter by rescue if user is not admin
    if (user?.role !== 'admin' && app.pet.rescueId !== user?.rescueId) {
      return false;
    }

    // Filter by status based on selected tab
    switch (tabValue) {
      case 0:
        return app.status === 'pending';
      case 1:
        return app.status === 'accepted';
      case 2:
        return app.status === 'unsuccessful';
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          All Applications
        </Typography>

        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="application status tabs"
          >
            <Tab label="Pending" />
            <Tab label="Accepted" />
            <Tab label="Unsuccessful" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pet Name</TableCell>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Rescue</TableCell>
                    <TableCell>Applied Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApplications?.map((application: Application) => (
                    <TableRow key={application.id}>
                      <TableCell>{application.pet.name}</TableCell>
                      <TableCell>
                        {application.user.firstName} {application.user.lastName}
                        <br />
                        <Typography variant="caption" color="textSecondary">
                          {application.user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{application.pet.rescue.name}</TableCell>
                      <TableCell>
                        {new Date(application.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleView(application)}
                          sx={{ mr: 1 }}
                          startIcon={<VisibilityIcon />}
                        >
                          View
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleStatusChange(application)}
                          sx={{ mr: 1 }}
                        >
                          Update Status
                        </Button>
                        {user?.role === 'admin' && (
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(application)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pet Name</TableCell>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Rescue</TableCell>
                    <TableCell>Applied Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApplications?.map((application: Application) => (
                    <TableRow key={application.id}>
                      <TableCell>{application.pet.name}</TableCell>
                      <TableCell>
                        {application.user.firstName} {application.user.lastName}
                        <br />
                        <Typography variant="caption" color="textSecondary">
                          {application.user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{application.pet.rescue.name}</TableCell>
                      <TableCell>
                        {new Date(application.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleView(application)}
                          sx={{ mr: 1 }}
                          startIcon={<VisibilityIcon />}
                        >
                          View
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleStatusChange(application)}
                          sx={{ mr: 1 }}
                        >
                          Update Status
                        </Button>
                        {user?.role === 'admin' && (
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(application)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pet Name</TableCell>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Rescue</TableCell>
                    <TableCell>Applied Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApplications?.map((application: Application) => (
                    <TableRow key={application.id}>
                      <TableCell>{application.pet.name}</TableCell>
                      <TableCell>
                        {application.user.firstName} {application.user.lastName}
                        <br />
                        <Typography variant="caption" color="textSecondary">
                          {application.user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{application.pet.rescue.name}</TableCell>
                      <TableCell>
                        {new Date(application.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleView(application)}
                          sx={{ mr: 1 }}
                          startIcon={<VisibilityIcon />}
                        >
                          View
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleStatusChange(application)}
                          sx={{ mr: 1 }}
                        >
                          Update Status
                        </Button>
                        {user?.role === 'admin' && (
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(application)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Paper>

        {/* Status Update Dialog */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
          <DialogTitle>Update Application Status</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={newStatus}
                label="Status"
                onChange={(e) => setNewStatus(e.target.value as 'pending' | 'accepted' | 'unsuccessful')}
                disabled={updateStatusMutation.isPending}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="unsuccessful">Unsuccessful</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setStatusDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedApplication) {
                  updateStatusMutation.mutate({
                    id: selectedApplication.id,
                    status: newStatus,
                  });
                }
              }}
              variant="contained"
              disabled={updateStatusMutation.isPending}
              startIcon={updateStatusMutation.isPending ? <CircularProgress size={20} /> : null}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Application</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this application? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (selectedApplication) {
                  deleteMutation.mutate(selectedApplication.id);
                }
              }}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Application Details Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Application Details - {selectedApplication?.pet.name}
          </DialogTitle>
          <DialogContent>
            {selectedApplication && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Applicant Information
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography><strong>Name:</strong> {selectedApplication.user.firstName} {selectedApplication.user.lastName}</Typography>
                  <Typography><strong>Email:</strong> {selectedApplication.user.email}</Typography>
                  <Typography><strong>Status:</strong> {selectedApplication.status}</Typography>
                  <Typography><strong>Applied Date:</strong> {new Date(selectedApplication.createdAt).toLocaleDateString()}</Typography>
                </Box>

                <Typography variant="h6" gutterBottom>
                  Application Form Data
                </Typography>
                <Box sx={{ 
                  bgcolor: 'grey.50', 
                  p: 3, 
                  borderRadius: 1,
                  maxHeight: '500px',
                  overflow: 'auto'
                }}>
                  {(() => {
                    try {
                      const formData = typeof selectedApplication.formData === 'string' 
                        ? JSON.parse(selectedApplication.formData) 
                        : selectedApplication.formData;
                      
                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {/* Personal Information */}
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Personal Information
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Applicant Name</Typography>
                                <Typography variant="body1">{formData.applicantName}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Housing Status</Typography>
                                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                  {formData.housingStatus?.replace(/_/g, ' ')}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Address */}
                          {formData.adoptionAddress && (
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Adoption Address
                              </Typography>
                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <Box>
                                  <Typography variant="body2" color="textSecondary">Street</Typography>
                                  <Typography variant="body1">{formData.adoptionAddress.street}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="body2" color="textSecondary">City</Typography>
                                  <Typography variant="body1">{formData.adoptionAddress.city}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="body2" color="textSecondary">Postcode</Typography>
                                  <Typography variant="body1">{formData.adoptionAddress.postcode}</Typography>
                                </Box>
                              </Box>
                            </Box>
                          )}

                          {/* Household Information */}
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Household Information
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Number of Adults</Typography>
                                <Typography variant="body1">{formData.numberOfAdults}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Number of Children</Typography>
                                <Typography variant="body1">{formData.numberOfChildren}</Typography>
                              </Box>
                              {formData.childrenAges && (
                                <Box>
                                  <Typography variant="body2" color="textSecondary">Children Ages</Typography>
                                  <Typography variant="body1">{formData.childrenAges}</Typography>
                                </Box>
                              )}
                              <Box>
                                <Typography variant="body2" color="textSecondary">Secure Outdoor Space</Typography>
                                <Typography variant="body1" color={formData.hasSecureOutdoorSpace ? 'success.main' : 'error.main'}>
                                  {formData.hasSecureOutdoorSpace ? 'Yes' : 'No'}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Pet Information */}
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Pet Information
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Has Other Pets</Typography>
                                <Typography variant="body1" color={formData.hasOtherPets ? 'success.main' : 'error.main'}>
                                  {formData.hasOtherPets ? 'Yes' : 'No'}
                                </Typography>
                              </Box>
                              {formData.otherPetsDetails && (
                                <Box sx={{ gridColumn: '1 / -1' }}>
                                  <Typography variant="body2" color="textSecondary">Other Pets Details</Typography>
                                  <Typography variant="body1">{formData.otherPetsDetails}</Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>

                          {/* Experience & Preferences */}
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Experience & Preferences
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Animal Experience</Typography>
                                <Typography variant="body1">{formData.animalExperience}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Ideal Animal Personality</Typography>
                                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                  {formData.idealAnimalPersonality?.replace(/_/g, ' ')}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Work & Holiday Plans</Typography>
                                <Typography variant="body1">{formData.workHolidayPlans}</Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Reference Information */}
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Reference Information
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Reference Name</Typography>
                                <Typography variant="body1">{formData.referenceName}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Reference Phone</Typography>
                                <Typography variant="body1">{formData.referencePhone}</Typography>
                              </Box>
                              <Box sx={{ gridColumn: '1 / -1' }}>
                                <Typography variant="body2" color="textSecondary">Reference Email</Typography>
                                <Typography variant="body1">{formData.referenceEmail}</Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Consent */}
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Consent
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" color={formData.consent ? 'success.main' : 'error.main'}>
                                {formData.consent ? '✓' : '✗'}
                              </Typography>
                              <Typography variant="body1">
                                {formData.consent ? 'Consent given' : 'Consent not given'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Additional Details */}
                          {formData.additionalDetails && (
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Additional Details
                              </Typography>
                              <Typography variant="body1">{formData.additionalDetails}</Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    } catch (error) {
                      return (
                        <Box sx={{ 
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {JSON.stringify(selectedApplication.formData, null, 2)}
                        </Box>
                      );
                    }
                  })()}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
} 