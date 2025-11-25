import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
  HStack,
  Container,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';

const Register = () => {
  const [step, setStep] = useState(1); // 1: Name/Email/OTP, 2: Password
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'vc',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [otpRequestId, setOtpRequestId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const MAX_RESEND_ATTEMPTS = 3;
  const RESEND_COOLDOWN = 30; // seconds
  const { sendRegistrationOtp, register } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const validateStep1 = () => {
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

    if (otpSent && !formData.otp) {
      errors.otp = 'OTP is required';
    } else if (otpSent && formData.otp.length !== 6) {
      errors.otp = 'OTP must be 6 digits';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};

    if (!formData.password || formData.password.length === 0) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword || formData.confirmPassword.length === 0) {
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

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSendOtp = async (isResend = false) => {
    setError('');
    setFieldErrors({});

    // Check resend attempts limit
    if (isResend && resendAttempts >= MAX_RESEND_ATTEMPTS) {
      setError(`Maximum resend attempts (${MAX_RESEND_ATTEMPTS}) reached. Please contact support for assistance.`);
      return;
    }

    // Check countdown
    if (isResend && resendCountdown > 0) {
      setError(`Please wait ${resendCountdown} seconds before resending OTP.`);
      return;
    }

    // Validate name and email first (only for first send)
    if (!isResend) {
      if (!formData.name || !formData.name.trim()) {
        setFieldErrors({ name: 'Full name is required' });
        return;
      }

      if (!formData.email || !formData.email.trim()) {
        setFieldErrors({ email: 'Email is required' });
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        setFieldErrors({ email: 'Please enter a valid email address' });
        return;
      }
    }

    setSendingOtp(true);

    try {
      // Add a small delay for better UX animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await sendRegistrationOtp(formData.email.trim());
      
      if (result.success) {
        setOtpRequestId(result.requestId);
        setOtpSent(true);
        setError('');
        
        if (isResend) {
          setResendAttempts(prev => prev + 1);
          setResendCountdown(RESEND_COOLDOWN);
        } else {
          setResendCountdown(RESEND_COOLDOWN);
        }
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setFieldErrors({});

    if (!validateStep1()) {
      return;
    }

    setVerifyingOtp(true);

    try {
      // OTP verification happens during registration
      // For now, just mark as verified and move to step 2
      setOtpVerified(true);
      setStep(2);
      setError('');
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateStep2()) {
      return;
    }

    if (!otpRequestId || !formData.otp) {
      setError('Please complete OTP verification first');
      return;
    }

    setLoading(true);

    try {
      // Pass isAdminRegistering flag so admin stays logged in
      const result = await register(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        formData.role,
        otpRequestId,
        formData.otp,
        true // isAdminRegistering = true
      );

      if (result && result.success) {
        // Registration successful - show success message
        setError('');
        setSuccess(`User ${result.user.name} (${result.user.email}) has been registered successfully!`);
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          role: 'vc',
          otp: '',
          password: '',
          confirmPassword: ''
        });
        setOtpSent(false);
        setOtpVerified(false);
        setOtpRequestId(null);
        setStep(1);
        setResendAttempts(0);
        setResendCountdown(0);
        
        // Navigate back to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        const errorMessage = result?.message || 'Registration failed. Please try again.';
        setError(errorMessage);
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
        position="relative"
      >
        <Container maxW="md" w="100%">
          <Box
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

          {/* Step Indicator */}
          <Box w="100%" py={2}>
            <HStack spacing={3} w="100%" justify="center" align="center">
              <Box
                w="40px"
                h="40px"
                borderRadius="full"
                bg={step >= 1 ? "#d1a85d" : "gray.300"}
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="bold"
                fontSize="sm"
                boxShadow={step >= 1 ? "md" : "none"}
                transition="all 0.3s"
              >
                1
              </Box>
              <Box
                flex={1}
                h="3px"
                bg={step >= 2 ? "#d1a85d" : "gray.300"}
                borderRadius="full"
                transition="all 0.3s"
              />
              <Box
                w="40px"
                h="40px"
                borderRadius="full"
                bg={step >= 2 ? "#d1a85d" : "gray.300"}
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="bold"
                fontSize="sm"
                boxShadow={step >= 2 ? "md" : "none"}
                transition="all 0.3s"
              >
                2
              </Box>
            </HStack>
          </Box>

          {success && (
            <Box
              bg="green.50"
              border="1px solid"
              borderColor="green.300"
              borderRadius="lg"
              p={4}
              w="100%"
              boxShadow="sm"
            >
              <Text color="green.700" fontSize="sm" fontWeight="500">
                {success}
              </Text>
            </Box>
          )}
          {error && (
            <Box
              bg="red.50"
              border="1px solid"
              borderColor="red.300"
              borderRadius="lg"
              p={4}
              w="100%"
              boxShadow="sm"
            >
              <Text color="red.700" fontSize="sm" fontWeight="500">
                {error}
              </Text>
            </Box>
          )}

          {step === 1 ? (
            // STEP 1: Name, Email, and OTP Verification
            <Box w="100%">
              <VStack spacing={5} align="stretch">
                <Box w="100%">
                  <Text mb={2} color="gray.800" fontSize="sm" fontWeight="600">
                    Full Name
                  </Text>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    size="md"
                    h="44px"
                    borderColor={fieldErrors.name ? 'red.400' : 'gray.300'}
                    color="gray.800"
                    bg="white"
                    isDisabled={otpSent}
                    borderRadius="lg"
                    _placeholder={{ color: 'gray.400' }}
                    _hover={{ 
                      borderColor: fieldErrors.name ? 'red.500' : '#d1a85d',
                      bg: 'white'
                    }}
                    _focus={{
                      borderColor: fieldErrors.name ? 'red.500' : '#d1a85d',
                      boxShadow: fieldErrors.name ? '0 0 0 3px rgba(252, 129, 129, 0.2)' : '0 0 0 3px rgba(209, 168, 93, 0.2)',
                      bg: 'white'
                    }}
                    _disabled={{
                      bg: 'gray.100',
                      color: 'gray.600',
                      cursor: 'not-allowed',
                      opacity: 0.7
                    }}
                    required
                  />
                  {fieldErrors.name && (
                    <Text color="red.500" fontSize="xs" mt={1.5} ml={1}>
                      {fieldErrors.name}
                    </Text>
                  )}
                </Box>

                <Box w="100%">
                  <Text mb={2} color="gray.800" fontSize="sm" fontWeight="600">
                    Email
                  </Text>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    size="md"
                    h="44px"
                    borderColor={fieldErrors.email ? 'red.400' : 'gray.300'}
                    color="gray.800"
                    bg="white"
                    isDisabled={otpSent}
                    borderRadius="lg"
                    _placeholder={{ color: 'gray.400' }}
                    _hover={{ 
                      borderColor: fieldErrors.email ? 'red.500' : '#d1a85d',
                      bg: 'white'
                    }}
                    _focus={{
                      borderColor: fieldErrors.email ? 'red.500' : '#d1a85d',
                      boxShadow: fieldErrors.email ? '0 0 0 3px rgba(252, 129, 129, 0.2)' : '0 0 0 3px rgba(209, 168, 93, 0.2)',
                      bg: 'white'
                    }}
                    _disabled={{
                      bg: 'gray.100',
                      color: 'gray.600',
                      cursor: 'not-allowed',
                      opacity: 0.7
                    }}
                    required
                  />
                  {fieldErrors.email && (
                    <Text color="red.500" fontSize="xs" mt={1.5} ml={1}>
                      {fieldErrors.email}
                    </Text>
                  )}
                </Box>

                <Box w="100%">
                  <Text mb={2} color="gray.800" fontSize="sm" fontWeight="600">
                    Role
                  </Text>
                  <Box
                    as="select"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    w="100%"
                    h="44px"
                    px={4}
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="lg"
                    bg="white"
                    color="gray.800"
                    fontSize="md"
                    fontWeight="500"
                    isDisabled={otpSent}
                    _hover={{ 
                      borderColor: '#d1a85d',
                      bg: 'white'
                    }}
                    _focus={{
                      borderColor: '#d1a85d',
                      boxShadow: '0 0 0 3px rgba(209, 168, 93, 0.2)',
                      bg: 'white',
                      outline: 'none'
                    }}
                    _disabled={{
                      bg: 'gray.100',
                      color: 'gray.600',
                      cursor: 'not-allowed',
                      opacity: 0.7
                    }}
                    required
                  >
                    <option value="vc">VC</option>
                    <option value="admin">Admin</option>
                  </Box>
                </Box>

                {!otpSent ? (
                  <Button
                    onClick={() => handleSendOtp(false)}
                    size="lg"
                    w="100%"
                    h="48px"
                    isLoading={sendingOtp}
                    loadingText="Sending OTP..."
                    bg="#d1a85d"
                    color="white"
                    fontWeight="600"
                    borderRadius="lg"
                    boxShadow="md"
                    _hover={{ 
                      bg: "#c19a4d",
                      boxShadow: "lg",
                      transform: "translateY(-1px)"
                    }}
                    _active={{
                      transform: "translateY(0)"
                    }}
                    isDisabled={sendingOtp}
                    transition="all 0.2s"
                    animation={sendingOtp ? "pulse 1.5s ease-in-out infinite" : "none"}
                    sx={{
                      "@keyframes pulse": {
                        "0%, 100%": {
                          opacity: 1,
                        },
                        "50%": {
                          opacity: 0.8,
                        },
                      },
                    }}
                  >
                    {sendingOtp ? 'Sending...' : 'Send OTP'}
                  </Button>
                ) : (
                  <>
                    <Box w="100%">
                      <Text mb={2} color="gray.800" fontSize="sm" fontWeight="600">
                        Enter OTP
                      </Text>
                      <Input
                        type="text"
                        name="otp"
                        value={formData.otp}
                        onChange={handleChange}
                        placeholder="000000"
                        size="md"
                        h="56px"
                        borderColor={fieldErrors.otp ? 'red.400' : 'gray.300'}
                        color="gray.800"
                        bg="white"
                        maxLength={6}
                        textAlign="center"
                        fontSize="2xl"
                        letterSpacing="0.5em"
                        fontWeight="bold"
                        borderRadius="lg"
                        _placeholder={{ color: 'gray.400' }}
                        _hover={{ 
                          borderColor: fieldErrors.otp ? 'red.500' : '#d1a85d',
                          bg: 'white'
                        }}
                        _focus={{
                          borderColor: fieldErrors.otp ? 'red.500' : '#d1a85d',
                          boxShadow: fieldErrors.otp ? '0 0 0 3px rgba(252, 129, 129, 0.2)' : '0 0 0 3px rgba(209, 168, 93, 0.2)',
                          bg: 'white'
                        }}
                        required
                      />
                      {fieldErrors.otp && (
                        <Text color="red.500" fontSize="xs" mt={1.5} ml={1} textAlign="center">
                          {fieldErrors.otp}
                        </Text>
                      )}
                      <HStack mt={3} justify="center" spacing={2}>
                        <Text color="gray.700" fontSize="xs" fontWeight="500">
                          ✓ OTP sent to {formData.email}
                        </Text>
                        {resendAttempts > 0 && (
                          <Text color="gray.600" fontSize="xs">
                            (Resent {resendAttempts}/{MAX_RESEND_ATTEMPTS})
                          </Text>
                        )}
                      </HStack>
                      
                      {/* Resend OTP Button */}
                      {resendAttempts < MAX_RESEND_ATTEMPTS && (
                        <Box mt={2} textAlign="center">
                          {resendCountdown > 0 ? (
                            <Text color="gray.600" fontSize="xs">
                              Resend OTP in <Text as="span" fontWeight="600" color="#d1a85d">{resendCountdown}s</Text>
                            </Text>
                          ) : (
                            <Button
                              onClick={() => handleSendOtp(true)}
                              size="sm"
                              variant="link"
                              color="#d1a85d"
                              fontSize="xs"
                              fontWeight="600"
                              isLoading={sendingOtp}
                              loadingText="Resending..."
                              _hover={{ 
                                color: '#c19a4d',
                                textDecoration: 'underline'
                              }}
                              isDisabled={sendingOtp}
                            >
                              Resend OTP
                            </Button>
                          )}
                        </Box>
                      )}
                      
                      {resendAttempts >= MAX_RESEND_ATTEMPTS && (
                        <Text color="red.600" fontSize="xs" mt={2} textAlign="center" fontWeight="500">
                          Maximum resend attempts reached. Please contact support for assistance.
                        </Text>
                      )}
                    </Box>

                    <Button
                      onClick={handleVerifyOtp}
                      size="lg"
                      w="100%"
                      h="48px"
                      isLoading={verifyingOtp}
                      loadingText="Verifying..."
                      bg="#d1a85d"
                      color="white"
                      fontWeight="600"
                      borderRadius="lg"
                      boxShadow="md"
                      _hover={{ 
                        bg: "#c19a4d",
                        boxShadow: "lg",
                        transform: "translateY(-1px)"
                      }}
                      _active={{
                        transform: "translateY(0)"
                      }}
                      isDisabled={verifyingOtp}
                      transition="all 0.2s"
                    >
                      Verify OTP
                    </Button>
                  </>
                )}
              </VStack>
            </Box>
          ) : (
            // STEP 2: Password Setup
            <Box as="form" onSubmit={handleSubmit} w="100%">
              <VStack spacing={5} align="stretch">
                <Box w="100%" textAlign="center" bg="green.50" borderRadius="xl" p={4} border="1px solid" borderColor="green.200" boxShadow="sm">
                  <Text color="green.700" fontSize="sm" fontWeight="600">
                    ✓ Email verified: {formData.email}
                  </Text>
                </Box>

                <Box w="100%">
                  <Text mb={2} color="gray.800" fontSize="sm" fontWeight="600">
                    Password
                  </Text>
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    size="md"
                    h="44px"
                    borderColor={fieldErrors.password ? 'red.400' : 'gray.300'}
                    color="gray.800"
                    bg="white"
                    borderRadius="lg"
                    _placeholder={{ color: 'gray.400' }}
                    _hover={{ 
                      borderColor: fieldErrors.password ? 'red.500' : '#d1a85d',
                      bg: 'white'
                    }}
                    _focus={{
                      borderColor: fieldErrors.password ? 'red.500' : '#d1a85d',
                      boxShadow: fieldErrors.password ? '0 0 0 3px rgba(252, 129, 129, 0.2)' : '0 0 0 3px rgba(209, 168, 93, 0.2)',
                      bg: 'white'
                    }}
                    required
                  />
                  {fieldErrors.password && (
                    <Text color="red.500" fontSize="xs" mt={1.5} ml={1}>
                      {fieldErrors.password}
                    </Text>
                  )}
                </Box>

                <Box w="100%">
                  <Text mb={2} color="gray.800" fontSize="sm" fontWeight="600">
                    Confirm Password
                  </Text>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    size="md"
                    h="44px"
                    borderColor={fieldErrors.confirmPassword ? 'red.400' : 'gray.300'}
                    color="gray.800"
                    bg="white"
                    borderRadius="lg"
                    _placeholder={{ color: 'gray.400' }}
                    _hover={{ 
                      borderColor: fieldErrors.confirmPassword ? 'red.500' : '#d1a85d',
                      bg: 'white'
                    }}
                    _focus={{
                      borderColor: fieldErrors.confirmPassword ? 'red.500' : '#d1a85d',
                      boxShadow: fieldErrors.confirmPassword ? '0 0 0 3px rgba(252, 129, 129, 0.2)' : '0 0 0 3px rgba(209, 168, 93, 0.2)',
                      bg: 'white'
                    }}
                    required
                  />
                  {fieldErrors.confirmPassword && (
                    <Text color="red.500" fontSize="xs" mt={1.5} ml={1}>
                      {fieldErrors.confirmPassword}
                    </Text>
                  )}
                </Box>

                <HStack w="100%" spacing={3}>
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    size="lg"
                    flex={1}
                    h="52px"
                    borderColor="gray.300"
                    borderWidth="2px"
                    color="gray.700"
                    fontWeight="600"
                    borderRadius="xl"
                    _hover={{ 
                      borderColor: 'gray.400',
                      bg: 'gray.50',
                      transform: "translateY(-1px)"
                    }}
                    transition="all 0.2s"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    flex={1}
                    h="52px"
                    isLoading={loading}
                    loadingText="Registering..."
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
                    Complete Registration
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )}

        </VStack>
          </Box>
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default Register;
