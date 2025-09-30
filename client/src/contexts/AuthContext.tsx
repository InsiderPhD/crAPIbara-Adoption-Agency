import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

// Add axios response interceptor to handle authentication errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Axios interceptor: 401 error detected');
      // Don't automatically logout here - let the AuthContext handle it
    }
    return Promise.reject(error);
  }
);

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'rescue' | 'admin';
  rescueId?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  isInitializing: true,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('AuthContext: Initializing auth...');
      const token = localStorage.getItem('token');
      console.log('AuthContext: Token found:', !!token);
      console.log('AuthContext: Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'null');
      console.log('AuthContext: All localStorage keys:', Object.keys(localStorage));
      
      // Only initialize if we don't already have a user
      if (user) {
        console.log('AuthContext: User already exists, skipping initialization');
        setIsInitializing(false);
        return;
      }
      
      if (token) {
        try {
          // Set the token in axios defaults
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('AuthContext: Set Authorization header:', `Bearer ${token.substring(0, 50)}...`);
          
          // Test the axios configuration
          console.log('AuthContext: Current axios defaults:', axios.defaults.headers.common);
          
          // Fetch user profile
          console.log('AuthContext: Fetching user profile...');
          console.log('AuthContext: Making request to:', `${API_URL}/users/profile`);
          const response = await axios.get(`${API_URL}/users/profile`);
          console.log('AuthContext: Profile response received');
          console.log('AuthContext: Profile response:', response.data);
          // The user profile endpoint returns data directly with standardized API
          if (response.data) {
            const { id, username, email, role, rescueId } = response.data;
            console.log('AuthContext: Setting user from profile:', { id, username, email, role, rescueId });
            setUser({
              id,
              username,
              email,
              role,
              rescueId
            });
            setIsAuthenticated(true);
          } else {
            console.log('AuthContext: Profile response missing data:', response.data);
          }
        } catch (error: any) {
          console.error('Error fetching user profile:', error);
          console.error('Error status:', error.response?.status);
          console.error('Error message:', error.message);
          console.error('Error response data:', error.response?.data);
          console.error('Error response headers:', error.response?.headers);
          // Only logout if it's an authentication error (401) or if the user doesn't exist (404)
          if (error.response?.status === 401 || error.response?.status === 404) {
            console.log('Logging out due to authentication error');
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAuthenticated(false);
          } else {
            console.log('Not logging out - this is not an authentication error');
          }
          // For other errors (network issues, server errors), don't logout automatically
        }
      } else {
        console.log('AuthContext: No token found, setting isInitializing to false');
      }
      console.log('AuthContext: Finished initializing');
      setIsInitializing(false);
    };

    // Add a small delay to prevent race conditions with login
    const timeoutId = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timeoutId);
  }, []); // Keep empty dependency array

  const handleSetUser = (newUser: User | null) => {
    console.log('AuthContext: Setting user:', newUser);
    setUser(newUser);
    setIsAuthenticated(!!newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      // Clear all user-related data from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const logout = () => {
    handleSetUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, isAuthenticated, isInitializing, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 