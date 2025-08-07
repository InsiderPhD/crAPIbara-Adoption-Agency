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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

import { API_BASE_URL, API_URL } from '../config/api';

interface CouponCode {
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  value: number;
  isActive: boolean;
  appliesTo: 'rescue_fee' | 'promotion';
  maxUses: number | null;
  timesUsed: number;
  expiryDate: string | null;
  createdAt: string;
}

interface CouponFormData {
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  value: number;
  appliesTo: 'rescue_fee' | 'promotion';
  maxUses: number | null;
  expiryDate: string;
  isActive: boolean;
}

export default function AdminCouponManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponCode | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    discountType: 'percentage',
    value: 0,
    appliesTo: 'promotion',
    maxUses: null,
    expiryDate: '',
    isActive: true,
  });

  // Fetch coupon codes
  const { data: couponsData, isLoading, error } = useQuery({
    queryKey: ['admin-coupons', page, search, isActiveFilter],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(isActiveFilter && { isActive: isActiveFilter }),
      });
      
      const response = await axios.get(`${API_URL}/admin/coupon-codes?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  });

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.post(`${API_URL}/admin/coupon-codes`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setDialogOpen(false);
      setFormData({
        code: '',
        discountType: 'percentage',
        value: 0,
        appliesTo: 'promotion',
        maxUses: null,
        expiryDate: '',
        isActive: true,
      });
    },
  });

  // Update coupon mutation
  const updateCouponMutation = useMutation({
    mutationFn: async ({ code, data }: { code: string; data: Partial<CouponFormData> }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.put(`${API_URL}/admin/coupon-codes/${code}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setEditDialogOpen(false);
      setSelectedCoupon(null);
    },
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.delete(`${API_URL}/admin/coupon-codes/${code}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });

  // Handlers
  const handleCreateCoupon = () => {
    createCouponMutation.mutate(formData);
  };

  const handleEditCoupon = (coupon: CouponCode) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      appliesTo: coupon.appliesTo,
      maxUses: coupon.maxUses,
      expiryDate: coupon.expiryDate || '',
      isActive: coupon.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateCoupon = () => {
    if (!selectedCoupon) return;
    
    updateCouponMutation.mutate({
      code: selectedCoupon.code,
      data: formData,
    });
  };

  const handleDeleteCoupon = (code: string) => {
    if (window.confirm('Are you sure you want to delete this coupon code? This action cannot be undone.')) {
      deleteCouponMutation.mutate(code);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiry';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          You do not have permission to access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Coupon Code Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create and manage coupon codes for pet promotions and rescue fees.
      </Typography>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <TextField
                fullWidth
                label="Search Coupons"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={isActiveFilter}
                  onChange={(e) => setIsActiveFilter(e.target.value)}
                  label="Status Filter"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Create Coupon
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">
          Error loading coupon codes: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Code</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Value</strong></TableCell>
                  <TableCell><strong>Applies To</strong></TableCell>
                  <TableCell><strong>Usage</strong></TableCell>
                  <TableCell><strong>Expiry</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {couponsData?.data?.map((coupon: CouponCode) => (
                  <TableRow key={coupon.code} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
                          {coupon.code}
                        </Typography>
                        <Tooltip title="Copy code">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyCode(coupon.code)}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                        size="small"
                        color={coupon.discountType === 'percentage' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {coupon.discountType === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={coupon.appliesTo === 'promotion' ? 'Promotions' : 'Rescue Fees'}
                        size="small"
                        color="info"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {coupon.timesUsed}
                        {coupon.maxUses && ` / ${coupon.maxUses}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(coupon.expiryDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={coupon.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={coupon.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit Coupon">
                          <IconButton
                            size="small"
                            onClick={() => handleEditCoupon(coupon)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Coupon">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteCoupon(coupon.code)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {couponsData?.pagination && couponsData.pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={couponsData.pagination.totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Create Coupon Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Coupon Code</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                label="Coupon Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                sx={{ flex: 1 }}
              />
              <Button variant="outlined" onClick={generateRandomCode}>
                Generate
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed_amount' })}
                  label="Discount Type"
                >
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>Applies To</InputLabel>
              <Select
                value={formData.appliesTo}
                onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value as 'rescue_fee' | 'promotion' })}
                label="Applies To"
              >
                <MenuItem value="promotion">Pet Promotions</MenuItem>
                <MenuItem value="rescue_fee">Rescue Fees</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Max Uses (optional)"
                type="number"
                value={formData.maxUses || ''}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                inputProps={{ min: 1 }}
              />
              
              <TextField
                fullWidth
                label="Expiry Date (optional)"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateCoupon}
            variant="contained"
            disabled={createCouponMutation.isPending || !formData.code || formData.value <= 0}
          >
            {createCouponMutation.isPending ? <CircularProgress size={20} /> : 'Create Coupon'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Coupon Code</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="Coupon Code"
              value={formData.code}
              disabled
              sx={{ flex: 1 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed_amount' })}
                  label="Discount Type"
                >
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>Applies To</InputLabel>
              <Select
                value={formData.appliesTo}
                onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value as 'rescue_fee' | 'promotion' })}
                label="Applies To"
              >
                <MenuItem value="promotion">Pet Promotions</MenuItem>
                <MenuItem value="rescue_fee">Rescue Fees</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Max Uses (optional)"
                type="number"
                value={formData.maxUses || ''}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                inputProps={{ min: 1 }}
              />
              
              <TextField
                fullWidth
                label="Expiry Date (optional)"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateCoupon}
            variant="contained"
            disabled={updateCouponMutation.isPending || formData.value <= 0}
          >
            {updateCouponMutation.isPending ? <CircularProgress size={20} /> : 'Update Coupon'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 
 