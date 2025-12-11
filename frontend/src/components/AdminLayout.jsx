import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  HStack,
  Button,
  Text,
  Heading,
  IconButton,
  Badge,
  Flex,
  Avatar,
  useColorModeValue,
  Container,
  Icon,
  Image
} from '@chakra-ui/react';
import { 
  ViewIcon, 
  ArrowForwardIcon,
  AddIcon,
  SettingsIcon,
  CalendarIcon
} from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navbarBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    { path: '/dashboard', label: 'Placement Details', icon: ViewIcon },
    { path: '/students', label: 'View All Students', icon: ViewIcon },
    { path: '/job-offers', label: 'Job Offers', icon: ViewIcon },
    { path: '/events', label: 'Events', icon: ViewIcon },
    { path: '/calendar', label: 'Calendar', icon: CalendarIcon }
  ];
  const visibleNavItems = isSuperAdmin ? navItems : navItems.filter(item => ['/dashboard','/calendar'].includes(item.path));

  const isActive = (path) => location.pathname === path;

  return (
    <Box minH="100vh">
      {/* Top Navbar */}
      <Box
        bgGradient="linear(to-r, #172e36, #1e3a47)"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)"
        position="sticky"
        top={0}
        zIndex={1000}
        borderBottom="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
      >
        <Container maxW="100%" px={{ base: 4, md: 8 }}>
          <Flex
            justify="space-between"
            align="center"
            h={{ base: '60px', md: '72px' }}
          >
            {/* Left Section */}
            <HStack spacing={{ base: 4, md: 8 }}>
              {/* Logo/Title */}
              <Box
                display="flex"
                alignItems="center"
                _hover={{ transform: 'scale(1.05)' }}
                transition="transform 0.2s ease"
                cursor="pointer"
              >
                <Image
                  src="/logo-rvu.png"
                  alt="Logo"
                  h={{ base: 8, md: 10 }}
                  w="auto"
                  objectFit="contain"
                  filter="brightness(1.1)"
                />
              </Box>

              {/* Navigation Links - Desktop */}
              <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
                {visibleNavItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                      <Button
                        variant="ghost"
                        size="md"
                        borderRadius="xl"
                        fontWeight={active ? '600' : '500'}
                        fontSize="sm"
                        letterSpacing="0.3px"
                        px={5}
                        py={2}
                        color={active ? '#172e36' : 'rgba(255, 255, 255, 0.85)'}
                        bg={active ? '#d1a85d' : 'transparent'}
                        border="none"
                        outline="none"
                        boxShadow={active ? '0 4px 12px rgba(209, 168, 93, 0.4)' : 'none'}
                        position="relative"
                        overflow="hidden"
                        _before={active ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
                          zIndex: 0
                        } : {}}
                        _hover={{
                          bg: active ? '#d1a85d' : 'rgba(255, 255, 255, 0.12)',
                          color: active ? '#172e36' : 'white',
                          border: 'none',
                          outline: 'none',
                          transform: 'translateY(-1px)',
                          boxShadow: active ? '0 4px 16px rgba(209, 168, 93, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }}
                        _focus={{
                          bg: active ? '#d1a85d' : 'transparent',
                          border: 'none',
                          outline: 'none',
                          boxShadow: active ? '0 4px 12px rgba(209, 168, 93, 0.4)' : 'none'
                        }}
                        _active={{
                          bg: active ? '#d1a85d' : 'rgba(255, 255, 255, 0.12)',
                          border: 'none',
                          outline: 'none',
                          transform: 'translateY(0)',
                          boxShadow: active ? '0 2px 8px rgba(209, 168, 93, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.15)'
                        }}
                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                        sx={{
                          '& > *': { position: 'relative', zIndex: 1 },
                          '&:focus': {
                            outline: 'none !important',
                            boxShadow: active ? '0 4px 12px rgba(209, 168, 93, 0.4) !important' : 'none !important'
                          }
                        }}
                      >
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </HStack>
            </HStack>

            {/* Right Section */}
            <HStack spacing={{ base: 2, md: 4 }}>
              {/* User Management - Superadmin Only - Desktop */}
              {isSuperAdmin && (
                <Link to="/users" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="ghost"
                    size="md"
                    borderRadius="xl"
                    fontWeight={isActive('/users') ? '600' : '500'}
                    fontSize="sm"
                    letterSpacing="0.3px"
                    px={5}
                    py={2}
                    color={isActive('/users') ? '#172e36' : 'rgba(255, 255, 255, 0.85)'}
                    bg={isActive('/users') ? '#d1a85d' : 'transparent'}
                    border="none"
                    outline="none"
                    boxShadow={isActive('/users') ? '0 4px 12px rgba(209, 168, 93, 0.4)' : 'none'}
                    position="relative"
                    leftIcon={<SettingsIcon />}
                    display={{ base: 'none', md: 'flex' }}
                    _hover={{
                      bg: isActive('/users') ? '#d1a85d' : 'rgba(255, 255, 255, 0.12)',
                      color: isActive('/users') ? '#172e36' : 'white',
                      border: 'none',
                      outline: 'none',
                      transform: 'translateY(-1px)',
                      boxShadow: isActive('/users') ? '0 4px 16px rgba(209, 168, 93, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.2)'
                    }}
                    _focus={{
                      bg: isActive('/users') ? '#d1a85d' : 'transparent',
                      border: 'none',
                      outline: 'none',
                      boxShadow: isActive('/users') ? '0 4px 12px rgba(209, 168, 93, 0.4)' : 'none'
                    }}
                    _active={{
                      bg: isActive('/users') ? '#d1a85d' : 'rgba(255, 255, 255, 0.12)',
                      border: 'none',
                      outline: 'none',
                      transform: 'translateY(0)',
                      boxShadow: isActive('/users') ? '0 2px 8px rgba(209, 168, 93, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    sx={{
                      '&:focus': {
                        outline: 'none !important',
                        boxShadow: isActive('/users') ? '0 4px 12px rgba(209, 168, 93, 0.4) !important' : 'none !important'
                      }
                    }}
                  >
                    User Management
                  </Button>
                </Link>
              )}

              {/* User Info & Logout - Mobile */}
              <HStack spacing={2} display={{ base: 'flex', md: 'none' }}>
                {/* User Management - Mobile - Superadmin Only */}
                {isSuperAdmin && (
                  <Button
                    size="sm"
                    borderRadius="lg"
                    onClick={() => navigate('/users')}
                    bg="rgba(209, 168, 93, 0.15)"
                    color="#d1a85d"
                    border="1px solid"
                    borderColor="#d1a85d"
                    px={3}
                    py={2}
                    fontWeight="500"
                    fontSize="xs"
                    leftIcon={<SettingsIcon />}
                    _hover={{
                      bg: "rgba(209, 168, 93, 0.25)",
                      borderColor: "#c19a4d",
                      transform: "translateY(-1px)",
                      boxShadow: "0 2px 8px rgba(209, 168, 93, 0.3)"
                    }}
                    _active={{
                      bg: "rgba(209, 168, 93, 0.3)",
                      transform: "translateY(0)",
                      boxShadow: "0 1px 4px rgba(209, 168, 93, 0.2)"
                    }}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  >
                    Users
                  </Button>
                )}
                <Button
                  size="sm"
                  borderRadius="lg"
                  onClick={handleLogout}
                  bg="rgba(254, 226, 226, 0.95)"
                  color="red.600"
                  border="1px solid"
                  borderColor="red.300"
                  px={4}
                  py={2}
                  fontWeight="500"
                  fontSize="sm"
                  _hover={{
                    bg: "rgba(254, 202, 202, 1)",
                    borderColor: "red.400",
                    transform: "translateY(-1px)",
                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)"
                  }}
                  _active={{
                    bg: "rgba(252, 165, 165, 1)",
                    transform: "translateY(0)",
                    boxShadow: "0 1px 4px rgba(239, 68, 68, 0.2)"
                  }}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                  Logout
                </Button>
              </HStack>

              {/* User Info & Logout - Desktop */}
              <HStack 
                spacing={4} 
                display={{ base: 'none', md: 'flex' }}
                bg="rgba(255, 255, 255, 0.08)"
                px={4}
                py={2}
                borderRadius="xl"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.1)"
                backdropFilter="blur(8px)"
                _hover={{
                  bg: "rgba(255, 255, 255, 0.12)",
                  borderColor: "rgba(255, 255, 255, 0.15)"
                }}
                transition="all 0.3s ease"
              >
                <Avatar
                  name={user?.name}
                  size="sm"
                  bg="rgba(255, 255, 255, 0.25)"
                  color="white"
                  border="2px solid"
                  borderColor="rgba(255, 255, 255, 0.3)"
                  boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)"
                  _hover={{
                    transform: "scale(1.1)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)"
                  }}
                  transition="all 0.3s ease"
                />
                <Box>
                  <Text 
                    fontSize="sm" 
                    fontWeight="600" 
                    color="white" 
                    lineHeight="1.3"
                    letterSpacing="0.2px"
                  >
                    {user?.name || 'User'}
                  </Text>
                  <Text 
                    fontSize="xs" 
                    color="rgba(255, 255, 255, 0.75)"
                    fontWeight="500"
                    letterSpacing="0.5px"
                  >
                    {user?.role?.replace('_', ' ').toUpperCase() || 'USER'}
                  </Text>
                </Box>
                <Box
                  as="span"
                  w="1px"
                  h="24px"
                  bg="rgba(255, 255, 255, 0.2)"
                  mx={1}
                />
                <Button
                  size="sm"
                  borderRadius="lg"
                  onClick={handleLogout}
                  bg="rgba(254, 226, 226, 0.95)"
                  color="red.600"
                  border="1px solid"
                  borderColor="red.300"
                  px={4}
                  py={2}
                  fontWeight="500"
                  fontSize="sm"
                  _hover={{
                    bg: "rgba(254, 202, 202, 1)",
                    borderColor: "red.400",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)"
                  }}
                  _active={{
                    bg: "rgba(252, 165, 165, 1)",
                    transform: "translateY(0)",
                    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.25)"
                  }}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                  Logout
                </Button>
              </HStack>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Box>
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
