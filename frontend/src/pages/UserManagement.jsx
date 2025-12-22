import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  Badge,
  useColorModeValue,
  Spinner,
  VStack,
  HStack,
  IconButton
} from '@chakra-ui/react';
import { EditIcon, AddIcon } from '@chakra-ui/icons';
import AdminLayout from '../components/AdminLayout';
import api from '../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data || []);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = (userId) => {
    navigate(`/change-password/${userId}`);
  };

  const handleAddUser = () => {
    navigate('/register');
  };

  const getRoleBadgeColor = (role) => {
    return role === 'superadmin' ? 'purple' : 'blue';
  };

  return (
    <AdminLayout>
      <Box
        w="100%"
        minH="calc(100vh - 72px)"
        bg="#172e36"
        py={8}
        px={4}
      >
        <Container maxW="6xl">
          <Box
            bg={cardBg}
            borderRadius="2xl"
            boxShadow="2xl"
            p={8}
            border="1px solid"
            borderColor={borderColor}
          >
            <HStack justify="space-between" mb={6}>
              <Heading size="xl" color="#d1a85d" fontWeight="bold">
                User Management
              </Heading>
              <Button
                leftIcon={<AddIcon />}
                bg="#d1a85d"
                color="white"
                _hover={{ bg: '#c19a4d' }}
                onClick={handleAddUser}
              >
                Add New User
              </Button>
            </HStack>

            {error && (
              <Box
                bg="red.50"
                border="1px solid"
                borderColor="red.200"
                borderRadius="lg"
                p={4}
                mb={4}
              >
                <Text color="red.700" fontSize="sm">
                  {error}
                </Text>
              </Box>
            )}

            {loading ? (
              <VStack py={8}>
                <Spinner size="xl" color="#d1a85d" />
                <Text color="gray.600">Loading users...</Text>
              </VStack>
            ) : users.length === 0 ? (
              <VStack py={8}>
                <Text color="gray.600" fontSize="lg">
                  No users found
                </Text>
                <Button
                  leftIcon={<AddIcon />}
                  bg="#d1a85d"
                  color="white"
                  _hover={{ bg: '#c19a4d' }}
                  onClick={handleAddUser}
                >
                  Add First User
                </Button>
              </VStack>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Name</Th>
                      <Th>Email</Th>
                      <Th>Role</Th>
                      <Th>Created At</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {users.map((user) => (
                      <Tr key={user.id}>
                        <Td>{user.id}</Td>
                        <Td fontWeight="600">{user.name}</Td>
                        <Td>{user.email}</Td>
                        <Td>
                          <Badge colorScheme={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </Td>
                        <Td>
                          {new Date(user.created_at).toLocaleDateString()}
                        </Td>
                        <Td>
                          <IconButton
                            icon={<EditIcon />}
                            aria-label="Change Password"
                            size="sm"
                            bg="#d1a85d"
                            color="white"
                            _hover={{ bg: '#c19a4d' }}
                            onClick={() => handleChangePassword(user.id)}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default UserManagement;

