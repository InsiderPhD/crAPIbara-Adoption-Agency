import React, { useState, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
  Grid,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  Description as DescriptionIcon,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import { API_BASE_URL } from '../config/api';

interface RescueProfile {
  id: string;
  name: string;
  location: string;
  contactEmail: string;
  description: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  registrationNumber: string | null;
  createdAt: string;
  updatedAt: string;
  users: {
    id: string;
    username: string;
    email: string;
    role: string;
  }[];
  pets: {
    id: string;
    name: string;
    species: string;
    age: number;
    isAdopted: boolean;
    isPromoted: boolean;
    dateListed: string;
  }[];
}

interface RescueFormData {
  name: string;
  location: string;
  contactEmail: string;
  description: string;
  websiteUrl: string;
  registrationNumber: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function ManageRescue() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<RescueFormData>({
    name: '',
    location: '',
    contactEmail: '',
    description: '',
    websiteUrl: '',
    registrationNumber: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Add user to rescue state
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Delete rescue dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteRescueMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      await axios.delete(`${API_URL}/rescues/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      logout();
      navigate('/');
    },
  });

  // Fetch rescue profile
  const { data: rescueData, isLoading, error } = useQuery<{ data: RescueProfile }>({
    queryKey: ['rescue-profile'],
    queryFn: async () => {
      if (!user?.rescueId) {
        throw new Error('No rescue ID found for current user');
      }
      
      const response = await axios.get(`${API_URL}/rescues/${user.rescueId}`);
      return response.data;
    },
    enabled: !!user && user.role === 'rescue' && !!user.rescueId,
  });

  // Fetch all users for adding to rescue
  const { data: usersData } = useQuery<{ data: User[] }>({
    queryKey: ['users-for-rescue'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/rescues/users/available`);
      return response.data;
    },
    enabled: !!user && user.role === 'rescue',
  });

  // Update rescue profile mutation
  const updateRescueMutation = useMutation({
    mutationFn: async (data: Partial<RescueFormData>) => {
      if (!user?.rescueId) {
        throw new Error('No rescue ID found for current user');
      }
      
      const response = await axios.put(`${API_URL}/rescues/${user.rescueId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescue-profile'] });
      setIsEditing(false);
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.rescueId) {
        throw new Error('No rescue ID found for current user');
      }
      
      // Upload to local-s3 service first
      const formData = new FormData();
      formData.append('image', file);
      
      const uploadResponse = await axios.post('http://localhost:4000/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Get the image URL from local-s3
      const imageUrl = `http://localhost:4000/images/${uploadResponse.data.filename}`;
      
      // Update rescue with the new logo URL
      const response = await axios.put(`${API_URL}/rescues/${user.rescueId}`, {
        logoUrl: imageUrl
      });
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescue-profile'] });
      setSelectedFile(null);
      setPreviewUrl(null);
    },
  });

  const handleEdit = () => {
    if (rescueData?.data) {
      setFormData({
        name: rescueData.data.name,
        location: rescueData.data.location,
        contactEmail: rescueData.data.contactEmail,
        description: rescueData.data.description,
        websiteUrl: rescueData.data.websiteUrl || '',
        registrationNumber: rescueData.data.registrationNumber || '',
      });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSave = () => {
    updateRescueMutation.mutate(formData);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadLogo = () => {
    if (selectedFile) {
      uploadLogoMutation.mutate(selectedFile);
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  // Add user to rescue mutation
  const addUserToRescueMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!user?.rescueId) {
        throw new Error('No rescue ID found for current user');
      }
      
      const response = await axios.post(`${API_URL}/rescues/${user.rescueId}/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescue-profile'] });
      queryClient.invalidateQueries({ queryKey: ['users-for-rescue'] });
      setAddUserDialogOpen(false);
      setSelectedUserId('');
    },
  });

  const handleAddUserToRescue = () => {
    setAddUserDialogOpen(true);
  };

  const handleSubmitAddUser = () => {
    if (!selectedUserId) return;
    
    addUserToRescueMutation.mutate({
      userId: selectedUserId,
    });
  };

  // Remove user from rescue mutation
  const removeUserFromRescueMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.delete(`${API_URL}/rescues/me/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescue-profile'] });
    },
  });

  const handleRemoveUser = (userId: string) => {
    if (window.confirm('Are you sure you want to remove this user from the rescue?')) {
      removeUserFromRescueMutation.mutate(userId);
    }
  };

  if (!user || user.role !== 'rescue') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          You do not have permission to access this page.
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Error loading rescue profile: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  const rescue = rescueData?.data;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Rescue Profile
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Update your rescue organization details and upload a logo.
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Logo Section */}
        <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rescue Logo
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={previewUrl || rescue?.logoUrl || undefined}
                  sx={{ 
                    width: 120, 
                    height: 120,
                    border: '2px solid #e0e0e0'
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 60 }} />
                </Avatar>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCameraIcon />}
                    onClick={handleFileInputClick}
                    disabled={uploadLogoMutation.isPending}
                  >
                    Choose Logo
                  </Button>
                  {selectedFile && (
                    <Button
                      variant="contained"
                      onClick={handleUploadLogo}
                      disabled={uploadLogoMutation.isPending}
                    >
                      {uploadLogoMutation.isPending ? <CircularProgress size={20} /> : 'Upload'}
                    </Button>
                  )}
                </Box>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                {selectedFile && (
                  <Typography variant="caption" color="text.secondary">
                    Selected: {selectedFile.name}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Profile Details Section */}
        <Box sx={{ flex: '2 1 600px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Rescue Details
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!isEditing ? (
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                    >
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                        disabled={updateRescueMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={updateRescueMutation.isPending}
                      >
                        {updateRescueMutation.isPending ? <CircularProgress size={20} /> : 'Save'}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete Rescue
                  </Button>
                </Box>
              </Box>

                             {isEditing ? (
                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                   <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                     <TextField
                       fullWidth
                       label="Rescue Name"
                       value={formData.name}
                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                       required
                       sx={{ flex: 1, minWidth: 300 }}
                     />
                     <TextField
                       fullWidth
                       label="Location"
                       value={formData.location}
                       onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                       required
                       sx={{ flex: 1, minWidth: 300 }}
                     />
                   </Box>
                   
                   <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                     <TextField
                       fullWidth
                       label="Contact Email"
                       type="email"
                       value={formData.contactEmail}
                       onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                       required
                       sx={{ flex: 1, minWidth: 300 }}
                     />
                     <TextField
                       fullWidth
                       label="Registration Number"
                       value={formData.registrationNumber}
                       onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                       sx={{ flex: 1, minWidth: 300 }}
                     />
                   </Box>
                  
                  <TextField
                    fullWidth
                    label="Website URL"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://example.com"
                  />
                  
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={4}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <BusinessIcon color="primary" />
                    <Typography variant="h6">{rescue?.name}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocationIcon color="action" />
                    <Typography variant="body1">{rescue?.location}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EmailIcon color="action" />
                    <Typography variant="body1">{rescue?.contactEmail}</Typography>
                  </Box>
                  
                  {rescue?.websiteUrl && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LanguageIcon color="action" />
                      <Typography variant="body1">
                        <a href={rescue.websiteUrl} target="_blank" rel="noopener noreferrer">
                          {rescue.websiteUrl}
                        </a>
                      </Typography>
                    </Box>
                  )}
                  
                  {rescue?.registrationNumber && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Registration: {rescue.registrationNumber}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <DescriptionIcon color="action" sx={{ mt: 0.5 }} />
                    <Typography variant="body1">{rescue?.description}</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Statistics Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Rescue Statistics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 2, textAlign: 'center', flex: '1 1 200px', minWidth: 0 }}>
            <Typography variant="h4" color="primary">
              {rescue?.users.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Team Members
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', flex: '1 1 200px', minWidth: 0 }}>
            <Typography variant="h4" color="primary">
              {rescue?.pets.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Pets
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', flex: '1 1 200px', minWidth: 0 }}>
            <Typography variant="h4" color="success.main">
              {rescue?.pets.filter(pet => pet.isAdopted).length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Adopted Pets
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', flex: '1 1 200px', minWidth: 0 }}>
            <Typography variant="h4" color="warning.main">
              {rescue?.pets.filter(pet => pet.isPromoted).length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Promoted Pets
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Team Members Section */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Team Members
              </Typography>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={handleAddUserToRescue}
              >
                Add User
              </Button>
            </Box>
            
            {rescue?.users && rescue.users.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {rescue.users.map((user) => (
                  <Chip
                    key={user.id}
                    icon={<PersonIcon />}
                    label={`${user.username} (${user.email})`}
                    color="primary"
                    variant="outlined"
                    onDelete={() => handleRemoveUser(user.id)}
                    deleteIcon={
                      <CloseIcon 
                        sx={{ 
                          fontSize: '16px',
                          color: 'error.main',
                          '&:hover': { color: 'error.dark' }
                        }} 
                      />
                    }
                    sx={{
                      '& .MuiChip-deleteIcon': {
                        color: 'error.main',
                        '&:hover': { color: 'error.dark' }
                      }
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No team members yet. Add users to collaborate on your rescue.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add User to Rescue</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Adding user to: <strong>{rescue?.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current users: {rescue?.users.length || 0}
                </Typography>
              </Box>
              
              <FormControl fullWidth>
                <InputLabel>Select User</InputLabel>
                <Select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  label="Select User"
                  required
                >
                  <MenuItem value="">
                    <em>Select a user to add to this rescue</em>
                  </MenuItem>
                  {usersData?.data?.filter(user => user.role === 'user' && !rescue?.users.some(rescueUser => rescueUser.id === user.id)).map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {rescue?.users && rescue.users.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Current Users:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {rescue.users.map((user) => (
                      <Chip
                        key={user.id}
                        label={`${user.username} (${user.email})`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitAddUser}
            variant="contained"
            disabled={addUserToRescueMutation.isPending || !selectedUserId}
          >
            {addUserToRescueMutation.isPending ? <CircularProgress size={20} /> : 'Add User to Rescue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Rescue Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Rescue</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to delete this rescue? <b>This action cannot be undone.</b>
          </Typography>
          <Typography color="error" gutterBottom>
            All team members will be demoted to regular users and lose access to rescue features. All rescue data will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteRescueMutation.isPending}>Cancel</Button>
          <Button
            onClick={() => deleteRescueMutation.mutate()}
            color="error"
            variant="contained"
            disabled={deleteRescueMutation.isPending}
          >
            {deleteRescueMutation.isPending ? <CircularProgress size={20} /> : 'Delete Rescue'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 
 