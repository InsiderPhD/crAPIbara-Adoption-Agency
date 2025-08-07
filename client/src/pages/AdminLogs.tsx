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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Pagination,
  CircularProgress,
  Grid,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

import { API_BASE_URL, API_URL } from '../config/api';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null;
}

const ACTION_COLORS: { [key: string]: string } = {
  login: 'success',
  logout: 'info',
  pet_created: 'primary',
  pet_updated: 'warning',
  pet_deleted: 'error',
  application_submitted: 'primary',
  application_approved: 'success',
  application_rejected: 'error',
  rescue_request_submitted: 'primary',
  rescue_request_approved: 'success',
  rescue_request_rejected: 'error',
  user_created: 'primary',
  user_updated: 'warning',
  user_deleted: 'error',
  pet_promotion_purchased: 'primary',
  photos_uploaded: 'info',
  pet_adopted: 'success',
  admin_user_updated: 'warning',
  admin_user_deleted: 'error',
  admin_pet_updated: 'warning',
  admin_pet_deleted: 'error',
  admin_application_approved: 'success',
  admin_application_rejected: 'error',
  admin_rescue_request_approved: 'success',
  admin_rescue_request_rejected: 'error',
};

const ACTION_LABELS: { [key: string]: string } = {
  login: 'User Login',
  logout: 'User Logout',
  pet_created: 'Pet Created',
  pet_updated: 'Pet Updated',
  pet_deleted: 'Pet Deleted',
  application_submitted: 'Application Submitted',
  application_approved: 'Application Approved',
  application_rejected: 'Application Rejected',
  rescue_request_submitted: 'Rescue Request Submitted',
  rescue_request_approved: 'Rescue Request Approved',
  rescue_request_rejected: 'Rescue Request Rejected',
  user_created: 'User Created',
  user_updated: 'User Updated',
  user_deleted: 'User Deleted',
  pet_promotion_purchased: 'Pet Promotion Purchased',
  photos_uploaded: 'Photos Uploaded',
  pet_adopted: 'Pet Adopted',
  admin_user_updated: 'Admin: User Updated',
  admin_user_deleted: 'Admin: User Deleted',
  admin_pet_updated: 'Admin: Pet Updated',
  admin_pet_deleted: 'Admin: Pet Deleted',
  admin_application_approved: 'Admin: Application Approved',
  admin_application_rejected: 'Admin: Application Rejected',
  admin_rescue_request_approved: 'Admin: Rescue Request Approved',
  admin_rescue_request_rejected: 'Admin: Rescue Request Rejected',
};

const ENTITY_TYPE_LABELS: { [key: string]: string } = {
  user: 'User',
  pet: 'Pet',
  application: 'Application',
  rescue_request: 'Rescue Request',
  transaction: 'Transaction',
};

export default function AdminLogs() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Fetch logs
  const { data: logsData, isLoading, error } = useQuery<{ data: AuditLog[]; pagination: any }>({
    queryKey: ['admin-logs', page, actionFilter, entityTypeFilter, userFilter, startDate, endDate],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (actionFilter) params.append('action', actionFilter);
      if (entityTypeFilter) params.append('entityType', entityTypeFilter);
      if (userFilter) params.append('userId', userFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await axios.get(`${API_URL}/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action] || 'default';
  };

  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action] || action;
  };

  const getEntityTypeLabel = (entityType: string | null) => {
    if (!entityType) return 'N/A';
    return ENTITY_TYPE_LABELS[entityType] || entityType;
  };

  const handleExpandLog = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const formatDetails = (details: any) => {
    if (!details) return 'No details available';
    
    try {
      // If details is a string, try to parse it as JSON for better formatting
      if (typeof details === 'string') {
        try {
          const parsed = JSON.parse(details);
          return JSON.stringify(parsed, null, 2);
        } catch {
          // If it's not valid JSON, return as is
          return details;
        }
      }
      
      // If it's already an object, stringify it nicely
      if (typeof details === 'object') {
        return JSON.stringify(details, null, 2);
      }
      
      return String(details);
    } catch (error) {
      return `Error formatting details: ${String(details)}`;
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
          Failed to load audit logs. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Audit Logs
      </Typography>
      
      {/* Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                select
                fullWidth
                label="Action Filter"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="login">User Login</MenuItem>
                <MenuItem value="logout">User Logout</MenuItem>
                <MenuItem value="pet_created">Pet Created</MenuItem>
                <MenuItem value="pet_updated">Pet Updated</MenuItem>
                <MenuItem value="pet_deleted">Pet Deleted</MenuItem>
                <MenuItem value="application_submitted">Application Submitted</MenuItem>
                <MenuItem value="application_approved">Application Approved</MenuItem>
                <MenuItem value="application_rejected">Application Rejected</MenuItem>
                <MenuItem value="rescue_request_submitted">Rescue Request Submitted</MenuItem>
                <MenuItem value="rescue_request_approved">Rescue Request Approved</MenuItem>
                <MenuItem value="rescue_request_rejected">Rescue Request Rejected</MenuItem>
                <MenuItem value="user_created">User Created</MenuItem>
                <MenuItem value="user_updated">User Updated</MenuItem>
                <MenuItem value="user_deleted">User Deleted</MenuItem>
                <MenuItem value="pet_promotion_purchased">Pet Promotion Purchased</MenuItem>
                <MenuItem value="photos_uploaded">Photos Uploaded</MenuItem>
                <MenuItem value="pet_adopted">Pet Adopted</MenuItem>
              </TextField>
            </Box>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                select
                fullWidth
                label="Entity Type Filter"
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Entity Types</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="pet">Pet</MenuItem>
                <MenuItem value="application">Application</MenuItem>
                <MenuItem value="rescue_request">Rescue Request</MenuItem>
                <MenuItem value="transaction">Transaction</MenuItem>
              </TextField>
            </Box>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                fullWidth
                label="User ID Filter"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Enter user ID"
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Logs: {logsData?.pagination?.total || 0}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity Type</TableCell>
              <TableCell>Entity ID</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell align="center">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logsData?.data.map((log) => (
              <React.Fragment key={log.id}>
                <TableRow>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(log.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {log.user.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.user.email}
                        </Typography>
                        <Chip 
                          label={log.user.role} 
                          size="small" 
                          color="primary" 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unknown User
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getActionLabel(log.action)} 
                      size="small" 
                      color={getActionColor(log.action) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getEntityTypeLabel(log.entityType)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {log.entityId || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {log.ipAddress || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleExpandLog(log.id)}
                        color="primary"
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                {expandedLog === log.id && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Accordion expanded={true} sx={{ boxShadow: 'none' }}>
                        <AccordionDetails>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Details:
                            </Typography>
                            <Typography 
                              variant="body2" 
                              component="pre" 
                              sx={{ 
                                fontSize: '0.875rem', 
                                whiteSpace: 'pre-wrap',
                                backgroundColor: 'grey.50',
                                padding: 1,
                                borderRadius: 1,
                                fontFamily: 'monospace'
                              }}
                            >
                              {formatDetails(log.details)}
                            </Typography>
                            {log.userAgent && (
                              <Box mt={2}>
                                <Typography variant="subtitle2" gutterBottom>
                                  User Agent:
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: '0.875rem',
                                    backgroundColor: 'grey.50',
                                    padding: 1,
                                    borderRadius: 1,
                                    fontFamily: 'monospace'
                                  }}
                                >
                                  {log.userAgent}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {logsData?.pagination && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={logsData.pagination.totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
} 
 