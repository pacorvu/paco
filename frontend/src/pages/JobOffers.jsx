import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Heading, Text, VStack, HStack, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Badge, Button, Spinner, Alert, AlertIcon, Input, InputGroup, InputLeftElement, Select, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, FormControl, FormLabel, Input as CInput } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import api from '../utils/api';

const JobOffers = () => {
  const [offers, setOffers] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const navigate = useNavigate();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ company_name: '', designation: '', job_type: '', ctc_min_lpa: '', ctc_max_lpa: '', offer_letter_status: '' });
  const [companyQuery, setCompanyQuery] = useState('');
  const [companyOpen, setCompanyOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');
  const [studentOpen, setStudentOpen] = useState(false);
  const [selectedUSNs, setSelectedUSNs] = useState([]);
  const [ctcSort, setCtcSort] = useState('none');
  const cancelRef = useRef(null);
  const studentBoxRef = useRef(null);
  const companyBoxRef = useRef(null);

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
        setStudentsList(students);
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (studentOpen && studentBoxRef.current && !studentBoxRef.current.contains(e.target)) {
        setStudentOpen(false);
      }
      if (companyOpen && companyBoxRef.current && !companyBoxRef.current.contains(e.target)) {
        setCompanyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [studentOpen, companyOpen]);

  const jobTypes = useMemo(() => {
    const map = new Map();
    (offers || []).forEach(o => {
      const raw = (o.job_type || '').trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (!map.has(key)) {
        const display = raw
          .split(' ')
          .map(s => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s))
          .join(' ');
        map.set(key, display);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [offers]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    const base = studentsList || [];
    if (!q) return base;
    return base.filter(stu => {
      return [stu.student_name, stu.usn, stu.school, stu.program].some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [studentsList, studentQuery]);

  const filteredCompanies = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(c => c.toLowerCase().includes(q));
  }, [companies, companyQuery]);

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

  const ctcValue = (o) => {
    const toNum = (v) => {
      if (v === null || v === undefined) return NaN;
      const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
      return isNaN(n) ? NaN : n;
    };
    const min = toNum(o?.ctc_min_lpa);
    const max = toNum(o?.ctc_max_lpa);
    if (!isNaN(max)) return max;
    if (!isNaN(min)) return min;
    return NaN;
  };

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
                      <Th>
                        <Button variant="ghost" size="sm" onClick={() => setCtcSort(s => s === 'none' ? 'asc' : s === 'asc' ? 'desc' : 'none')}>
                          <HStack spacing={2} align="center">
                            <Text color="#febb31">CTC (LPA)</Text>
                            <HStack spacing={0} align="center">
                              <FiArrowUp color={ctcSort === 'asc' ? '#febb31' : '#9fb6c0'} />
                              <FiArrowDown color={ctcSort === 'desc' ? '#febb31' : '#9fb6c0'} />
                            </HStack>
                          </HStack>
                        </Button>
                      </Th>
                      <Th>Offer Letter Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {[...filtered]
                      .sort((a, b) => {
                        const q = query.trim().toLowerCase();

                        if (ctcSort !== 'none') {
                          const va = ctcValue(a);
                          const vb = ctcValue(b);
                          const aIsNaN = isNaN(va);
                          const bIsNaN = isNaN(vb);
                          if (aIsNaN !== bIsNaN) return aIsNaN ? 1 : -1;
                          if (!aIsNaN && !bIsNaN && va !== vb) {
                            return ctcSort === 'asc' ? va - vb : vb - va;
                          }
                        }

                        if (!q) {
                          const ay = a.year || 0;
                          const by = b.year || 0;
                          return by - ay;
                        }

                        const nameA = String(a.student_name || '').toLowerCase();
                        const nameB = String(b.student_name || '').toLowerCase();
                        const posNameA = nameA.indexOf(q);
                        const posNameB = nameB.indexOf(q);

                        if (posNameA !== -1 || posNameB !== -1) {
                          if (posNameA !== -1 && posNameB === -1) return -1;
                          if (posNameA === -1 && posNameB !== -1) return 1;
                          if (posNameA !== posNameB) return posNameA - posNameB;
                          return nameA.localeCompare(nameB);
                        }

                        const compA = String(a.company_name || '').toLowerCase();
                        const compB = String(b.company_name || '').toLowerCase();
                        const posCompA = compA.indexOf(q);
                        const posCompB = compB.indexOf(q);

                        if (posCompA !== -1 || posCompB !== -1) {
                          if (posCompA !== -1 && posCompB === -1) return -1;
                          if (posCompA === -1 && posCompB !== -1) return 1;
                          if (posCompA !== posCompB) return posCompA - posCompB;
                          return compA.localeCompare(compB);
                        }

                        const otherCols = ['designation', 'job_type', 'usn'];
                        const bestOtherPos = (row) => {
                          let best = Infinity;
                          for (const c of otherCols) {
                            const val = String(row?.[c] || '').toLowerCase();
                            const idx = val.indexOf(q);
                            if (idx !== -1 && idx < best) best = idx;
                          }
                          return best;
                        };

                        const posOtherA = bestOtherPos(a);
                        const posOtherB = bestOtherPos(b);

                        if (posOtherA !== posOtherB) return posOtherA - posOtherB;
                        return nameA.localeCompare(nameB);
                      })
                      .map((o, idx) => (
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

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} size="xl" initialFocusRef={cancelRef}>
              <ModalOverlay />
              <ModalContent maxW="4xl">
                <ModalHeader>Add Job Offer</ModalHeader>
                <ModalBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Students</FormLabel>
                      <Box position="relative" ref={studentBoxRef}>
                        <HStack spacing={2} wrap="wrap" mb={2}>
                          {selectedUSNs.map(usn => (
                            <HStack key={usn} spacing={1} p={1} borderRadius="md" border="1px solid" borderColor="gray.200" bg="gray.50">
                              <Badge colorScheme="blue">{usn}</Badge>
                              <Button size="xs" variant="ghost" onClick={() => setSelectedUSNs(prev => prev.filter(u => u !== usn))}>Remove</Button>
                            </HStack>
                          ))}
                        </HStack>
                        <CInput
                          placeholder="Type name, USN, school or program"
                          value={studentQuery}
                          onChange={e => { setStudentQuery(e.target.value); setStudentOpen(true); }}
                          onFocus={() => setStudentOpen(true)}
                          onBlur={() => setStudentOpen(false)}
                        />
                        {studentOpen && (
                          <Box position="absolute" zIndex={10} bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" mt={1} maxH="360px" overflowY="auto" w="100%">
                            {(filteredStudents || []).map(stu => (
                              <Box
                                key={stu.usn}
                                px={3}
                                py={3}
                                _hover={{ bg: 'gray.100' }}
                                cursor="pointer"
                                onMouseDown={() => {
                                  setSelectedUSNs(prev => prev.includes(stu.usn) ? prev : [...prev, stu.usn]);
                                  setStudentQuery('');
                                  setStudentOpen(false);
                                }}
                              >
                                <HStack spacing={3}>
                                  <Text fontWeight="semibold">{stu.student_name}</Text>
                                  <Badge colorScheme="blue">{stu.usn}</Badge>
                                  <Text color="gray.600">{stu.school || '—'}</Text>
                                  <Text color="gray.600">{stu.program || '—'}</Text>
                                </HStack>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Company</FormLabel>
                      <Box position="relative" ref={companyBoxRef}>
                        <CInput
                          placeholder="Search or type company"
                          value={companyQuery}
                          onChange={e => { setCompanyQuery(e.target.value); setCompanyOpen(true); }}
                          onFocus={() => setCompanyOpen(true)}
                          onBlur={() => setCompanyOpen(false)}
                        />
                        {companyOpen && (
                          <Box position="absolute" zIndex={10} bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" mt={1} maxH="360px" overflowY="auto" w="100%">
                            {(filteredCompanies || []).map(c => (
                              <Box
                                key={c}
                                px={3}
                                py={3}
                                _hover={{ bg: 'gray.100' }}
                                cursor="pointer"
                                onMouseDown={() => { setForm({ ...form, company_name: c }); setCompanyQuery(c); setCompanyOpen(false); }}
                              >
                                <Text>{c}</Text>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
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
                    <Button ref={cancelRef} variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button colorScheme="green" onClick={async () => {
                      try {
                        const usnList = selectedUSNs;
                        if (usnList.length === 0) {
                          alert('Select at least one student');
                          return;
                        }
                        const companyValue = form.company_name || companyQuery;
                        if (!companyValue) {
                          alert('Select a company');
                          return;
                        }
                        const payloadBase = {
                          company_name: companyValue,
                          designation: form.designation,
                          job_type: form.job_type,
                          ctc_min_lpa: form.ctc_min_lpa,
                          ctc_max_lpa: form.ctc_max_lpa,
                          offer_letter_status: form.offer_letter_status
                        };
                        await Promise.all(usnList.map(usn => api.post('/dashboard/placement/job-offers', { ...payloadBase, usn })));
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
                        setStudentsList(students);
                        setSelectedUSNs([]);
                        setCompanyQuery('');
                        setForm({ company_name: '', designation: '', job_type: '', ctc_min_lpa: '', ctc_max_lpa: '', offer_letter_status: '' });
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
