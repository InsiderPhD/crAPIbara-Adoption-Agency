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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const steps = ['General Details', 'Pet Experience', 'Reference', 'Confirmation'];

interface AdoptionAddress {
  street: string;
  city: string;
  postcode: string;
}

interface AdoptionFormData {
  applicantName: string;
  adoptionAddress: AdoptionAddress;
  housingStatus: 'homeowner' | 'renter_with_permission' | 'renter_without_permission';
  hasSecureOutdoorSpace: boolean;
  numberOfAdults: number;
  numberOfChildren: number;
  childrenAges?: string;
  hasOtherPets: boolean;
  otherPetsDetails?: string;
  workHolidayPlans: string;
  animalExperience: string;
  idealAnimalPersonality: 'relaxed' | 'playful' | 'shy' | 'adventurous' | 'water_lover' | 'independent' | 'cuddly';
  referenceName: string;
  referencePhone: string;
  referenceEmail: string;
  consent: boolean;
}

export default function AdoptionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<AdoptionFormData>({
    applicantName: '',
    adoptionAddress: {
      street: '',
      city: '',
      postcode: ''
    },
    housingStatus: 'homeowner',
    hasSecureOutdoorSpace: false,
    numberOfAdults: 0,
    numberOfChildren: 0,
    childrenAges: '',
    hasOtherPets: false,
    otherPetsDetails: '',
    workHolidayPlans: '',
    animalExperience: '',
    idealAnimalPersonality: 'relaxed',
    referenceName: '',
    referencePhone: '',
    referenceEmail: '',
    consent: false
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Check if user is authenticated
  if (!user) {
    navigate('/login', { state: { from: `/pets/${id}/apply` } });
    return null;
  }

  // Check if user is a regular user
  if (user.role !== 'user') {
    navigate('/browse');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('adoptionAddress.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        adoptionAddress: {
          ...prev.adoptionAddress,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateReferenceContact = () => {
    if (!formData.referencePhone && !formData.referenceEmail) {
      setErrors(prev => ({
        ...prev,
        referenceContact: 'Please provide either a phone number or email for your reference'
      }));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${API_URL}/applications`, {
        petId: id,
        formData
      });

      // Check if we have a response, regardless of the success property
      if (response.data) {
        setIsSubmitted(true);
        // Wait for 3 seconds before redirecting
        setTimeout(() => {
          navigate('/my-applications');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'An error occurred while submitting your application. Please try again.');
    }
  };

  const renderConfirmationStep = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        Please review your application details
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">Personal Information</Typography>
        <Typography>Name: {formData.applicantName}</Typography>
        <Typography>Address: {formData.adoptionAddress.street}, {formData.adoptionAddress.city}, {formData.adoptionAddress.postcode}</Typography>
        <Typography>Housing Status: {formData.housingStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Typography>
        <Typography>Secure Outdoor Space: {formData.hasSecureOutdoorSpace ? 'Yes' : 'No'}</Typography>
        <Typography>Number of Adults: {formData.numberOfAdults}</Typography>
        <Typography>Number of Children: {formData.numberOfChildren}</Typography>
        {formData.numberOfChildren > 0 && (
          <Typography>Children's Ages: {formData.childrenAges}</Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">Pet Experience</Typography>
        <Typography>Other Pets: {formData.hasOtherPets ? 'Yes' : 'No'}</Typography>
        {formData.hasOtherPets && (
          <Typography>Other Pets Details: {formData.otherPetsDetails}</Typography>
        )}
        <Typography>Work and Holiday Plans: {formData.workHolidayPlans}</Typography>
        <Typography>Animal Experience: {formData.animalExperience}</Typography>
        <Typography>Ideal Animal Personality: {formData.idealAnimalPersonality.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">Reference Information</Typography>
        <Typography>Reference Name: {formData.referenceName}</Typography>
        <Typography>Reference Phone: {formData.referencePhone}</Typography>
        <Typography>Reference Email: {formData.referenceEmail}</Typography>
      </Box>

      <Alert severity="info" sx={{ mt: 2 }}>
        Please review all information carefully before submitting. Once submitted, you will not be able to edit your application.
      </Alert>
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Adoption Application
        </Typography>

        {/* The Stepper component was removed as per the new_code, as it's not in the new_code. */}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {isSubmitted ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your application has been submitted successfully!
            </Alert>
            <Typography variant="h6" gutterBottom>
              Thank You for Your Application
            </Typography>
            <Typography paragraph>
              We appreciate your interest in adopting a pet. Our team will review your application and contact you soon.
            </Typography>
            <Typography>
              You will be redirected to your applications page in a few seconds...
            </Typography>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            {activeStep === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Full Name"
                  name="applicantName"
                  value={formData.applicantName}
                  onChange={handleChange}
                  required
                  fullWidth
                />

                <Typography variant="h6" gutterBottom>
                  Adoption Address
                </Typography>
                <TextField
                  label="Street Address"
                  name="adoptionAddress.street"
                  value={formData.adoptionAddress.street}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                <TextField
                  label="City"
                  name="adoptionAddress.city"
                  value={formData.adoptionAddress.city}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Postcode"
                  name="adoptionAddress.postcode"
                  value={formData.adoptionAddress.postcode}
                  onChange={handleChange}
                  required
                  fullWidth
                />

                <FormControl component="fieldset">
                  <InputLabel>Housing Status</InputLabel>
                  <Select
                    name="housingStatus"
                    value={formData.housingStatus}
                    onChange={handleChange}
                    required
                  >
                    <MenuItem value="homeowner">Homeowner</MenuItem>
                    <MenuItem value="renter_with_permission">Renter with Permission</MenuItem>
                    <MenuItem value="renter_without_permission">Renter without Permission</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      name="hasSecureOutdoorSpace"
                      checked={formData.hasSecureOutdoorSpace}
                      onChange={handleCheckboxChange}
                    />
                  }
                  label="I have a secure outdoor space"
                />

                <TextField
                  label="Number of Adults"
                  name="numberOfAdults"
                  type="number"
                  value={formData.numberOfAdults}
                  onChange={handleNumberChange}
                  required
                  fullWidth
                  inputProps={{ min: 0 }}
                />

                <TextField
                  label="Number of Children"
                  name="numberOfChildren"
                  type="number"
                  value={formData.numberOfChildren}
                  onChange={handleNumberChange}
                  required
                  fullWidth
                  inputProps={{ min: 0 }}
                />

                {formData.numberOfChildren > 0 && (
                  <TextField
                    label="Children's Ages"
                    name="childrenAges"
                    value={formData.childrenAges}
                    onChange={handleChange}
                    required
                    fullWidth
                    helperText="Please list the ages of all children in your household"
                  />
                )}
              </Box>
            )}

            {activeStep === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="hasOtherPets"
                      checked={formData.hasOtherPets}
                      onChange={handleCheckboxChange}
                    />
                  }
                  label="I have other pets"
                />

                {formData.hasOtherPets && (
                  <TextField
                    label="Other Pets Details"
                    name="otherPetsDetails"
                    value={formData.otherPetsDetails}
                    onChange={handleChange}
                    required
                    fullWidth
                    multiline
                    rows={4}
                    helperText="Please provide details about your other pets (species, ages, etc.)"
                  />
                )}

                <TextField
                  label="Work and Holiday Plans"
                  name="workHolidayPlans"
                  value={formData.workHolidayPlans}
                  onChange={handleChange}
                  required
                  fullWidth
                  multiline
                  rows={4}
                  helperText="Please describe your work schedule and how you plan to care for the pet during holidays"
                />

                <TextField
                  label="Animal Experience"
                  name="animalExperience"
                  value={formData.animalExperience}
                  onChange={handleChange}
                  required
                  fullWidth
                  multiline
                  rows={4}
                  helperText="Please describe your experience with animals, particularly with the species you're applying for"
                />

                <FormControl fullWidth>
                  <InputLabel>Ideal Animal Personality</InputLabel>
                  <Select
                    name="idealAnimalPersonality"
                    value={formData.idealAnimalPersonality}
                    onChange={handleChange}
                    required
                  >
                    <MenuItem value="relaxed">Relaxed</MenuItem>
                    <MenuItem value="playful">Playful</MenuItem>
                    <MenuItem value="shy">Shy</MenuItem>
                    <MenuItem value="adventurous">Adventurous</MenuItem>
                    <MenuItem value="water_lover">Water Lover</MenuItem>
                    <MenuItem value="independent">Independent</MenuItem>
                    <MenuItem value="cuddly">Cuddly</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {activeStep === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Reference Contact
                </Typography>
                <TextField
                  label="Reference Name"
                  name="referenceName"
                  value={formData.referenceName}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Reference Phone"
                  name="referencePhone"
                  value={formData.referencePhone}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Reference Email"
                  name="referenceEmail"
                  type="email"
                  value={formData.referenceEmail}
                  onChange={handleChange}
                  required
                  fullWidth
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      name="consent"
                      checked={formData.consent}
                      onChange={handleCheckboxChange}
                      required
                    />
                  }
                  label="I consent to the rescue contacting my reference and conducting a home visit if necessary"
                />
              </Box>
            )}

            {activeStep === 3 && renderConfirmationStep()}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!formData.consent}
                >
                  Submit Application
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </form>
        )}
      </Paper>
    </Container>
  );
} 