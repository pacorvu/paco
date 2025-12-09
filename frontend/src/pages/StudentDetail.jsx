import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Heading, Text, VStack, HStack, Avatar, Image, Badge, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Alert, AlertIcon, Button } from '@chakra-ui/react';
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

function CompanyLogo({ name, link, size = 48 }) {
  const [failed, setFailed] = useState(false);
  const exts = ['png', 'jpg', 'jpeg'];
  const base = (getCompanyLogoFilename(name) || '').replace(/\.png$/,'');
  const [triedLink, setTriedLink] = useState(false);
  const [extIndex, setExtIndex] = useState(0);
  const [src, setSrc] = useState(link || `/company_logos/${base}.${exts[0]}`);
  if (failed) {
    return (
      <Box
        boxSize={`${size}px`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
        px={2}
      >
        <Text fontSize="xs" fontWeight="semibold" color="gray.700" noOfLines={2} textAlign="center">
          {name}
        </Text>
      </Box>
    );
  }
  return (
    <Image
      src={src}
      alt={name || 'Company'}
      boxSize={`${size}px`}
      objectFit="contain"
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

const StudentDetail = () => {
  const { usn } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/dashboard/placement/student/${encodeURIComponent(usn)}`);
        setData(res.data?.data || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load student details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [usn]);

  const student = data?.student;
  const companies = data?.companies || [];

  const formatCTC = (minStr, maxStr) => {
    const toNum = (v) => {
      if (v === null || v === undefined) return NaN;
      const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
      return isNaN(n) ? NaN : n;
    };
    const min = toNum(minStr);
    const max = toNum(maxStr);
    if (!isNaN(min) && !isNaN(max)) {
      if (min === max) return `${min}`;
      return `${Math.min(min, max)}-${Math.max(min, max)}`;
    }
    if (!isNaN(min)) return `${min}`;
    if (!isNaN(max)) return `${max}`;
    return '—';
  };

  const rows = companies.flatMap(c =>
    (c.offers || []).map(o => ({
      company_name: c.company_name,
      company_logo_link: c.company_logo_link,
      usn: student?.usn,
      student_name: student?.student_name || '—',
      school: student?.school || '—',
      job_type: o.job_type || '—',
      designation: o.designation || '—',
      offer_letter_status: o.offer_letter_status || '—',
      ctc: formatCTC(o.ctc_min_lpa, o.ctc_max_lpa)
    }))
  );

  return (
    <AdminLayout>
      <Box bg="#f7f7fa" minH="100vh" pb={10}>
        <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 10 }} pt={{ base: 4, sm: 6, lg: 10 }}>
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
              <Box>
                <Heading as="h1" fontSize={{ base: '2xl', sm: '3xl' }} fontWeight="extrabold" color="gray.800">
                  Student Details
                </Heading>
                <Text fontSize="md" color="gray.600">Complete profile with company-wise offers</Text>
              </Box>
              <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
            </HStack>

            {loading ? (
              <Box bg="white" borderRadius="xl" p={8} boxShadow="lg" textAlign="center">
                <Spinner size="lg" />
              </Box>
            ) : error ? (
              <Alert status="error" borderRadius="xl" variant="left-accent">
                <AlertIcon />
                {error}
              </Alert>
            ) : student ? (
              <>
                <Box bg="white" borderRadius="xl" p={6} boxShadow="lg">
                  <HStack spacing={6} align="center">
                    <Avatar name={student.student_name} size="lg" />
                    <VStack spacing={1} align="start">
                      <Heading as="h2" fontSize="xl">{student.student_name}</Heading>
                      <HStack spacing={3}>
                        <Badge colorScheme="blue">{student.usn}</Badge>
                        <Badge colorScheme="green">{student.school || '—'}</Badge>
                      </HStack>
                      <Text color="gray.600">{student.program || '—'} • {student.specialization || '—'}</Text>
                      <Text color="gray.500" fontSize="sm">{student.email_id || '—'} • {student.contact_number || '—'}</Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box>
                  <Heading as="h3" fontSize="lg" color="gray.700" mb={3}>Offers</Heading>
                  <TableContainer bg="white" borderRadius="xl" boxShadow="md" p={2} overflowX="auto">
                    <Table size="sm">
                      <Thead position="sticky" top={0} bg="#172e36" zIndex={1} sx={{ th: { py: 3, color: '#febb31' }, 'tr:first-of-type th:first-of-type': { borderTopLeftRadius: '10px' }, 'tr:first-of-type th:last-of-type': { borderTopRightRadius: '10px' } }}>
                        <Tr>
                          <Th>Company</Th>
                          <Th>Designation</Th>
                          <Th>Job Type</Th>
                          <Th>CTC</Th>
                          <Th>Offer Letter Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {rows.map((r, i) => (
                          <Tr key={i} _hover={{ bg: 'gray.50' }}>
                            <Td>
                              <Button variant="link" colorScheme="purple" onClick={() => navigate(`/placements/company/${encodeURIComponent(r.company_name)}`)}>
                                <HStack spacing={3} align="center">
                                  <CompanyLogo name={r.company_name} link={r.company_logo_link} size={56} />
                                  <Text fontWeight="medium">{r.company_name}</Text>
                                </HStack>
                              </Button>
                            </Td>
                            <Td>{r.designation}</Td>
                            <Td>{r.job_type}</Td>
                            <Td>{r.ctc}</Td>
                            <Td>{r.offer_letter_status}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            ) : (
              <Box bg="white" borderRadius="xl" p={8} boxShadow="lg" textAlign="center">
                <Text>No student data</Text>
              </Box>
            )}
          </VStack>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default StudentDetail;
