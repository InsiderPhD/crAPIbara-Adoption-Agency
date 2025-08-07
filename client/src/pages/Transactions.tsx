import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Pagination,
  Button,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

import { API_BASE_URL, API_URL } from '../config/api';

interface Transaction {
  id: number;
  amount: number;
  currency: string;
  status: string;
  kind: string;
  createdAt: string;
  gateway?: string;
  gatewayTransactionId?: string;
  paymentDetails: {
    cardholderName?: string;
    cardLast4?: string;
    promotionType?: string;
    petId?: string;
    petName?: string;
    rescueId?: string;
  };
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null;
}

export default function Transactions() {
  const { user } = useAuth();

  // Use different endpoints based on user role
  const endpoint = user?.role === 'admin' 
    ? `${API_URL}/admin/transactions` 
    : `${API_URL}/promotions/transactions`;

  const { data: transactions, isLoading, error } = useQuery<{ data: Transaction[] }>({
    queryKey: ['transactions', user?.role],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!user,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failure':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'sale':
        return 'Sale';
      case 'refund':
        return 'Refund';
      case 'fee':
        return 'Fee';
      default:
        return kind;
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading transactions...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load transactions. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {user?.role === 'admin' ? 'Admin Transactions' : 'Transaction History'}
      </Typography>
      
      {transactions?.data.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No transactions found. Your transaction history will appear here once you make payments.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                {user?.role === 'admin' && <TableCell>User</TableCell>}
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                {user?.role === 'admin' && <TableCell>Gateway</TableCell>}
                {user?.role === 'admin' && <TableCell>Transaction ID</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions?.data.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {formatDate(transaction.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getKindLabel(transaction.kind)} 
                      size="small" 
                      color="primary" 
                    />
                  </TableCell>
                  {user?.role === 'admin' && (
                    <TableCell>
                      {transaction.user ? (
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {transaction.user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {transaction.user.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {transaction.user.role}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Unknown User
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {transaction.paymentDetails.promotionType === 'pet_promotion' && (
                      <Box>
                        <Typography variant="body2">
                          Pet Promotion: {transaction.paymentDetails.petName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Card: **** **** **** {transaction.paymentDetails.cardLast4}
                        </Typography>
                        {user?.role === 'admin' && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Rescue ID: {transaction.paymentDetails.rescueId}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      ${transaction.amount.toFixed(2)} {transaction.currency}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={transaction.status} 
                      size="small" 
                      color={getStatusColor(transaction.status) as any}
                    />
                  </TableCell>
                  {user?.role === 'admin' && (
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.gateway || 'N/A'}
                      </Typography>
                    </TableCell>
                  )}
                  {user?.role === 'admin' && (
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {transaction.gatewayTransactionId || 'N/A'}
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
} 
 