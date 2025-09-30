import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_VERSION = 'v1';
const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

// Export constants for use throughout the application
export const API_BASE_URL_EXPORT = API_BASE_URL;
export const API_VERSION_EXPORT = API_VERSION;
export const API_URL_EXPORT = API_URL;
export { API_BASE_URL };

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Handle standardized error responses
    if (error.response?.data?.result === 'error') {
      // Extract error message from standardized format
      const errorMessage = error.response.data.error_message || 'An error occurred';
      error.message = errorMessage;
    }
    
    return Promise.reject(error);
  }
);

// Health check function
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Helper function to get full API URL for a specific endpoint
export const getApiUrl = (endpoint: string) => `${API_URL}${endpoint}`;

// Helper function to get base URL (without API version) for external services
export const getBaseUrl = () => API_BASE_URL;

export default api; 