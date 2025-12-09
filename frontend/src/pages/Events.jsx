import { useEffect, useMemo, useState } from 'react';
import { Box, Heading, Text, VStack, HStack, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Badge, Button, Spinner, Alert, AlertIcon, Input, InputGroup, InputLeftElement, Select, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, FormControl, FormLabel, Input as CInput } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import api from '../utils/api';

const Events = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ company_name: '', tpo: '', year: '', school: '', course: '', job_profile: '', job_type: '', avg_internship_stipend: '', ctc_in_lpa: '', final_selects: '', company_remarks: '' });
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({ company_name: '', description: '', company_type: '', website: '', linkedin: '', company_logo_link: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        // Aggregate placements across companies by fetching company details
        const companiesRes = await api.get('/dashboard/placement/companies');
        const companyNames = companiesRes.data?.data?.companies || [];
        const details = await Promise.all(
          companyNames.map(name => api.get(`/dashboard/placement/company/${encodeURIComponent(name)}`).then(r => ({ name, data: r.data?.data || {} })).catch(() => ({ name, data: {} })))
        );
        const allPlacements = details.flatMap(({ data }) => (data.placements || []).map(p => ({
          ...p,
          company_name: data.company?.company_name || p.company_name
        })));
        setRows(allPlacements);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load placements');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const companies = useMemo(() => {
    return Array.from(new Set((rows || []).map(r => r.company_name).filter(Boolean))).sort();
  }, [rows]);

  const years = useMemo(() => {
    return Array.from(new Set((rows || []).map(r => r.year).filter(Boolean))).sort((a,b)=>a-b);
  }, [rows]);

  const schools = useMemo(() => {
    return Array.from(new Set((rows || []).map(r => r.school).filter(Boolean))).sort();
  }, [rows]);

  const jobTypes = useMemo(() => {
    return Array.from(new Set((rows || []).map(r => r.job_type || r.type_of_hiring).filter(Boolean))).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (companyFilter) list = list.filter(r => (r.company_name || '') === companyFilter);
    if (yearFilter) list = list.filter(r => String(r.year || '') === String(yearFilter));
    if (schoolFilter) list = list.filter(r => (r.school || '') === schoolFilter);
    if (jobTypeFilter) list = list.filter(r => (r.job_type || r.type_of_hiring || '') === jobTypeFilter);
    if (!q) return list;
    const cols = ['company_name', 'tpo', 'year', 'school', 'course', 'job_profile', 'job_type'];
    return list.filter(r => cols.some(c => String(r?.[c] || '').toLowerCase().includes(q)));
  }, [rows, query, companyFilter, yearFilter, schoolFilter, jobTypeFilter]);

  return (
    <AdminLayout>
      <Box bg="#f7f7fa" minH="100vh" pb={10}>
        <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 10 }} pt={{ base: 4, sm: 6, lg: 10 }}>
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between" align="center">
              <Box>
                <Heading as="h1" fontSize={{ base: '2xl', sm: '3xl' }} fontWeight="extrabold" color="gray.800">
                  Events
                </Heading>
                <Text fontSize="md" color="gray.600">All placements table details with links to companies</Text>
              </Box>
              <HStack spacing={3}>
                <Button colorScheme="green" onClick={() => setIsAddOpen(true)}>Add Event</Button>
                <Button variant="outline" colorScheme="purple" onClick={() => navigate('/placements/companies')}>Add New Company</Button>
                <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
              </HStack>
            </HStack>

            <InputGroup maxW="lg">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.400" />
              </InputLeftElement>
              <Input placeholder="Search by company, role, school, year" value={query} onChange={e => setQuery(e.target.value)} />
            </InputGroup>

            <HStack spacing={4}>
              <Select placeholder="Filter by Company" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} maxW="xs">
                {companies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Select placeholder="Filter by Year" value={yearFilter} onChange={e => setYearFilter(e.target.value)} maxW="xs">
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
              <Select placeholder="Filter by School" value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} maxW="xs">
                {schools.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <Select placeholder="Filter by Job Type" value={jobTypeFilter} onChange={e => setJobTypeFilter(e.target.value)} maxW="xs">
                {jobTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <Button variant="outline" size="sm" whiteSpace="nowrap" onClick={() => { setCompanyFilter(''); setYearFilter(''); setSchoolFilter(''); setJobTypeFilter(''); }}>Clear Filters</Button>
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
                      <Th>Company</Th>
                      <Th>TPO</Th>
                      <Th>Year</Th>
                      <Th>School</Th>
                      <Th>Course</Th>
                      <Th>Job Profile</Th>
                      <Th>Job Type</Th>
                      <Th>Avg Internship Stipend</Th>
                      <Th>CTC in LPA</Th>
                      <Th>Final Selects</Th>
                      <Th>Company Remarks</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {[...filtered].sort((a, b) => (parseInt(b.year || 0, 10) || 0) - (parseInt(a.year || 0, 10) || 0)).map((p, i) => (
                      <Tr key={i} _hover={{ bg: 'gray.50' }}>
                        <Td>
                          <Button variant="link" colorScheme="purple" onClick={() => navigate(`/placements/company/${encodeURIComponent(p.company_name)}`)}>
                            {p.company_name || '—'}
                          </Button>
                        </Td>
                        <Td>{p.tpo || '—'}</Td>
                        <Td><Badge colorScheme="gray">{p.year || '—'}</Badge></Td>
                        <Td>{p.school || '—'}</Td>
                        <Td>{p.course || '—'}</Td>
                        <Td>{p.job_profile || '—'}</Td>
                        <Td>{p.job_type || p.type_of_hiring || '—'}</Td>
                        <Td>{p.avg_internship_stipend ?? '—'}</Td>
                        <Td>{p.ctc_in_lpa ?? '—'}</Td>
                        <Td><Badge colorScheme="blue">{p.final_selects ?? '—'}</Badge></Td>
                        <Td>{p.company_remarks || '—'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Add Event</ModalHeader>
                <ModalBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired={!isNewCompany}>
                      <FormLabel>Company</FormLabel>
                      {!isNewCompany ? (
                        <>
                          <CInput placeholder="Type to filter companies" value={form.companySearch || ''} onChange={e => setForm({ ...form, companySearch: e.target.value })} mb={2} />
                          <Select placeholder="Select Company" value={form.company_name} onChange={e => {
                          const val = e.target.value;
                          if (val === '__new__') {
                            setIsNewCompany(true);
                            setForm({ ...form, company_name: '' });
                          } else {
                            setForm({ ...form, company_name: val });
                          }
                        }}>
                          <option value="__new__">Add new company…</option>
                          {companies.filter(c => !form.companySearch || c.toLowerCase().includes((form.companySearch || '').toLowerCase())).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          </Select>
                        </>
                      ) : (
                        <VStack spacing={3} align="stretch">
                          <CInput placeholder="Company Name" value={newCompany.company_name} onChange={e => setNewCompany({ ...newCompany, company_name: e.target.value })} />
                          <CInput placeholder="Description" value={newCompany.description} onChange={e => setNewCompany({ ...newCompany, description: e.target.value })} />
                          <CInput placeholder="Company Type" value={newCompany.company_type} onChange={e => setNewCompany({ ...newCompany, company_type: e.target.value })} />
                          <CInput placeholder="Website" value={newCompany.website} onChange={e => setNewCompany({ ...newCompany, website: e.target.value })} />
                          <CInput placeholder="LinkedIn" value={newCompany.linkedin} onChange={e => setNewCompany({ ...newCompany, linkedin: e.target.value })} />
                          <CInput placeholder="Logo Link" value={newCompany.company_logo_link} onChange={e => setNewCompany({ ...newCompany, company_logo_link: e.target.value })} />
                          <HStack>
                            <Button size="sm" onClick={() => setIsNewCompany(false)}>Use existing</Button>
                          </HStack>
                        </VStack>
                      )}
                    </FormControl>
                    <HStack spacing={3}>
                      <FormControl>
                        <FormLabel>Year</FormLabel>
                        <CInput value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>TPO</FormLabel>
                        <CInput value={form.tpo} onChange={e => setForm({ ...form, tpo: e.target.value })} />
                      </FormControl>
                    </HStack>
                    <HStack spacing={3}>
                      <FormControl>
                        <FormLabel>School</FormLabel>
                        <CInput value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Course</FormLabel>
                        <CInput value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} />
                      </FormControl>
                    </HStack>
                    <FormControl>
                      <FormLabel>Job Profile</FormLabel>
                      <CInput value={form.job_profile} onChange={e => setForm({ ...form, job_profile: e.target.value })} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Job Type</FormLabel>
                      <CInput value={form.job_type} onChange={e => setForm({ ...form, job_type: e.target.value })} />
                    </FormControl>
                    <HStack spacing={3}>
                      <FormControl>
                        <FormLabel>Avg Internship Stipend</FormLabel>
                        <CInput value={form.avg_internship_stipend} onChange={e => setForm({ ...form, avg_internship_stipend: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>CTC in LPA</FormLabel>
                        <CInput value={form.ctc_in_lpa} onChange={e => setForm({ ...form, ctc_in_lpa: e.target.value })} />
                      </FormControl>
                    </HStack>
                    <HStack spacing={3}>
                      <FormControl>
                        <FormLabel>Final Selects</FormLabel>
                        <CInput value={form.final_selects} onChange={e => setForm({ ...form, final_selects: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Company Remarks</FormLabel>
                        <CInput value={form.company_remarks} onChange={e => setForm({ ...form, company_remarks: e.target.value })} />
                      </FormControl>
                    </HStack>
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <HStack spacing={3}>
                    <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button colorScheme="green" onClick={async () => {
                      try {
                        let companyName = form.company_name;
                        if (isNewCompany) {
                          await api.post('/dashboard/placement/company', newCompany);
                          companyName = newCompany.company_name;
                        }
                        await api.post('/dashboard/placement/placements', { ...form, company_name: companyName });
                        setIsAddOpen(false);
                        setIsNewCompany(false);
                        setNewCompany({ company_name: '', description: '', company_type: '', website: '', linkedin: '', company_logo_link: '' });
                        const companiesRes = await api.get('/dashboard/placement/companies');
                        const companyNames = companiesRes.data?.data?.companies || [];
                        const details = await Promise.all(
                          companyNames.map(name => api.get(`/dashboard/placement/company/${encodeURIComponent(name)}`).then(r => ({ name, data: r.data?.data || {} })).catch(() => ({ name, data: {} })))
                        );
                        const allPlacements = details.flatMap(({ data }) => (data.placements || []).map(p => ({
                          ...p,
                          company_name: data.company?.company_name || p.company_name
                        })));
                        setRows(allPlacements);
                      } catch (err) {
                        alert(err.response?.data?.message || 'Failed to add event');
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

export default Events;
