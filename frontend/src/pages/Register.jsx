import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
  HStack,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'admin',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};

    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
    if (error) setError('');
    if (success) setSuccess('');
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
      const result = await register(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        formData.role,
        true // isAdminRegistering = true
      );

      if (result && result.success) {
        setSuccess(`User ${result.user.name} (${result.user.email}) has been registered successfully!`);
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          role: 'admin',
          password: '',
          confirmPassword: ''
        });
        
        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error ||
                          err?.message || 
                          'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            bg="white"
            borderRadius="2xl"
            boxShadow="2xl"
            p={10}
            border="1px solid"
            borderColor="gray.100"
          >
            <VStack spacing={8} align="stretch">
              <Box textAlign="center">
                <Heading 
                  as="h1" 
                  size="xl" 
                  color="#d1a85d"
                  fontWeight="bold"
                  mb={2}
                >
                  Register New User
                </Heading>
                <Text color="gray.600" fontSize="md">
                  Create a new account for a user
                </Text>
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
                  <FormControl isInvalid={!!fieldErrors.name}>
                    <FormLabel color="gray.700" fontSize="sm" fontWeight="600">
                      Full Name
                    </FormLabel>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      size="md"
                      h="48px"
                      borderColor={fieldErrors.name ? 'red.400' : 'gray.300'}
                      borderRadius="xl"
                      _hover={{
                        borderColor: fieldErrors.name ? 'red.500' : '#d1a85d'
                      }}
                      _focus={{
                        borderColor: fieldErrors.name ? 'red.500' : '#d1a85d',
                        boxShadow: fieldErrors.name
                          ? '0 0 0 3px rgba(252, 129, 129, 0.2)'
                          : '0 0 0 3px rgba(209, 168, 93, 0.2)'
                      }}
                    />
                    <FormErrorMessage>{fieldErrors.name}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!fieldErrors.email}>
                    <FormLabel color="gray.700" fontSize="sm" fontWeight="600">
                      Email
                    </FormLabel>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email"
                      size="md"
                      h="48px"
                      borderColor={fieldErrors.email ? 'red.400' : 'gray.300'}
                      borderRadius="xl"
                      _hover={{
                        borderColor: fieldErrors.email ? 'red.500' : '#d1a85d'
                      }}
                      _focus={{
                        borderColor: fieldErrors.email ? 'red.500' : '#d1a85d',
                        boxShadow: fieldErrors.email
                          ? '0 0 0 3px rgba(252, 129, 129, 0.2)'
                          : '0 0 0 3px rgba(209, 168, 93, 0.2)'
                      }}
                    />
                    <FormErrorMessage>{fieldErrors.email}</FormErrorMessage>
                  </FormControl>

                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm" fontWeight="600">
                      Role
                    </FormLabel>
                    <Box
                      as="select"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      w="100%"
                      h="48px"
                      px={4}
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius="xl"
                      bg="white"
                      color="gray.800"
                      fontSize="md"
                      _hover={{ borderColor: '#d1a85d' }}
                      _focus={{
                        borderColor: '#d1a85d',
                        boxShadow: '0 0 0 3px rgba(209, 168, 93, 0.2)',
                        outline: 'none'
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </Box>
                  </FormControl>

                  <FormControl isInvalid={!!fieldErrors.password}>
                    <FormLabel color="gray.700" fontSize="sm" fontWeight="600">
                      Password
                    </FormLabel>
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
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
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
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
                      onClick={() => navigate('/dashboard')}
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
                      loadingText="Registering..."
                      _hover={{ bg: '#c19a4d' }}
                    >
                      Register User
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

export default Register;
