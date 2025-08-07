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
  Link,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, user, isAuthenticated } = useAuth();
  
  // Debug: Log auth state
  useEffect(() => {
    console.log('Login component - Current user:', user);
    console.log('Login component - Is authenticated:', isAuthenticated);
    
    // If user is already authenticated, redirect to home
    if (isAuthenticated && user) {
      console.log('User already authenticated, redirecting to home');
      navigate('/');
    }
  }, [user, isAuthenticated, navigate]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
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
    setLoading(true);

    try {
      console.log('Attempting login with:', formData);
      const response = await axios.post(`${API_URL}/users/login`, formData);
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        const { data: { token, id, username, email, role, rescueId } } = response.data;
        
        // Set the token in localStorage and axios defaults
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set the user data in the context
        console.log('Setting user in context:', { id, username, email, role, rescueId });
        setUser({
          id,
          username,
          email,
          role,
          rescueId // Include rescueId from the response
        });
        
        // Add a small delay to ensure the user state is set before navigation
        setTimeout(() => {
          console.log('Navigating to home page');
          console.log('Final user state before navigation:', { id, username, email, role, rescueId });
        navigate('/');
        }, 500); // Increased delay to ensure state is set
      }
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'An error occurred during login. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
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
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
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
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <RouterLink to="/register" style={{ textDecoration: 'none' }}>
              Register here
            </RouterLink>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <RouterLink to="/forgot-password" style={{ textDecoration: 'none' }}>
              Forgot your password?
            </RouterLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 