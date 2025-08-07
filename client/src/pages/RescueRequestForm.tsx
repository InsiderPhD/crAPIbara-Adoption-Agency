import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export default function RescueRequestForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    rescueName: '',
    rescueLocation: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to submit a rescue request');
        return;
      }

      const response = await axios.post(`${API_URL}/rescue-requests`, {
        ...formData,
        status: 'pending'
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setSuccess('Your rescue account request has been submitted successfully!');
        setFormData({
          rescueName: '',
          rescueLocation: '',
          reason: '',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit rescue request');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Login Required
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            Please log in to request a rescue account.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Request Rescue Account
        </Typography>

        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          Fill out the form below to request a rescue account. Our team will review your application and get back to you soon.
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
          <TextField
            fullWidth
            label="Rescue Name"
            name="rescueName"
            value={formData.rescueName}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Rescue Location"
            name="rescueLocation"
            value={formData.rescueLocation}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Why do you want to become a rescue?"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            margin="normal"
            required
            multiline
            rows={4}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
} 