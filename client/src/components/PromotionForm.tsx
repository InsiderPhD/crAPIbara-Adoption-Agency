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
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';

interface PromotionFormProps {
  open: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
}

interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  couponCode?: string;
}

interface CouponValidation {
  valid: boolean;
  message?: string;
  coupon?: {
    code: string;
    discountType: 'percentage' | 'fixed_amount';
    value: number;
    appliesTo: string;
    maxUses: number | null;
    timesUsed: number;
    expiryDate: string | null;
  };
  discount?: {
    originalFee: number;
    discountApplied: number;
    finalFee: number;
    discountPercentage: string;
  };
}

export default function PromotionForm({ open, onClose, petId, petName }: PromotionFormProps) {
  const { isInitializing } = useAuth();
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    couponCode: '',
  });
  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});
  const [success, setSuccess] = useState(false);
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const queryClient = useQueryClient();

  // Coupon validation mutation
  const validateCouponMutation = useMutation({
    mutationFn: async (couponCode: string) => {
      const response = await axios.get(`${API_URL}/promotions/coupons/${couponCode}/validate`);
      return response.data;
    },
    onSuccess: (data) => {
      setCouponValidation(data);
    },
    onError: (error: any) => {
      console.error('Error validating coupon:', error);
      setCouponValidation({
        valid: false,
        message: error.response?.data?.message || 'Invalid coupon code'
      });
    },
  });

  const promotionMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      console.log('Promoting pet:', petId, 'with token:', token.substring(0, 20) + '...');
      
      // Prepare request data - only include card details if not free
      const isFree = couponValidation?.valid && couponValidation.discount?.finalFee === 0;
      const requestData = isFree ? { couponCode: data.couponCode } : data;
      
      const response = await axios.post(
        `${API_URL}/promotions/pets/${petId}/promote`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Promotion response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Promotion successful:', data);
      // Refetch pet data to update the UI
      try {
        queryClient.invalidateQueries({ queryKey: ['pet', petId] });
        queryClient.invalidateQueries({ queryKey: ['pets'] });
        console.log('Queries invalidated successfully');
      } catch (error) {
        console.error('Error invalidating queries:', error);
        // Don't let query invalidation errors affect the promotion success
      }
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: '',
          couponCode: '',
        });
        setCouponValidation(null);
      }, 2000); // Show success message for 2 seconds
    },
    onError: (error: any) => {
      console.error('Error promoting pet:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    },
  });

  const validateForm = () => {
    const newErrors: Partial<PaymentFormData> = {};
    const isFree = couponValidation?.valid && couponValidation.discount?.finalFee === 0;

    // Only validate card details if the promotion is not free
    if (!isFree) {
      if (!formData.cardNumber) {
        newErrors.cardNumber = 'Card number is required';
      } else if (formData.cardNumber.length < 13) {
        newErrors.cardNumber = 'Card number must be at least 13 digits';
      }

      if (!formData.expiryDate) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'Use MM/YY format';
      }

      if (!formData.cvv) {
        newErrors.cvv = 'CVV is required';
      } else if (formData.cvv.length < 3) {
        newErrors.cvv = 'CVV must be at least 3 digits';
      }

      if (!formData.cardholderName) {
        newErrors.cardholderName = 'Cardholder name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && !success && !isInitializing) {
      promotionMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof PaymentFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCouponValidation = () => {
    if (formData.couponCode && formData.couponCode.trim()) {
      setIsValidatingCoupon(true);
      validateCouponMutation.mutate(formData.couponCode.trim(), {
        onSettled: () => {
          setIsValidatingCoupon(false);
        }
      });
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Promote {petName} for {couponValidation?.valid && couponValidation.discount ? 
          `$${couponValidation.discount.finalFee.toFixed(2)}` : '$5'}
        {couponValidation?.valid && couponValidation.discount && 
          <Typography variant="caption" sx={{ textDecoration: 'line-through', ml: 1 }}>
            was $5
          </Typography>
        }
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Promote this pet to get more visibility and increase adoption chances!
          </Typography>

          {promotionMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to promote pet. Please try again.
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Pet promoted successfully! The dialog will close shortly.
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Coupon Code Section */}
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Have a coupon code? (Optional)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Coupon Code"
                  value={formData.couponCode}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }));
                    setCouponValidation(null);
                  }}
                  placeholder="Enter coupon code"
                  sx={{ flex: 1 }}
                  size="small"
                />
                <Button
                  variant="outlined"
                  onClick={handleCouponValidation}
                  disabled={!formData.couponCode || isValidatingCoupon}
                  size="small"
                >
                  {isValidatingCoupon ? <CircularProgress size={20} /> : 'Validate'}
                </Button>
              </Box>
              
              {couponValidation && (
                <Box sx={{ mt: 1 }}>
                  {couponValidation.valid ? (
                    <Alert severity="success" sx={{ py: 0 }}>
                      <Typography variant="body2">
                        Coupon applied! {couponValidation.discount?.discountPercentage}% off
                        (${couponValidation.discount?.discountApplied} discount)
                      </Typography>
                    </Alert>
                  ) : (
                    <Alert severity="error" sx={{ py: 0 }}>
                      <Typography variant="body2">
                        {couponValidation.message || 'Invalid coupon code'}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </Box>

            {/* Card Details Section - Only show if not free */}
            {!(couponValidation?.valid && couponValidation.discount?.finalFee === 0) && (
              <>
                <TextField
                  label="Card Number"
                  value={formData.cardNumber}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value);
                    setFormData(prev => ({ ...prev, cardNumber: formatted }));
                  }}
                  error={!!errors.cardNumber}
                  helperText={errors.cardNumber}
                  placeholder="1234 5678 9012 3456"
                  fullWidth
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Expiry Date"
                    value={formData.expiryDate}
                    onChange={(e) => {
                      const formatted = formatExpiryDate(e.target.value);
                      setFormData(prev => ({ ...prev, expiryDate: formatted }));
                    }}
                    error={!!errors.expiryDate}
                    helperText={errors.expiryDate}
                    placeholder="MM/YY"
                    sx={{ flex: 1 }}
                  />

                  <TextField
                    label="CVV"
                    value={formData.cvv}
                    onChange={handleInputChange('cvv')}
                    error={!!errors.cvv}
                    helperText={errors.cvv}
                    placeholder="123"
                    sx={{ flex: 1 }}
                    inputProps={{ maxLength: 4 }}
                  />
                </Box>

                <TextField
                  label="Cardholder Name"
                  value={formData.cardholderName}
                  onChange={handleInputChange('cardholderName')}
                  error={!!errors.cardholderName}
                  helperText={errors.cardholderName}
                  placeholder="John Doe"
                  fullWidth
                />
              </>
            )}

            {/* Free Promotion Message */}
            {couponValidation?.valid && couponValidation.discount?.finalFee === 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  🎉 This promotion is completely free! No payment required.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={promotionMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={promotionMutation.isPending || isInitializing}
            startIcon={promotionMutation.isPending ? <CircularProgress size={20} /> : null}
          >
            {promotionMutation.isPending ? 'Processing...' : 
              `Promote Pet (${couponValidation?.valid && couponValidation.discount ? 
                `$${couponValidation.discount.finalFee.toFixed(2)}` : '$5'})`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 