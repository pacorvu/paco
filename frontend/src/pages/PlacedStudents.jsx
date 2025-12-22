import { useEffect, useState } from 'react';
import { Box, Heading, Text, VStack, HStack, Avatar, Image, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Badge, Button, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../utils/api';

function getCompanyLogoFilename(name) {
  if (!name) return '';
  const normalized = String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/-*\d+$/, '');
  return normalized + '.png';
}

function CompanyLogo({ name, link }) {
  const [failed, setFailed] = useState(false);
  const exts = ['png', 'jpg', 'jpeg'];
  const base = (getCompanyLogoFilename(name) || '').replace(/\.png$/,'');
  const [triedLink, setTriedLink] = useState(false);
  const [extIndex, setExtIndex] = useState(0);
  const [src, setSrc] = useState(link || `/company_logos/${base}.${exts[0]}`);
  if (failed) {
    return (
      <Box
        boxSize="32px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
        px={1}
      >
        <Text fontSize="10px" fontWeight="semibold" color="gray.700" noOfLines={2} textAlign="center">
          {name}
        </Text>
      </Box>
    );
  }
  return (
    <Image
      src={src}
      alt={name || 'Company'}
      boxSize="32px"
      objectFit="contain"
      bg="white"
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      onError={() => {
        if (link && !triedLink) {
          setTriedLink(true);
          setSrc(`/company_logos/${base}.${exts[0]}`);
          return;
        }
        const next = extIndex + 1;
        if (next < exts.length) {
          setExtIndex(next);
          setSrc(`/company_logos/${base}.${exts[next]}`);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

const PlacedStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/dashboard/placement/placed-students');
        setStudents(res.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load placed students');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AdminLayout>
      <Box bg="#f7f7fa" minH="100vh" pb={10}>
        <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 10 }} pt={{ base: 4, sm: 6, lg: 10 }}>
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading as="h1" fontSize={{ base: '2xl', sm: '3xl' }} fontWeight="extrabold" color="gray.800">
                Placed Students
              </Heading>
              <Text fontSize="md" color="gray.600">Basic details with offers; click a student for full details</Text>
            </Box>

            {loading ? (
              <Box bg="white" borderRadius="xl" p={8} boxShadow="lg" textAlign="center">
                <Spinner size="lg" />
              </Box>
            ) : error ? (
              <Alert status="error" borderRadius="xl" variant="left-accent">
                <AlertIcon />
                {error}
              </Alert>
            ) : (
              <TableContainer bg="white" borderRadius="xl" boxShadow="lg" p={2}>
                <Table size="sm">
              <Thead bg="#172e36" sx={{ th: { py: 3, color: '#febb31' }, 'tr:first-of-type th:first-of-type': { borderTopLeftRadius: '10px' }, 'tr:first-of-type th:last-of-type': { borderTopRightRadius: '10px' } }}>
                    <Tr>
                      <Th>Student</Th>
                      <Th>USN</Th>
                      <Th>School</Th>
                      <Th>Program</Th>
                      <Th>Offers</Th>
                      <Th textAlign="right">Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {students.map(stu => (
                      <Tr key={stu.usn} _hover={{ bg: 'gray.50' }}>
                        <Td>
                          <HStack spacing={3}>
                            <Avatar name={stu.student_name} size="sm" />
                            <VStack spacing={0} align="start">
                              <Text fontWeight="medium" color="gray.800">{stu.student_name}</Text>
                              <Text fontSize="xs" color="gray.500">{stu.email_id || '—'}</Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td><Badge colorScheme="blue">{stu.usn}</Badge></Td>
                        <Td>{stu.school || '—'}</Td>
                        <Td>{stu.program || '—'}</Td>
                        <Td>
                          <HStack spacing={3} wrap="wrap">
                            {stu.offers.map((o, idx) => (
                              <HStack key={idx} spacing={2} p={1} borderRadius="md" border="1px solid" borderColor="gray.200" bg="gray.50" cursor="pointer" onClick={() => navigate(`/placements/company/${encodeURIComponent(o.company_name)}`)}>
                                <CompanyLogo name={o.company_name} link={o.company_logo_link} />
                                <VStack spacing={0} align="start">
                                  <Text fontSize="sm" fontWeight="semibold" color="purple.600">{o.company_name}</Text>
                                  <Text fontSize="xs" color="gray.600">{o.designation || o.job_type || 'Offer'}</Text>
                                </VStack>
                              </HStack>
                            ))}
                          </HStack>
                        </Td>
                        <Td textAlign="right">
                          <Button size="sm" colorScheme="blue" onClick={() => navigate(`/placements/student/${encodeURIComponent(stu.usn)}`)}>View Details</Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </VStack>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default PlacedStudents;
