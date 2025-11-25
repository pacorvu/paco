import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
  Code
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { forgotPassword, resetPassword } = useAuth();

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

  const validateResetForm = () => {
    const errors = {};

    if (!resetToken.trim()) {
      errors.resetToken = 'Reset token is required';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (!validateEmail()) {
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPassword(email.trim());

      if (result && result.success) {
        setSuccess('Password reset token generated.');
        if (result.data && result.data.resetToken) {
          setResetToken(result.data.resetToken);
          setStep(2);
        }
      } else {
        setError(result?.message || 'Failed to generate reset token. Please try again.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (!validateResetForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(resetToken.trim(), newPassword);

      if (result && result.success) {
        setSuccess('Password reset successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(result?.message || 'Failed to reset password. Please check your token and try again.');
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
  };

  const handleTokenChange = (e) => {
    setResetToken(e.target.value);
    if (fieldErrors.resetToken) {
      setFieldErrors({ ...fieldErrors, resetToken: '' });
    }
    if (error) setError('');
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    if (fieldErrors.newPassword) {
      setFieldErrors({ ...fieldErrors, newPassword: '' });
    }
    if (error) setError('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (fieldErrors.confirmPassword) {
      setFieldErrors({ ...fieldErrors, confirmPassword: '' });
    }
    if (error) setError('');
  };

  return (
    <Box
      w="100%"
      minH="100vh"
      bgGradient="linear(to-br, blue.50, purple.50, teal.50)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={8}
      px={4}
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }}
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
              bgGradient="linear(to-r, blue.600, purple.600)"
              bgClip="text"
              fontWeight="bold"
              mb={2}
            >
              {step === 1 ? 'Forgot Password' : 'Reset Password'}
            </Heading>
            <Text color="gray.600" fontSize="md">
              {step === 1 ? 'Enter your email to receive a reset token' : 'Enter your reset token and new password'}
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
              <Text color="green.700" fontSize="sm" fontWeight="600">
                {success}
              </Text>
            </Box>
          )}

          {step === 1 ? (
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
                    borderWidth="2px"
                    color="gray.900"
                    borderRadius="xl"
                    _hover={{ 
                      borderColor: fieldErrors.email ? 'red.500' : 'blue.400',
                      boxShadow: 'sm'
                    }}
                    _focus={{
                      borderColor: fieldErrors.email ? 'red.500' : 'blue.500',
                      boxShadow: fieldErrors.email ? '0 0 0 3px rgba(252, 129, 129, 0.2)' : '0 0 0 3px rgba(56, 189, 248, 0.2)',
                      outline: 'none'
                    }}
                    transition="all 0.2s"
                    required
                  />
                  {fieldErrors.email && (
                    <Text color="red.500" fontSize="xs" mt={1}>
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
                  loadingText="Sending..."
                  bgGradient="linear(to-r, blue.500, purple.500)"
                  color="white"
                  fontWeight="600"
                  borderRadius="xl"
                  boxShadow="md"
                  _hover={{ 
                    bgGradient: "linear(to-r, blue.600, purple.600)",
                    boxShadow: "lg",
                    transform: "translateY(-2px)"
                  }}
                  _active={{
                    transform: "translateY(0)"
                  }}
                  isDisabled={loading}
                  transition="all 0.2s"
                >
                  Send Reset Token
                </Button>
              </VStack>
            </Box>
          ) : (
            <Box as="form" onSubmit={handleResetPassword} w="100%">
              <VStack spacing={4}>
                {resetToken && (
                  <Box w="100%" p={4} bg="blue.50" borderRadius="xl" border="1px solid" borderColor="blue.200" boxShadow="sm">
                    <Text fontSize="xs" mb={2} color="blue.700" fontWeight="600">Reset Token:</Text>
                    <Code 
                      fontSize="xs" 
                      wordBreak="break-all" 
                      p={3} 
                      display="block"
                      bg="white"
                      color="blue.800"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="blue.200"
                    >
                      {resetToken}
                    </Code>
                  </Box>
                )}

                <Box w="100%">
                  <Text mb={2} color="gray.700" fontSize="sm" fontWeight="600">
                    Reset Token
                  </Text>
                  <Input
                    type="text"
                    value={resetToken}
                    onChange={handleTokenChange}
                    placeholder="Enter reset token"
                    size="md"
                    h="48px"
                    borderColor={fieldErrors.resetToken ? 'red.400' : 'gray.300'}
                    borderWidth="2px"
                    color="gray.900"
                    borderRadius="xl"
                    _hover={{ 
                      borderColor: fieldErrors.resetToken ? 'red.500' : 'blue.400',
                      boxShadow: 'sm'
                    }}
                    _focus={{
                      borderColor: fieldErrors.resetToken ? 'red.500' : 'blue.500',
                      boxShadow: fieldErrors.resetToken ? '0 0 0 3px rgba(252, 129, 129, 0.2)' : '0 0 0 3px rgba(56, 189, 248, 0.2)',
                      outline: 'none'
                    }}
                    transition="all 0.2s"
                    required
                  />
                  {fieldErrors.resetToken && (
                    <Text color="red.500" fontSize="xs" mt={1}>
                      {fieldErrors.resetToken}
                    </Text>
                  )}
                </Box>

                <Box w="100%">
                  <Text mb={2} color="gray.700" fontSize="sm" fontWeight="600">
                    New Password
                  </Text>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    placeholder="Enter new password"
                    size="md"
                    h="48px"
                    borderColor={fieldErrors.newPassword ? 'red.400' : 'gray.300'}
                    borderWidth="2px"
                    color="gray.900"
                    borderRadius="xl"
                    _hover={{ 
                      borderColor: fieldErrors.newPassword ? 'red.500' : 'blue.400',
                      boxShadow: 'sm'
                    }}
                    _focus={{
                      borderColor: fieldErrors.newPassword ? 'red.500' : 'blue.500',
                      boxShadow: fieldErrors.newPassword ? '0 0 0 3px rgba(252, 129, 129, 0.2)' : '0 0 0 3px rgba(56, 189, 248, 0.2)',
                      outline: 'none'
                    }}
                    transition="all 0.2s"
                    required
                  />
                  {fieldErrors.newPassword && (
                    <Text color="red.500" fontSize="xs" mt={1}>
                      {fieldErrors.newPassword}
                    </Text>
                  )}
                </Box>

                <Box w="100%">
                  <Text mb={2} color="gray.700" fontSize="sm" fontWeight="600">
                    Confirm New Password
                  </Text>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirm new password"
                    size="md"
                    h="48px"
                    borderColor={fieldErrors.confirmPassword ? 'red.400' : 'gray.300'}
                    borderWidth="2px"
                    color="gray.900"
                    borderRadius="xl"
                    _hover={{ 
                      borderColor: fieldErrors.confirmPassword ? 'red.500' : 'blue.400',
                      boxShadow: 'sm'
                    }}
                    _focus={{
                      borderColor: fieldErrors.confirmPassword ? 'red.500' : 'blue.500',
                      boxShadow: fieldErrors.confirmPassword ? '0 0 0 3px rgba(252, 129, 129, 0.2)' : '0 0 0 3px rgba(56, 189, 248, 0.2)',
                      outline: 'none'
                    }}
                    transition="all 0.2s"
                    required
                  />
                  {fieldErrors.confirmPassword && (
                    <Text color="red.500" fontSize="xs" mt={1}>
                      {fieldErrors.confirmPassword}
                    </Text>
                  )}
                </Box>

                <Button
                  type="submit"
                  size="lg"
                  w="100%"
                  h="52px"
                  isLoading={loading}
                  loadingText="Resetting..."
                  bgGradient="linear(to-r, blue.500, purple.500)"
                  color="white"
                  fontWeight="600"
                  borderRadius="xl"
                  boxShadow="md"
                  _hover={{ 
                    bgGradient: "linear(to-r, blue.600, purple.600)",
                    boxShadow: "lg",
                    transform: "translateY(-2px)"
                  }}
                  _active={{
                    transform: "translateY(0)"
                  }}
                  isDisabled={loading}
                  transition="all 0.2s"
                >
                  Reset Password
                </Button>
              </VStack>
            </Box>
          )}

          <Box textAlign="center" pt={2}>
            <Link to="/login">
              <Text 
                color="blue.600" 
                fontSize="sm" 
                fontWeight="500"
                _hover={{ 
                  color: 'blue.700', 
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
