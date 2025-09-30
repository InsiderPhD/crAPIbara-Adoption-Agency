import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

import { API_BASE_URL, API_URL } from '../config/api';

interface Application {
  id: string;
  userId: string;
  petId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export default function ViewApplications() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['applications', id],
    queryFn: async () => {
      const { data } = await api.get(`/applications/pet/${id}`);
      return data.data;
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load applications. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/pets/${id}`)}
          sx={{ mb: 3 }}
        >
          Back to Pet Details
        </Button>

        <Typography variant="h4" gutterBottom>
          Adoption Applications
        </Typography>

        {applications?.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No applications have been submitted yet.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {applications?.map((application: Application) => (
              <Box key={application.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {application.user.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Email: {application.user.email}
                        </Typography>
                      </Box>
                      <Chip
                        label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        color={getStatusColor(application.status)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Applied on: {formatDate(application.createdAt)}
                    </Typography>
                    {application.updatedAt !== application.createdAt && (
                      <Typography variant="body2" color="text.secondary">
                        Last updated: {formatDate(application.updatedAt)}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
} 