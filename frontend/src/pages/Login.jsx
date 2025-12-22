import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors({ ...fieldErrors, email: '' });
    }
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors({ ...fieldErrors, password: '' });
    }
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (result && result.success) {
        // Clear any previous errors
        setError('');
        console.log(`[LOGIN PAGE] Login successful for ${email.trim()}`);
        navigate('/dashboard');
      } else {
        // Handle login failure
        const errorMessage = result?.message || 'Login failed. Please check your credentials and try again.';
        setError(errorMessage);
        
        const timestamp = new Date().toISOString();
        console.error('='.repeat(80));
        console.error(`[LOGIN PAGE ERROR] Login failed - ${timestamp}`);
        console.error(JSON.stringify({
          timestamp,
          email: email.trim(),
          errorMessage,
          result
        }, null, 2));
        console.error('='.repeat(80));
      }
    } catch (err) {
      // Handle unexpected errors
      const timestamp = new Date().toISOString();
      const errorLog = {
        timestamp,
        context: 'Login page - unexpected error',
        email: email.trim(),
        error: {
          message: err?.message || 'Unknown error',
          name: err?.name || 'Error',
          stack: err?.stack || 'No stack trace'
        },
        response: err?.response ? {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        } : null
      };
      
      console.error('='.repeat(80));
      console.error(`[LOGIN PAGE ERROR] Unexpected error - ${timestamp}`);
      console.error(JSON.stringify(errorLog, null, 2));
      console.error('='.repeat(80));
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (!err?.response) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      w="100%"
      minH="100vh"
      bg="#172e36"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={8}
      px={4}
      position="relative"
    >
      <Box
        maxW="md"
        w="100%"
        bg="white"
        borderRadius="2xl"
        boxShadow="2xl"
        p={10}
        border="1px solid"
        borderColor="gray.100"
        position="relative"
        zIndex={1}
        className="fade-in"
      >
        <VStack spacing={8}>
          <Box textAlign="center" w="100%">
            <Heading 
              as="h1" 
              size="xl" 
              color="#d1a85d"
              fontWeight="bold"
              mb={2}
            >
              Welcome Back
            </Heading>
            <Text color="gray.600" fontSize="md">
              Sign in to your account to continue
            </Text>
          </Box>

          {error && (
            <Box
              bg="red.50"
              border="1px solid"
              borderColor="red.200"
              borderRadius="xl"
              p={4}
              w="100%"
              boxShadow="sm"
              className="slide-in"
            >
              <Text color="red.700" fontSize="sm" fontWeight="600">
                {error}
              </Text>
            </Box>
          )}

          <Box as="form" onSubmit={handleSubmit} w="100%">
            <VStack spacing={4}>
              <Box w="100%">
                <Text mb={2} color="gray.700" fontSize="sm" fontWeight="600">
                  Email Address
                </Text>
                <Input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="you@example.com"
                  size="md"
                  h="48px"
                  borderColor={fieldErrors.email ? 'red.400' : 'gray.300'}
                  color="gray.800"
                  bg="white"
                  borderRadius="xl"
                  _placeholder={{ color: 'gray.400' }}
                  _hover={{ 
                    borderColor: fieldErrors.email ? 'red.500' : '#d1a85d',
                    bg: 'white',
                    boxShadow: 'sm'
                  }}
                  _focus={{
                    borderColor: fieldErrors.email ? 'red.500' : '#d1a85d',
                    boxShadow: fieldErrors.email ? '0 0 0 3px rgba(252, 129, 129, 0.2)' : '0 0 0 3px rgba(209, 168, 93, 0.2)',
                    bg: 'white'
                  }}
                  transition="all 0.2s"
                  required
                />
                {fieldErrors.email && (
                  <Text color="red.500" fontSize="xs" mt={1.5} ml={1}>
                    {fieldErrors.email}
                  </Text>
                )}
              </Box>

              <Box w="100%">
                <Text mb={2} color="gray.700" fontSize="sm" fontWeight="600">
                  Password
                </Text>
                <Input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  size="md"
                  h="48px"
                  borderColor={fieldErrors.password ? 'red.400' : 'gray.300'}
                  color="gray.800"
                  bg="white"
                  borderRadius="xl"
                  _placeholder={{ color: 'gray.400' }}
                  _hover={{ 
                    borderColor: fieldErrors.password ? 'red.500' : '#d1a85d',
                    bg: 'white',
                    boxShadow: 'sm'
                  }}
                  _focus={{
                    borderColor: fieldErrors.password ? 'red.500' : '#d1a85d',
                    boxShadow: fieldErrors.password ? '0 0 0 3px rgba(252, 129, 129, 0.2)' : '0 0 0 3px rgba(209, 168, 93, 0.2)',
                    bg: 'white'
                  }}
                  transition="all 0.2s"
                  required
                />
                {fieldErrors.password && (
                  <Text color="red.500" fontSize="xs" mt={1.5} ml={1}>
                    {fieldErrors.password}
                  </Text>
                )}
              </Box>

              <Box w="100%" textAlign="right">
                <Link to="/forgot-password">
                  <Text
                    color="#d1a85d"
                    fontSize="sm"
                    fontWeight="500"
                    _hover={{ color: '#c19a4d', textDecoration: 'underline' }}
                    transition="color 0.2s"
                  >
                    Forgot Password?
                  </Text>
                </Link>
              </Box>

              <Button
                type="submit"
                size="lg"
                w="100%"
                h="52px"
                isLoading={loading}
                loadingText="Signing in..."
                bg="#d1a85d"
                color="white"
                fontWeight="600"
                borderRadius="xl"
                boxShadow="md"
                _hover={{ 
                  bg: "#c19a4d",
                  boxShadow: "lg",
                  transform: "translateY(-2px)"
                }}
                _active={{
                  transform: "translateY(0)"
                }}
                isDisabled={loading}
                transition="all 0.2s"
              >
                Sign In
              </Button>
            </VStack>
          </Box>

        </VStack>
      </Box>
    </Box>
  );
};

export default Login;
