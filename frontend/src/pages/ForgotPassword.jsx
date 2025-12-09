import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
  HStack,
  Icon
} from '@chakra-ui/react';
import { PhoneIcon, EmailIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [contactInfo, setContactInfo] = useState(null);
  const { forgotPassword } = useAuth();

  const validateEmail = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    setContactInfo(null);

    if (!validateEmail()) {
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPassword(email.trim());

      if (result && result.success) {
        setSuccess(result.message || 'Please contact the administrator to reset your password');
        if (result.contactInfo) {
          setContactInfo(result.contactInfo);
        }
      } else {
        setError(result?.message || 'An error occurred. Please try again.');
        if (result?.contactInfo) {
          setContactInfo(result.contactInfo);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors({ ...fieldErrors, email: '' });
    }
    if (error) setError('');
    if (success) setSuccess('');
    if (contactInfo) setContactInfo(null);
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
              Forgot Password
            </Heading>
            <Text color="gray.600" fontSize="md">
              Enter your email to get contact information
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

          {success && (
            <Box
              bg="green.50"
              border="1px solid"
              borderColor="green.200"
              borderRadius="xl"
              p={4}
              w="100%"
              boxShadow="sm"
              className="slide-in"
            >
              <Text color="green.700" fontSize="sm" fontWeight="600" mb={contactInfo ? 4 : 0}>
                {success}
              </Text>
              
              {contactInfo && (
                <VStack spacing={3} align="stretch" mt={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
                      Contact the Administrator:
                    </Text>
                    
                    {contactInfo.phones && contactInfo.phones.length > 0 && (
                      <VStack spacing={2} align="stretch" mb={3}>
                        {contactInfo.phones.map((phone, index) => (
                          <HStack key={index} spacing={2}>
                            <Icon as={PhoneIcon} color="#d1a85d" />
                            <Text fontSize="sm" color="gray.800">
                              {phone}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                    
                    {contactInfo.emails && contactInfo.emails.length > 0 && (
                      <VStack spacing={2} align="stretch">
                        {contactInfo.emails.map((email, index) => (
                          <HStack key={index} spacing={2}>
                            <Icon as={EmailIcon} color="#d1a85d" />
                            <Text fontSize="sm" color="gray.800">
                              {email}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                  </Box>
                </VStack>
              )}
            </Box>
          )}

          {!success && (
            <Box as="form" onSubmit={handleRequestReset} w="100%">
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

                <Button
                  type="submit"
                  size="lg"
                  w="100%"
                  h="52px"
                  isLoading={loading}
                  loadingText="Loading..."
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
                  Get Contact Information
                </Button>
              </VStack>
            </Box>
          )}

          <Box textAlign="center" pt={2}>
            <Link to="/login">
              <Text 
                color="#d1a85d" 
                fontSize="sm" 
                fontWeight="500"
                _hover={{ 
                  color: '#c19a4d', 
                  textDecoration: 'underline' 
                }}
                transition="color 0.2s"
              >
                ← Back to Login
              </Text>
            </Link>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
