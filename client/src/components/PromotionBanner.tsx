import React, { useState, useEffect } from 'react';
import { Box, Alert, AlertTitle, Typography, Button, CircularProgress, Collapse } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';

interface PromotionBannerProps {
  onClose?: () => void;
}

export default function PromotionBanner({ onClose }: PromotionBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [promotionData, setPromotionData] = useState<{
    recentlyPromoted: boolean;
    rescueId: string | null;
    rescueName: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const checkPromotion = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !user) {
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/users/me/rescue-promotion`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = response.data;
        setPromotionData(data);
        
        // Show banner if user was recently promoted
        if (data.recentlyPromoted) {
          setShowBanner(true);
        }
      } catch (error) {
        console.error('Error checking promotion status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPromotion();
  }, [user]);

  const handleClose = () => {
    setShowBanner(false);
    onClose?.();
  };

  const handleManageRescue = () => {
    navigate('/manage-rescue');
    handleClose();
  };

  if (loading || !showBanner || !promotionData?.recentlyPromoted) {
    return null;
  }

  return (
    <Collapse in={showBanner}>
      <Box sx={{ mb: 2 }}>
        <Alert
          severity="success"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleClose}
              startIcon={<CloseIcon />}
            >
              Close
            </Button>
          }
        >
          <AlertTitle>Congratulations! 🎉</AlertTitle>
          Your rescue account has been created successfully! 
          {promotionData.rescueName && (
            <Box sx={{ mt: 1 }}>
              Your rescue "{promotionData.rescueName}" is now active.
            </Box>
          )}
          <Box sx={{ mt: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleManageRescue}
              sx={{ mr: 1 }}
            >
              Manage Rescue Details
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/add-pet')}
            >
              Add Your First Pet
            </Button>
          </Box>
        </Alert>
      </Box>
    </Collapse>
  );
} 