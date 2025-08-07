import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
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
  Chip,
  Pagination,
  TextField,
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
  gateway: string;
  gatewayTransactionId: string;
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

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function AdminTransactions() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedKind, setSelectedKind] = useState('');

  // Generate current year and previous 2 years
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const { data, isLoading, error } = useQuery<{
    data: Transaction[];
    pagination: PaginationInfo;
  }>({
    queryKey: ['admin-transactions', page, selectedMonth, selectedYear, selectedStatus, selectedKind],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedKind) params.append('kind', selectedKind);

      const response = await axios.get(`${API_URL}/admin/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
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

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleFilterReset = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedStatus('');
    setSelectedKind('');
    setPage(1);
  };

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
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
        Admin Transactions
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <MenuItem value="">All Months</MenuItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <MenuItem key={month} value={month.toString()}>
                    {new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value="">All Years</MenuItem>
                {years.map((year) => (
                  <MenuItem key={year} value={year.toString()}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failure">Failure</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedKind}
                label="Type"
                onChange={(e) => setSelectedKind(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="sale">Sale</MenuItem>
                <MenuItem value="refund">Refund</MenuItem>
                <MenuItem value="fee">Fee</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={handleFilterReset}
              fullWidth
            >
              Reset Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Summary */}
      {data && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Transactions
                </Typography>
                <Typography variant="h4">
                  {data.pagination.total}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Amount
                </Typography>
                <Typography variant="h4">
                  ${data.data.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Success Rate
                </Typography>
                <Typography variant="h4">
                  {data.data.filter(t => t.status === 'success').length}/{data.data.length}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Current Page
                </Typography>
                <Typography variant="h4">
                  {data.pagination.currentPage}/{data.pagination.totalPages}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Transactions Table */}
      {data?.data.length === 0 ? (
        <Alert severity="info">
          No transactions found matching the current filters.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Gateway</TableCell>
                  <TableCell>Transaction ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.data.map((transaction) => (
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
                    <TableCell>
                      {transaction.paymentDetails.promotionType === 'pet_promotion' && (
                        <Box>
                          <Typography variant="body2">
                            Pet Promotion: {transaction.paymentDetails.petName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Card: **** **** **** {transaction.paymentDetails.cardLast4}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Rescue ID: {transaction.paymentDetails.rescueId}
                          </Typography>
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
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.gateway}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {transaction.gatewayTransactionId}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={data.pagination.totalPages}
                page={data.pagination.currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
} 