import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const logError = (context, error, additionalData = {}) => {
      const timestamp = new Date().toISOString();
      const errorLog = {
        timestamp,
        context,
        error: {
          message: error?.message || 'Unknown error',
          name: error?.name || 'Error',
          stack: error?.stack || 'No stack trace'
        },
        response: error?.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null,
        request: {
          url: error?.config?.url || 'unknown',
          method: error?.config?.method || 'unknown',
          ...additionalData
        }
      };
      
      console.error('='.repeat(80));
      console.error(`[FRONTEND ERROR] ${context} - ${timestamp}`);
      console.error(JSON.stringify(errorLog, null, 2));
      console.error('='.repeat(80));
    };

    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Check if response has the expected structure
      if (!response.data) {
        logError('Login - Invalid response structure', new Error('Response data is missing'), { email });
        return {
          success: false,
          message: 'Invalid response from server. Please try again.'
        };
      }

      const { token: newToken, user: userData } = response.data;
      
      // Validate token and user data
      if (!newToken || !userData) {
        logError('Login - Missing auth data', new Error('Token or user data missing from response'), { 
          email,
          hasToken: !!newToken,
          hasUserData: !!userData
        });
        return {
          success: false,
          message: 'Login successful but missing authentication data. Please try again.'
        };
      }
      
      const timestamp = new Date().toISOString();
      console.log(`[FRONTEND INFO] Login successful - ${timestamp}`, { email, userId: userData.id, role: userData.role });
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      // Handle network errors
      if (!error.response) {
        logError('Login - Network error', error, { 
          email,
          errorType: 'NETWORK_ERROR',
          message: 'No response from server'
        });
        return {
          success: false,
          message: 'Unable to connect to server. Please check your internet connection and try again.'
        };
      }

      // Handle different HTTP status codes
      const status = error.response?.status;
      const errorData = error.response?.data;

      if (status === 401) {
        logError('Login - Authentication failed', error, { 
          email,
          errorType: 'AUTH_FAILED',
          statusCode: 401
        });
        return {
          success: false,
          message: errorData?.message || 'Invalid email or password. Please check your credentials and try again.'
        };
      }

      if (status === 400) {
        logError('Login - Bad request', error, { 
          email,
          errorType: 'BAD_REQUEST',
          statusCode: 400
        });
        return {
          success: false,
          message: errorData?.message || 'Please provide both email and password.'
        };
      }

      if (status === 500) {
        logError('Login - Server error', error, { 
          email,
          errorType: 'SERVER_ERROR',
          statusCode: 500
        });
        return {
          success: false,
          message: errorData?.message || 'Server error. Please try again later.'
        };
      }

      // Handle other errors
      logError('Login - Unexpected error', error, { 
        email,
        errorType: 'UNEXPECTED',
        statusCode: status || 'unknown'
      });
      return {
        success: false,
        message: errorData?.message || error.message || 'Login failed. Please try again.'
      };
    }
  };

  const sendRegistrationOtp = async (email) => {
    try {
      const response = await api.post('/auth/register/send-otp', { email });
      return {
        success: response.data.success,
        requestId: response.data.requestId,
        expiresInMinutes: response.data.expiresInMinutes,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP'
      };
    }
  };

  const verifyRegistrationOtp = async (requestId, otp) => {
    try {
      // The backend verifies OTP during registration, but we can verify it separately first
      // For now, we'll just store the OTP and requestId to use during registration
      // The actual verification happens in the register endpoint
      return {
        success: true,
        message: 'OTP will be verified during registration'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify OTP'
      };
    }
  };

  const register = async (name, email, password, role, otpRequestId, otp) => {
    try {
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        role,
        otpRequestId,
        otp
      });
      
      if (response.data && response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        if (newToken && userData) {
          setToken(newToken);
          setUser(userData);
          localStorage.setItem('token', newToken);
          localStorage.setItem('user', JSON.stringify(userData));
          
          return { success: true, user: userData };
        } else {
          return {
            success: false,
            message: 'Registration successful but missing token or user data'
          };
        }
      } else {
        return {
          success: false,
          message: response.data?.message || 'Registration failed - invalid response'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Registration failed. Please check your connection and try again.';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const sendPasswordResetOtp = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password/send-otp', { email });
      return {
        success: response.data.success,
        requestId: response.data.requestId,
        expiresInMinutes: response.data.expiresInMinutes,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP'
      };
    }
  };

  const forgotPassword = async (email) => {
    // Alias for sendPasswordResetOtp for backward compatibility
    return sendPasswordResetOtp(email);
  };

  const resetPassword = async (otpRequestId, otp, password) => {
    try {
      const response = await api.post('/auth/reset-password', { 
        otpRequestId, 
        otp, 
        password 
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reset password'
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    sendRegistrationOtp,
    verifyRegistrationOtp,
    register,
    logout,
    sendPasswordResetOtp,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isPlacementDirector: user?.role === 'placement_director'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

