import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface ProfileInfo {
  name?: string;
  job?: string;
  age?: number;
  maritalStatus?: string;
  hobbies?: string;
  pets?: string;
}

export default function UpdateProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({
    name: '',
    job: '',
    age: undefined,
    maritalStatus: '',
    hobbies: '',
    pets: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing profile info when component mounts
  useEffect(() => {
    const loadProfileInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data) {
          // Set username and email from backend
          setFormData(prev => ({
            ...prev,
            username: response.data.username || '',
            email: response.data.email || '',
          }));
          // Set profileInfo from backend
          if (response.data.profileInfo) {
            try {
              const parsedProfileInfo = JSON.parse(response.data.profileInfo);
              setProfileInfo({
                name: parsedProfileInfo.name || '',
                job: parsedProfileInfo.job || '',
                age: parsedProfileInfo.age || '',
                maritalStatus: parsedProfileInfo.maritalStatus || '',
                hobbies: parsedProfileInfo.hobbies || '',
                pets: parsedProfileInfo.pets || '',
              });
            } catch (e) {
              setProfileInfo({
                name: '',
                job: '',
                age: undefined,
                maritalStatus: '',
                hobbies: '',
                pets: '',
              });
            }
          } else {
            setProfileInfo({
              name: '',
              job: '',
              age: undefined,
              maritalStatus: '',
              hobbies: '',
              pets: '',
            });
          }
        }
      } catch (err) {
        console.log('Could not load profile info');
      }
    };

    if (user) {
      loadProfileInfo();
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileInfoChange = (field: keyof ProfileInfo, value: string | number) => {
    setProfileInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate passwords match if changing password
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/users/profile`, {
        username: formData.username,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        profileInfo: profileInfo,
      });

      if (response.data) {
        setSuccess('Profile updated successfully');
        // Update user context with new data
        setUser({
          ...user!,
          username: formData.username,
          email: formData.email,
        });
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Update Profile
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Basic Information
                </Typography>
                
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
              </Box>

              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Personal Information
                </Typography>
                
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profileInfo.name || ''}
                  onChange={(e) => handleProfileInfoChange('name', e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Job/Occupation"
                  value={profileInfo.job || ''}
                  onChange={(e) => handleProfileInfoChange('job', e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Age"
                  type="number"
                  value={profileInfo.age || ''}
                  onChange={(e) => handleProfileInfoChange('age', parseInt(e.target.value) || 0)}
                  margin="normal"
                  inputProps={{ min: 0, max: 120 }}
                />
                {/* Removed FormControl, InputLabel, Select, MenuItem for Marital Status */}
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Additional Information
              </Typography>
              
              <TextField
                fullWidth
                label="Hobbies & Interests"
                value={profileInfo.hobbies || ''}
                onChange={(e) => handleProfileInfoChange('hobbies', e.target.value)}
                margin="normal"
                multiline
                rows={3}
                helperText="Tell us about your hobbies and interests"
              />
              <TextField
                fullWidth
                label="Current Pets"
                value={profileInfo.pets || ''}
                onChange={(e) => handleProfileInfoChange('pets', e.target.value)}
                margin="normal"
                multiline
                rows={3}
                helperText="Tell us about any pets you currently have"
              />
            </Box>

            <Box>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Change Password (Optional)
          </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
                  sx={{ flex: 1, minWidth: 200 }}
            label="Current Password"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
                  sx={{ flex: 1, minWidth: 200 }}
            label="New Password"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
                  sx={{ flex: 1, minWidth: 200 }}
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
          />
              </Box>
            </Box>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Profile'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
} 