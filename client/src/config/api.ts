// API Configuration Constants
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_VERSION = 'v1';
export const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

// Helper functions
export const getApiUrl = (endpoint: string) => `${API_URL}${endpoint}`;
export const getBaseUrl = () => API_BASE_URL; 