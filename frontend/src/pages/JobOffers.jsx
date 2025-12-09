import { useEffect, useMemo, useState } from 'react';
import { Box, Heading, Text, VStack, HStack, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Badge, Button, Spinner, Alert, AlertIcon, Input, InputGroup, InputLeftElement, Select, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, FormControl, FormLabel, Input as CInput } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import api from '../utils/api';

const JobOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const navigate = useNavigate();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ usn: '', company_name: '', designation: '', job_type: '', ctc_min_lpa: '', ctc_max_lpa: '', offer_letter_status: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        // Build offers client-side from placed students data
        const res = await api.get('/dashboard/placement/placed-students');
        const students = res.data?.data || [];
        const flatOffers = students.flatMap(stu => (stu.offers || []).map(o => ({
          usn: stu.usn,
          student_name: stu.student_name,
          company_name: o.company_name,
          designation: o.designation,
          job_type: o.job_type,
          ctc_min_lpa: o.ctc_min_lpa,
          ctc_max_lpa: o.ctc_max_lpa,
          offer_letter_status: o.offer_letter_status,
          year: stu.year || stu.batch_year || stu.graduation_year
        })));
        setOffers(flatOffers);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load job offers');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const companies = useMemo(() => {
    return Array.from(new Set((offers || []).map(o => o.company_name).filter(Boolean))).sort();
  }, [offers]);

  const jobTypes = useMemo(() => {
    return Array.from(new Set((offers || []).map(o => o.job_type).filter(Boolean))).sort();
  }, [offers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = offers;
    if (companyFilter) {
      list = list.filter(o => (o.company_name || '') === companyFilter);
    }
    if (jobTypeFilter) {
      list = list.filter(o => (o.job_type || '') === jobTypeFilter);
    }
    if (!q) return list;
    const cols = ['usn', 'student_name', 'company_name', 'designation', 'job_type'];
    return list.filter(o => cols.some(c => String(o?.[c] || '').toLowerCase().includes(q)));
  }, [offers, query, companyFilter, jobTypeFilter]);

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

  return (
    <AdminLayout>
      <Box bg="#f7f7fa" minH="100vh" pb={10}>
        <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 10 }} pt={{ base: 4, sm: 6, lg: 10 }}>
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between" align="center">
              <Box>
                <Heading as="h1" fontSize={{ base: '2xl', sm: '3xl' }} fontWeight="extrabold" color="gray.800">
                  Job Offers
                </Heading>
                <Text fontSize="md" color="gray.600">All job offers across students and companies</Text>
              </Box>
              <HStack spacing={3}>
                <Button colorScheme="green" onClick={() => setIsAddOpen(true)}>Add Offer</Button>
                <Button variant="outline" colorScheme="purple" onClick={() => navigate('/placements/companies')}>Add New Company</Button>
                <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
              </HStack>
            </HStack>

            <InputGroup maxW="lg">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.400" />
              </InputLeftElement>
              <Input placeholder="Search by student, company, role, type" value={query} onChange={e => setQuery(e.target.value)} />
            </InputGroup>

            <HStack spacing={4}>
              <Select placeholder="Filter by Company" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} maxW="xs">
                {companies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Select placeholder="Filter by Job Type" value={jobTypeFilter} onChange={e => setJobTypeFilter(e.target.value)} maxW="xs">
                {jobTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <Button variant="outline" size="sm" whiteSpace="nowrap" onClick={() => { setCompanyFilter(''); setJobTypeFilter(''); }}>Clear Filters</Button>
              <Button variant="outline" colorScheme="purple" onClick={() => navigate('/placements/companies')}>Add New Company</Button>
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
            ) : (
              <TableContainer bg="white" borderRadius="xl" boxShadow="lg" p={2}>
                <Table size="sm">
                  <Thead bg="#172e36" sx={{ th: { py: 3, color: '#febb31' }, 'tr:first-of-type th:first-of-type': { borderTopLeftRadius: '10px' }, 'tr:first-of-type th:last-of-type': { borderTopRightRadius: '10px' } }}>
                    <Tr>
                      <Th>USN</Th>
                      <Th>Student</Th>
                      <Th>Company</Th>
                      <Th>Designation</Th>
                      <Th>Job Type</Th>
                      <Th>CTC (LPA)</Th>
                      <Th>Offer Letter Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {[...filtered].sort((a, b) => {
                      const ay = a.year || 0;
                      const by = b.year || 0;
                      return by - ay;
                    }).map((o, idx) => (
                      <Tr key={idx} _hover={{ bg: 'gray.50' }}>
                        <Td><Badge colorScheme="blue">{o.usn || '—'}</Badge></Td>
                        <Td>
                          <Button variant="link" onClick={() => navigate(`/placements/student/${encodeURIComponent(o.usn)}`)} sx={{ textDecoration: 'underline' }}>
                            {o.student_name || '—'}
                          </Button>
                        </Td>
                        <Td>
                          <Button variant="link" onClick={() => navigate(`/placements/company/${encodeURIComponent(o.company_name)}`)} sx={{ textDecoration: 'underline' }}>
                            {o.company_name || '—'}
                          </Button>
                        </Td>
                        <Td>{o.designation || '—'}</Td>
                        <Td>{o.job_type || '—'}</Td>
                        <Td>{formatCTC(o.ctc_min_lpa, o.ctc_max_lpa)}</Td>
                        <Td>{o.offer_letter_status || '—'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Add Job Offer</ModalHeader>
                <ModalBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Student USN</FormLabel>
                      <CInput value={form.usn} onChange={e => setForm({ ...form, usn: e.target.value })} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Search Company</FormLabel>
                      <CInput placeholder="Type to filter companies" value={form.companySearch || ''} onChange={e => setForm({ ...form, companySearch: e.target.value })} />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Company</FormLabel>
                      <Select placeholder="Select Company" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })}>
                        {companies.filter(c => !form.companySearch || c.toLowerCase().includes(form.companySearch.toLowerCase())).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Designation</FormLabel>
                      <CInput value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Job Type</FormLabel>
                      <Select placeholder="Select Job Type" value={form.job_type} onChange={e => setForm({ ...form, job_type: e.target.value })}>
                        {jobTypes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <HStack spacing={3}>
                      <FormControl>
                        <FormLabel>CTC Min (LPA)</FormLabel>
                        <CInput value={form.ctc_min_lpa} onChange={e => setForm({ ...form, ctc_min_lpa: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>CTC Max (LPA)</FormLabel>
                        <CInput value={form.ctc_max_lpa} onChange={e => setForm({ ...form, ctc_max_lpa: e.target.value })} />
                      </FormControl>
                    </HStack>
                    <FormControl>
                      <FormLabel>Offer Letter Status</FormLabel>
                      <CInput value={form.offer_letter_status} onChange={e => setForm({ ...form, offer_letter_status: e.target.value })} />
                    </FormControl>
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <HStack spacing={3}>
                    <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button colorScheme="green" onClick={async () => {
                      try {
                        await api.post('/dashboard/placement/job-offers', form);
                        setIsAddOpen(false);
                        const res = await api.get('/dashboard/placement/placed-students');
                        const students = res.data?.data || [];
                        const flatOffers = students.flatMap(stu => (stu.offers || []).map(o => ({
                          usn: stu.usn,
                          student_name: stu.student_name,
                          company_name: o.company_name,
                          designation: o.designation,
                          job_type: o.job_type,
                          ctc_min_lpa: o.ctc_min_lpa,
                          ctc_max_lpa: o.ctc_max_lpa,
                          offer_letter_status: o.offer_letter_status
                        })));
                        setOffers(flatOffers);
                      } catch (err) {
                        alert(err.response?.data?.message || 'Failed to add job offer');
                      }
                    }}>Save</Button>
                  </HStack>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </VStack>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default JobOffers;
