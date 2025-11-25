import { useLocation, Link } from 'react-router-dom';
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
  Icon
} from '@chakra-ui/react';
import { 
  ViewIcon, 
  ArrowForwardIcon
} from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navbarBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: ViewIcon },
    { path: '#', label: 'Students', icon: ViewIcon },
    { path: '#', label: 'Companies', icon: ViewIcon },
    { path: '#', label: 'Reports', icon: ViewIcon }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <Box minH="100vh">
      {/* Top Navbar */}
      <Box
        bgGradient="linear(to-r, #343a85, #4c51bf)"
        boxShadow="2xl"
        position="sticky"
        top={0}
        zIndex={1000}
      >
        <Container maxW="100%" px={{ base: 4, md: 6 }}>
          <Flex
            justify="space-between"
            align="center"
            h="64px"
          >
            {/* Left Section */}
            <HStack spacing={6}>
              {/* Logo/Title */}
              <Text fontSize="xl" fontWeight="bold" color="white" letterSpacing="wider">
                Placement Portal
              </Text>

              {/* Navigation Links - Desktop */}
              <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                      <Button
                        variant="ghost"
                        size="md"
                        borderRadius="lg"
                        fontWeight={active ? '700' : '500'}
                        fontSize="base"
                        color={active ? 'white' : 'gray.200'}
                        bg={active ? 'rgba(139, 147, 229, 0.3)' : 'transparent'}
                        border={active ? '1px solid' : 'none'}
                        borderColor={active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'}
                        boxShadow={active ? 'lg' : 'none'}
                        _hover={{
                          bg: 'rgba(139, 147, 229, 0.2)',
                          color: 'white'
                        }}
                        transition="all 0.2s"
                      >
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </HStack>
            </HStack>

            {/* Right Section */}
            <HStack spacing={4}>
              {/* Admin Badge */}
              <Badge
                display={{ base: 'none', sm: 'flex' }}
                color="gray.300"
                fontSize="sm"
                border="1px solid"
                borderColor="gray.400"
                px={3}
                py={1}
                borderRadius="full"
              >
                ADMIN
              </Badge>

              {/* User Info & Logout - Mobile */}
              <HStack spacing={2} display={{ base: 'flex', md: 'none' }}>
                <Button
                  colorScheme="red"
                  size="sm"
                  borderRadius="lg"
                  onClick={handleLogout}
                  leftIcon={<Icon as={ArrowForwardIcon} boxSize={4} />}
                >
                  Logout
                </Button>
              </HStack>

              {/* User Info & Logout - Desktop */}
              <HStack spacing={3} display={{ base: 'none', md: 'flex' }}>
                <Avatar
                  name={user?.name}
                  size="sm"
                  bg="rgba(255, 255, 255, 0.2)"
                  color="white"
                />
                <Box>
                  <Text fontSize="sm" fontWeight="600" color="white" lineHeight="1.2">
                    {user?.name || 'User'}
                  </Text>
                  <Text fontSize="xs" color="gray.300">
                    {user?.role?.replace('_', ' ').toUpperCase() || 'USER'}
                  </Text>
                </Box>
                <Button
                  colorScheme="red"
                  size="sm"
                  borderRadius="lg"
                  onClick={handleLogout}
                  leftIcon={<Icon as={ArrowForwardIcon} boxSize={4} />}
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                  transition="all 0.2s"
                  fontWeight="600"
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

