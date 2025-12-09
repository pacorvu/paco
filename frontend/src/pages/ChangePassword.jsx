import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Input,
  Button,
  Text,
  VStack,
  HStack,
  useColorModeValue,
  FormControl,
  FormLabel,
  FormErrorMessage
} from '@chakra-ui/react';
import AdminLayout from '../components/AdminLayout';
import api from '../utils/api';

const ChangePassword = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setFetching(true);
      const response = await api.get(`/users/${id}`);
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        setError('Failed to fetch user details');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load user');
    } finally {
      setFetching(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.put(`/users/${id}/password`, { password });
      if (response.data.success) {
        setSuccess('Password updated successfully!');
        setTimeout(() => {
          navigate('/users');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to update password');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AdminLayout>
        <Box
          w="100%"
          minH="calc(100vh - 72px)"
          bg="#172e36"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text color="white">Loading...</Text>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box
        w="100%"
        minH="calc(100vh - 72px)"
        bg="#172e36"
        display="flex"
        alignItems="center"
        justifyContent="center"
        py={8}
        px={4}
      >
        <Container maxW="md">
          <Box
            bg={cardBg}
            borderRadius="2xl"
            boxShadow="2xl"
            p={10}
            border="1px solid"
            borderColor={borderColor}
          >
            <VStack spacing={8} align="stretch">
              <Box textAlign="center">
                <Heading size="xl" color="#d1a85d" fontWeight="bold" mb={2}>
                  Change Password
                </Heading>
                {user && (
                  <Text color="gray.600" fontSize="md">
                    {user.name} ({user.email})
                  </Text>
                )}
              </Box>

              {error && (
                <Box
                  bg="red.50"
                  border="1px solid"
                  borderColor="red.200"
                  borderRadius="lg"
                  p={4}
                >
                  <Text color="red.700" fontSize="sm">
                    {error}
                  </Text>
                </Box>
              )}

              {success && (
                <Box
                  bg="green.50"
                  border="1px solid"
                  borderColor="green.200"
                  borderRadius="lg"
                  p={4}
                >
                  <Text color="green.700" fontSize="sm">
                    {success}
                  </Text>
                </Box>
              )}

              <Box as="form" onSubmit={handleSubmit}>
                <VStack spacing={5}>
                  <FormControl isInvalid={!!fieldErrors.password}>
                    <FormLabel color="gray.700" fontSize="sm" fontWeight="600">
                      New Password
                    </FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors({ ...fieldErrors, password: '' });
                        }
                      }}
                      placeholder="Enter new password"
                      size="md"
                      h="48px"
                      borderColor={fieldErrors.password ? 'red.400' : 'gray.300'}
                      borderRadius="xl"
                      _hover={{
                        borderColor: fieldErrors.password ? 'red.500' : '#d1a85d'
                      }}
                      _focus={{
                        borderColor: fieldErrors.password ? 'red.500' : '#d1a85d',
                        boxShadow: fieldErrors.password
                          ? '0 0 0 3px rgba(252, 129, 129, 0.2)'
                          : '0 0 0 3px rgba(209, 168, 93, 0.2)'
                      }}
                    />
                    <FormErrorMessage>{fieldErrors.password}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!fieldErrors.confirmPassword}>
                    <FormLabel color="gray.700" fontSize="sm" fontWeight="600">
                      Confirm Password
                    </FormLabel>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) {
                          setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                        }
                      }}
                      placeholder="Confirm new password"
                      size="md"
                      h="48px"
                      borderColor={fieldErrors.confirmPassword ? 'red.400' : 'gray.300'}
                      borderRadius="xl"
                      _hover={{
                        borderColor: fieldErrors.confirmPassword ? 'red.500' : '#d1a85d'
                      }}
                      _focus={{
                        borderColor: fieldErrors.confirmPassword ? 'red.500' : '#d1a85d',
                        boxShadow: fieldErrors.confirmPassword
                          ? '0 0 0 3px rgba(252, 129, 129, 0.2)'
                          : '0 0 0 3px rgba(209, 168, 93, 0.2)'
                      }}
                    />
                    <FormErrorMessage>{fieldErrors.confirmPassword}</FormErrorMessage>
                  </FormControl>

                  <HStack w="100%" spacing={3} pt={2}>
                    <Button
                      type="button"
                      variant="outline"
                      flex={1}
                      onClick={() => navigate('/users')}
                      borderColor="gray.300"
                      _hover={{ borderColor: 'gray.400', bg: 'gray.50' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      flex={1}
                      bg="#d1a85d"
                      color="white"
                      isLoading={loading}
                      loadingText="Updating..."
                      _hover={{ bg: '#c19a4d' }}
                    >
                      Update Password
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default ChangePassword;

