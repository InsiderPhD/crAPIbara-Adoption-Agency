import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export default function RescueRequestForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    rescueName: '',
    rescueLocation: '',
    reason: '',
    couponCode: '',
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

      const response = await axios.post(
        `${API_URL}/rescue-requests`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess('Your rescue account request has been submitted. We will review it and get back to you soon.');
      setFormData({
        rescueName: '',
        rescueLocation: '',
        reason: '',
        couponCode: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit rescue request');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Alert severity="error">
        You must be logged in to submit a rescue request.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Request Rescue Account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fill out this form to request a rescue account upgrade. We'll review your request and get back to you soon.
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
          helperText="City, State, Country"
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
          helperText="Tell us about your experience with rodents and why you want to become a rescue"
        />
        <TextField
          fullWidth
          label="Coupon Code (Optional)"
          name="couponCode"
          value={formData.couponCode}
          onChange={handleChange}
          margin="normal"
          helperText="If you have a coupon code, enter it here"
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
    </Box>
  );
} 