import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Spinner } from '@chakra-ui/react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    // Allow both admin and superadmin to have same permissions
    const allowedRoles = requiredRole === 'admin' ? ['admin', 'superadmin'] : [requiredRole];
    if (!allowedRoles.includes(user?.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

