import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { getErrorMessage } from '../utils/errorHandler';

interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
  lastLogin?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phoneNumber?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/auth/me`);
          setUser(response.data.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          // Token might be expired
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user: userData, token: authToken } = response.data.data;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Login failed');
    }
  };

  const register = async (email: string, password: string, fullName: string, phoneNumber?: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { 
        email, 
        password, 
        fullName, 
        phoneNumber 
      });
      const { user: userData, token: authToken } = response.data.data;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Registration failed');
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      console.log('Attempting Google login with credential');
      console.log('API URL:', API_URL);
      
      const response = await axios.post(`${API_URL}/auth/google`, { credential }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      
      console.log('Google login response:', response.data);
      
      const { user: userData, token: authToken } = response.data.data;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(userData);
      
      console.log('Google login successful');
    } catch (error) {
      console.error('Google login error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Request config:', error.config);
      }
      throw new Error(getErrorMessage(error) || 'Google login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const response = await axios.get(`${API_URL}/auth/me`);
        setUser(response.data.data);
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
