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
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Pets as PetsIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  LocationOn as LocationIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

import { API_BASE_URL, API_URL } from '../config/api';

interface Rescue {
  id: string;
  name: string;
  location: string;
  contactEmail: string;
  description: string | null;
  websiteUrl: string | null;
  registrationNumber: string | null;
  createdAt: string;
  updatedAt: string;
  users: {
    id: string;
    username: string;
    email: string;
    role: string;
  }[];
  pets: {
    id: string;
    name: string;
    isAdopted: boolean;
  }[];
}

interface RescueFormData {
  name: string;
  location: string;
  contactEmail: string;
  description: string;
  websiteUrl: string;
  registrationNumber: string;
}

interface RescueRequest {
  id: string;
  status: string;
  requestDate: string;
  adminNotes?: string;
  user: {
    id: string;
    username: string;
    email: string;
    profileInfo?: string;
  };
  rescueName: string;
  rescueDescription: string;
  location: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  socialMedia?: string;
  experience: string;
  capacity: string;
  facilities: string;
  vetInfo: string;
  adoptionProcess: string;
  additionalInfo?: string;
}

interface ApprovalFormData {
  adminNotes: string;
}

interface CreateRescueFormData {
  name: string;
  location: string;
  contactEmail: string;
  description: string;
  websiteUrl: string;
  registrationNumber: string;
  userId: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rescue-tabpanel-${index}`}
      aria-labelledby={`rescue-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminRescueManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  
  // Rescue Management State
  const [rescuePage, setRescuePage] = useState(1);
  const [rescueSearch, setRescueSearch] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRescue, setSelectedRescue] = useState<Rescue | null>(null);
  const [rescueFormData, setRescueFormData] = useState<RescueFormData>({
    name: '',
    location: '',
    contactEmail: '',
    description: '',
    websiteUrl: '',
    registrationNumber: '',
  });

  // Rescue Requests State
  const [requestPage, setRequestPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RescueRequest | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalFormData, setApprovalFormData] = useState<ApprovalFormData>({
    adminNotes: '',
  });

  // Create Rescue State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateRescueFormData>({
    name: '',
    location: '',
    contactEmail: '',
    description: '',
    websiteUrl: '',
    registrationNumber: '',
    userId: '',
  });

  // Add user to rescue state
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedRescueForUser, setSelectedRescueForUser] = useState<Rescue | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Fetch rescues
  const { data: rescuesData, isLoading: rescuesLoading, error: rescuesError } = useQuery<{ data: Rescue[]; pagination: any }>({
    queryKey: ['admin-rescues', rescuePage, rescueSearch],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const params = new URLSearchParams();
      if (rescuePage) params.append('page', rescuePage.toString());
      if (rescueSearch) params.append('search', rescueSearch);
      
      const response = await axios.get(`${API_URL}/admin/rescues?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch rescue requests
  const { data: requestsData, isLoading: requestsLoading, error: requestsError } = useQuery<{ data: RescueRequest[]; pagination: any }>({
    queryKey: ['admin-rescue-requests', requestPage, statusFilter, requestSearch],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const params = new URLSearchParams();
      if (requestPage) params.append('page', requestPage.toString());
      if (statusFilter) params.append('status', statusFilter);
      if (requestSearch) params.append('search', requestSearch);
      
      const response = await axios.get(`${API_URL}/admin/rescue-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch users for create rescue form
  const { data: usersData } = useQuery<{ data: User[] }>({
    queryKey: ['admin-users-for-rescue'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.get(`${API_URL}/admin/users?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
  });

  // Update rescue mutation
  const updateRescueMutation = useMutation({
    mutationFn: async ({ rescueId, data }: { rescueId: string; data: Partial<RescueFormData> }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.put(`${API_URL}/admin/rescues/${rescueId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rescues'] });
      setEditDialogOpen(false);
      setSelectedRescue(null);
    },
  });

  // Delete rescue mutation
  const deleteRescueMutation = useMutation({
    mutationFn: async (rescueId: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.delete(`${API_URL}/admin/rescues/${rescueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rescues'] });
    },
  });

  // Approve rescue request mutation
  const approveRequestMutation = useMutation({
    mutationFn: async ({ requestId, adminNotes }: { requestId: string; adminNotes: string }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.put(`${API_URL}/admin/rescue-requests/${requestId}/approve`, {
        adminNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rescue-requests'] });
      setApprovalDialogOpen(false);
      setSelectedRequest(null);
      setApprovalFormData({ adminNotes: '' });
    },
  });

  // Reject rescue request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, adminNotes }: { requestId: string; adminNotes: string }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.put(`${API_URL}/admin/rescue-requests/${requestId}/reject`, {
        adminNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rescue-requests'] });
      setApprovalDialogOpen(false);
      setSelectedRequest(null);
      setApprovalFormData({ adminNotes: '' });
    },
  });

  // Create rescue mutation
  const createRescueMutation = useMutation({
    mutationFn: async (data: CreateRescueFormData) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.post(`${API_URL}/admin/rescues`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rescues'] });
      setCreateDialogOpen(false);
      setCreateFormData({
        name: '',
        location: '',
        contactEmail: '',
        description: '',
        websiteUrl: '',
        registrationNumber: '',
        userId: '',
      });
    },
  });

  // Add user to rescue mutation
  const addUserToRescueMutation = useMutation({
    mutationFn: async ({ rescueId, userId }: { rescueId: string; userId: string }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await axios.put(`${API_URL}/admin/users/${userId}`, {
        rescueId,
        role: 'rescue'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rescues'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAddUserDialogOpen(false);
      setSelectedUserId('');
      setSelectedRescueForUser(null);
    },
  });

  // Rescue Management Handlers
  const handleEditRescue = (rescue: Rescue) => {
    setSelectedRescue(rescue);
    setRescueFormData({
      name: rescue.name,
      location: rescue.location,
      contactEmail: rescue.contactEmail,
      description: rescue.description || '',
      websiteUrl: rescue.websiteUrl || '',
      registrationNumber: rescue.registrationNumber || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateRescue = () => {
    if (!selectedRescue) return;
    
    updateRescueMutation.mutate({
      rescueId: selectedRescue.id,
      data: rescueFormData,
    });
  };

  const handleDeleteRescue = (rescueId: string) => {
    if (window.confirm('Are you sure you want to delete this rescue? This action cannot be undone and will also delete all associated pets and users.')) {
      deleteRescueMutation.mutate(rescueId);
    }
  };

  // Rescue Request Handlers
  const handleViewRequest = (request: RescueRequest) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleApproveRequest = (request: RescueRequest) => {
    setSelectedRequest(request);
    setApprovalAction('approve');
    setApprovalDialogOpen(true);
  };

  const handleRejectRequest = (request: RescueRequest) => {
    setSelectedRequest(request);
    setApprovalAction('reject');
    setApprovalDialogOpen(true);
  };

  const handleSubmitApproval = () => {
    if (!selectedRequest) return;
    
    if (approvalAction === 'approve') {
      approveRequestMutation.mutate({
        requestId: selectedRequest.id,
        adminNotes: approvalFormData.adminNotes,
      });
    } else {
      rejectRequestMutation.mutate({
        requestId: selectedRequest.id,
        adminNotes: approvalFormData.adminNotes,
      });
    }
  };

  // Create Rescue Handlers
  const handleCreateRescue = () => {
    createRescueMutation.mutate(createFormData);
  };

  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  // Add user to rescue handlers
  const handleAddUserToRescue = (rescue: Rescue) => {
    setSelectedRescueForUser(rescue);
    setSelectedUserId('');
    setAddUserDialogOpen(true);
  };

  const handleSubmitAddUser = () => {
    if (!selectedRescueForUser || !selectedUserId) return;
    
    addUserToRescueMutation.mutate({
      rescueId: selectedRescueForUser.id,
      userId: selectedUserId,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseProfileInfo = (profileInfo?: string) => {
    if (!profileInfo) return {};
    try {
      return JSON.parse(profileInfo);
    } catch {
      return {};
    }
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
        Rescue Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage rescue organizations and review rescue requests.
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Rescue Organizations" />
          <Tab label="Rescue Requests" />
          <Tab label="Create Rescue" />
        </Tabs>
      </Box>

      {/* Rescue Organizations Tab */}
      <TabPanel value={tabValue} index={0}>
        {rescuesLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : rescuesError ? (
          <Alert severity="error">
            Error loading rescues: {rescuesError instanceof Error ? rescuesError.message : 'Unknown error'}
          </Alert>
        ) : (
          <>
            {/* Search and Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ flex: 1, minWidth: 300 }}>
                    <TextField
                      fullWidth
                      label="Search Rescues"
                      value={rescueSearch}
                      onChange={(e) => setRescueSearch(e.target.value)}
                      placeholder="Search by name, location, or email..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {rescuesData?.pagination?.total || 0} total rescues
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Rescues Table */}
            <Card>
              <CardContent>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Rescue Name</strong></TableCell>
                        <TableCell><strong>Location</strong></TableCell>
                        <TableCell><strong>Contact</strong></TableCell>
                        <TableCell><strong>Users</strong></TableCell>
                        <TableCell><strong>Pets</strong></TableCell>
                        <TableCell><strong>Created</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rescuesData?.data?.map((rescue) => (
                        <TableRow key={rescue.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {rescue.name}
                              </Typography>
                              {rescue.registrationNumber && (
                                <Typography variant="caption" color="text.secondary">
                                  Reg: {rescue.registrationNumber}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              {rescue.location}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Box display="flex" alignItems="center">
                                <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                {rescue.contactEmail}
                              </Box>
                              {rescue.websiteUrl && (
                                <Link href={rescue.websiteUrl} target="_blank" rel="noopener" variant="caption">
                                  <Box display="flex" alignItems="center">
                                    <LanguageIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    Website
                                  </Box>
                                </Link>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<PersonIcon />}
                              label={`${rescue.users.length} users`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<PetsIcon />}
                              label={`${rescue.pets.length} pets`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(rescue.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="Edit Rescue">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditRescue(rescue)}
                                  color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Add User to Rescue">
                                <IconButton
                                  size="small"
                                  onClick={() => handleAddUserToRescue(rescue)}
                                  color="secondary"
                                >
                                  <PersonAddIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Rescue">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteRescue(rescue.id)}
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
                {rescuesData?.pagination && rescuesData.pagination.totalPages > 1 && (
                  <Box display="flex" justifyContent="center" mt={3}>
                    <Pagination
                      count={rescuesData.pagination.totalPages}
                      page={rescuePage}
                      onChange={(_, value) => setRescuePage(value)}
                      color="primary"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </TabPanel>

      {/* Rescue Requests Tab */}
      <TabPanel value={tabValue} index={1}>
        {requestsLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : requestsError ? (
          <Alert severity="error">
            Error loading rescue requests: {requestsError instanceof Error ? requestsError.message : 'Unknown error'}
          </Alert>
        ) : (
          <>
            {/* Search and Filter Controls */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ flex: 1, minWidth: 300 }}>
                    <TextField
                      fullWidth
                      label="Search requests"
                      value={requestSearch}
                      onChange={(e) => setRequestSearch(e.target.value)}
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
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Status Filter"
                      >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Requests: {requestsData?.pagination?.total || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Requests Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Rescue Name</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Request Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requestsData?.data.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {request.user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.user.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {request.rescueName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.location}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status} 
                          size="small" 
                          color={getStatusColor(request.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(request.requestDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewRequest(request)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {request.status === 'pending' && (
                          <>
                            <Tooltip title="Approve Request">
                              <IconButton
                                size="small"
                                onClick={() => handleApproveRequest(request)}
                                color="success"
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Request">
                              <IconButton
                                size="small"
                                onClick={() => handleRejectRequest(request)}
                                color="error"
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {requestsData?.pagination && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={requestsData.pagination.totalPages}
                  page={requestPage}
                  onChange={(_, value) => setRequestPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
                 )}
       </TabPanel>

       {/* Create Rescue Tab */}
       <TabPanel value={tabValue} index={2}>
         <Card>
           <CardContent>
             <Typography variant="h6" gutterBottom>
               Create New Rescue Organization
             </Typography>
             <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
               Create a new rescue organization and associate it with a specific user. The selected user will be promoted to rescue role.
             </Typography>
             
             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
               <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                 <TextField
                   fullWidth
                   label="Rescue Name"
                   value={createFormData.name}
                   onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                   required
                   sx={{ flex: 1, minWidth: 300 }}
                 />
                 <TextField
                   fullWidth
                   label="Location"
                   value={createFormData.location}
                   onChange={(e) => setCreateFormData({ ...createFormData, location: e.target.value })}
                   required
                   sx={{ flex: 1, minWidth: 300 }}
                 />
               </Box>
               
               <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                 <TextField
                   fullWidth
                   label="Contact Email"
                   type="email"
                   value={createFormData.contactEmail}
                   onChange={(e) => setCreateFormData({ ...createFormData, contactEmail: e.target.value })}
                   required
                   sx={{ flex: 1, minWidth: 300 }}
                 />
                 <TextField
                   fullWidth
                   label="Registration Number"
                   value={createFormData.registrationNumber}
                   onChange={(e) => setCreateFormData({ ...createFormData, registrationNumber: e.target.value })}
                   sx={{ flex: 1, minWidth: 300 }}
                 />
               </Box>
               
               <TextField
                 fullWidth
                 label="Website URL"
                 value={createFormData.websiteUrl}
                 onChange={(e) => setCreateFormData({ ...createFormData, websiteUrl: e.target.value })}
                 placeholder="https://example.com"
               />
               
               <TextField
                 fullWidth
                 label="Description"
                 value={createFormData.description}
                 onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                 multiline
                 rows={3}
               />
               
               <FormControl fullWidth>
                 <InputLabel>Associate User</InputLabel>
                 <Select
                   value={createFormData.userId}
                   onChange={(e) => setCreateFormData({ ...createFormData, userId: e.target.value })}
                   label="Associate User"
                   required
                 >
                   <MenuItem value="">
                     <em>Select a user to associate with this rescue</em>
                   </MenuItem>
                   {usersData?.data?.filter(user => user.role === 'user').map((user) => (
                     <MenuItem key={user.id} value={user.id}>
                       {user.username} ({user.email})
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
               
               <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                 <Button
                   variant="contained"
                   onClick={handleCreateRescue}
                   disabled={createRescueMutation.isPending || !createFormData.name || !createFormData.location || !createFormData.contactEmail || !createFormData.userId}
                 >
                   {createRescueMutation.isPending ? <CircularProgress size={20} /> : 'Create Rescue'}
                 </Button>
               </Box>
             </Box>
           </CardContent>
         </Card>
       </TabPanel>

       {/* Edit Rescue Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Rescue</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Rescue Name"
                value={rescueFormData.name}
                onChange={(e) => setRescueFormData({ ...rescueFormData, name: e.target.value })}
                required
                sx={{ flex: 1, minWidth: 300 }}
              />
              <TextField
                fullWidth
                label="Location"
                value={rescueFormData.location}
                onChange={(e) => setRescueFormData({ ...rescueFormData, location: e.target.value })}
                required
                sx={{ flex: 1, minWidth: 300 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={rescueFormData.contactEmail}
                onChange={(e) => setRescueFormData({ ...rescueFormData, contactEmail: e.target.value })}
                required
                sx={{ flex: 1, minWidth: 300 }}
              />
              <TextField
                fullWidth
                label="Registration Number"
                value={rescueFormData.registrationNumber}
                onChange={(e) => setRescueFormData({ ...rescueFormData, registrationNumber: e.target.value })}
                sx={{ flex: 1, minWidth: 300 }}
              />
            </Box>
            <TextField
              fullWidth
              label="Website URL"
              value={rescueFormData.websiteUrl}
              onChange={(e) => setRescueFormData({ ...rescueFormData, websiteUrl: e.target.value })}
              placeholder="https://example.com"
            />
            <TextField
              fullWidth
              label="Description"
              value={rescueFormData.description}
              onChange={(e) => setRescueFormData({ ...rescueFormData, description: e.target.value })}
              multiline
              rows={3}
            />

            {/* Selected Rescue Details */}
            {selectedRescue && (
              <Box mt={3}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Rescue Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 300 }}>
                        <Typography variant="subtitle2" gutterBottom>Users ({selectedRescue.users.length})</Typography>
                        {selectedRescue.users.map((user) => (
                          <Chip
                            key={user.id}
                            label={`${user.username} (${user.email})`}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 300 }}>
                        <Typography variant="subtitle2" gutterBottom>Pets ({selectedRescue.pets.length})</Typography>
                        {selectedRescue.pets.map((pet) => (
                          <Chip
                            key={pet.id}
                            label={`${pet.name} ${pet.isAdopted ? '(Adopted)' : ''}`}
                            size="small"
                            color={pet.isAdopted ? 'success' : 'default'}
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateRescue}
            variant="contained"
            disabled={updateRescueMutation.isPending}
          >
            {updateRescueMutation.isPending ? <CircularProgress size={20} /> : 'Update Rescue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Request Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Rescue Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* User Information */}
                <Box>
                  <Typography variant="h6" gutterBottom>User Information</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2">Username</Typography>
                      <Typography variant="body2">{selectedRequest.user.username}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2">Email</Typography>
                      <Typography variant="body2">{selectedRequest.user.email}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Rescue Information */}
                <Box>
                  <Typography variant="h6" gutterBottom>Rescue Information</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2">Rescue Name</Typography>
                      <Typography variant="body2">{selectedRequest.rescueName}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2">Location</Typography>
                      <Typography variant="body2">{selectedRequest.location}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Description</Typography>
                    <Typography variant="body2">{selectedRequest.rescueDescription}</Typography>
                  </Box>
                </Box>

                {/* Contact Information */}
                <Box>
                  <Typography variant="h6" gutterBottom>Contact Information</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2">Contact Email</Typography>
                      <Typography variant="body2">{selectedRequest.contactEmail}</Typography>
                    </Box>
                    {selectedRequest.contactPhone && (
                      <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="subtitle2">Contact Phone</Typography>
                        <Typography variant="body2">{selectedRequest.contactPhone}</Typography>
                      </Box>
                    )}
                  </Box>
                  {selectedRequest.website && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Website</Typography>
                      <Link href={selectedRequest.website} target="_blank" rel="noopener">
                        {selectedRequest.website}
                      </Link>
                    </Box>
                  )}
                  {selectedRequest.socialMedia && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Social Media</Typography>
                      <Typography variant="body2">{selectedRequest.socialMedia}</Typography>
                    </Box>
                  )}
                </Box>

                {/* Experience and Capacity */}
                <Box>
                  <Typography variant="h6" gutterBottom>Experience & Capacity</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2">Experience</Typography>
                      <Typography variant="body2">{selectedRequest.experience}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2">Capacity</Typography>
                      <Typography variant="body2">{selectedRequest.capacity}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Facilities and Vet Info */}
                <Box>
                  <Typography variant="h6" gutterBottom>Facilities & Veterinary Care</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2">Facilities</Typography>
                      <Typography variant="body2">{selectedRequest.facilities}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2">Veterinary Information</Typography>
                      <Typography variant="body2">{selectedRequest.vetInfo}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Adoption Process */}
                <Box>
                  <Typography variant="h6" gutterBottom>Adoption Process</Typography>
                  <Typography variant="body2">{selectedRequest.adoptionProcess}</Typography>
                </Box>

                {/* Additional Information */}
                {selectedRequest.additionalInfo && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Additional Information</Typography>
                    <Typography variant="body2">{selectedRequest.additionalInfo}</Typography>
                  </Box>
                )}

                {/* Request Status */}
                <Box>
                  <Typography variant="h6" gutterBottom>Request Status</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2">Status</Typography>
                      <Chip 
                        label={selectedRequest.status} 
                        color={getStatusColor(selectedRequest.status) as any}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2">Request Date</Typography>
                      <Typography variant="body2">{formatDate(selectedRequest.requestDate)}</Typography>
                    </Box>
                  </Box>
                  {selectedRequest.adminNotes && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Admin Notes</Typography>
                      <Typography variant="body2">{selectedRequest.adminNotes}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {approvalAction === 'approve' ? 'Approve Rescue Request' : 'Reject Rescue Request'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Admin Notes"
              value={approvalFormData.adminNotes}
              onChange={(e) => setApprovalFormData({ ...approvalFormData, adminNotes: e.target.value })}
              multiline
              rows={4}
              placeholder="Add notes about this decision..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitApproval}
            variant="contained"
            color={approvalAction === 'approve' ? 'success' : 'error'}
            disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
          >
            {approveRequestMutation.isPending || rejectRequestMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              approvalAction === 'approve' ? 'Approve Request' : 'Reject Request'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User to Rescue Dialog */}
      <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add User to Rescue</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {selectedRescueForUser && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Adding user to: <strong>{selectedRescueForUser.name}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current users: {selectedRescueForUser.users.length}
                  </Typography>
                </Box>
                
                <FormControl fullWidth>
                  <InputLabel>Select User</InputLabel>
                  <Select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    label="Select User"
                    required
                  >
                    <MenuItem value="">
                      <em>Select a user to add to this rescue</em>
                    </MenuItem>
                    {usersData?.data?.filter(user => user.role === 'user' && !selectedRescueForUser.users.some(rescueUser => rescueUser.id === user.id)).map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {selectedRescueForUser.users.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Current Users:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedRescueForUser.users.map((user) => (
                        <Chip
                          key={user.id}
                          label={`${user.username} (${user.email})`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitAddUser}
            variant="contained"
            disabled={addUserToRescueMutation.isPending || !selectedUserId}
          >
            {addUserToRescueMutation.isPending ? <CircularProgress size={20} /> : 'Add User to Rescue'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 
 