import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Heading, Text, VStack, HStack, Image, Badge, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Alert, AlertIcon, Button, SimpleGrid, IconButton, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, FormControl, FormLabel, Input as CInput } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
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

function CompanyLogo({ name, link, size = 64 }) {
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

const CompanyDetail = () => {
  const { companyName } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ company_name: '', description: '', company_type: '', website: '', linkedin: '', company_logo_link: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('[CompanyDetail] Fetching company details for:', companyName);
        const res = await api.get(`/dashboard/placement/company/${encodeURIComponent(companyName)}`);
        const payload = res.data?.data || null;
        console.log('[CompanyDetail] Loaded data:', {
          hasCompany: !!payload?.company,
          placements: (payload?.placements || []).length,
          offers: (payload?.job_offers || []).length,
          students: (payload?.students || []).length
        });
        setData(payload);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load company details';
        console.error('[CompanyDetail] Error:', msg, err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyName]);

  const company = data?.company;
  const placements = data?.placements || [];
  const offers = data?.job_offers || [];
  const students = data?.students || [];

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

  const offersWithStudent = offers.map(o => {
    const s = students.find(st => st.usn === o.usn);
    return {
      usn: o.usn,
      student_name: s?.student_name || '—',
      school: s?.school || '—',
      ctc: formatCTC(o.ctc_min_lpa, o.ctc_max_lpa),
      job_type: o.job_type || '—',
      designation: o.designation || '—',
      offer_letter_status: o.offer_letter_status || '—'
    };
  });

  

  return (
    <AdminLayout>
      <Box bg="#f7f7fa" minH="100vh" pb={10}>
        <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 10 }} pt={{ base: 4, sm: 6, lg: 10 }}>
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
              <Box>
                <Heading as="h1" fontSize={{ base: '2xl', sm: '3xl' }} fontWeight="extrabold" color="gray.800">
                  Company Details
                </Heading>
                <Text fontSize="md" color="gray.600">Full company info with placements and offers</Text>
              </Box>
              <HStack spacing={3}>
                <IconButton aria-label="Edit Company" icon={<EditIcon />} onClick={() => { setEditForm({
                  company_name: company?.company_name || '',
                  description: company?.description || '',
                  company_type: company?.company_type || '',
                  website: company?.website || '',
                  linkedin: company?.linkedin || '',
                  company_logo_link: company?.company_logo_link || ''
                }); setIsEditOpen(true); }} />
                <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
              </HStack>
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
            ) : company ? (
              <>
                <Box bg="white" borderRadius="xl" p={6} boxShadow="lg">
                  <HStack spacing={6} align="start" justify="space-between">
                    <HStack spacing={6} align="start">
                      <CompanyLogo name={company.company_name} link={company.company_logo_link} />
                      <VStack spacing={2} align="start">
                        <Heading as="h2" fontSize="xl">{company.company_name}</Heading>
                        <Text color="gray.600">{company.description || '—'}</Text>
                        <HStack spacing={3}>
                          {company.linkedin && (
                            <Button as="a" href={company.linkedin} target="_blank" rel="noopener noreferrer" size="sm" variant="link" colorScheme="blue">LinkedIn</Button>
                          )}
                          {company.website && (
                            <Button as="a" href={company.website} target="_blank" rel="noopener noreferrer" size="sm" variant="link" colorScheme="purple">Website</Button>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>
                    <Badge colorScheme="blue" alignSelf="flex-start">{company.company_type || '—'}</Badge>
                  </HStack>
                </Box>

                <Box bg="white" borderRadius="xl" p={4} boxShadow="md">
                  <Heading as="h3" fontSize="md" mb={3}>Placements</Heading>
                  {placements.length > 0 ? (
                    <TableContainer overflowX="auto" width="100%" pb={4}>
                      <Table size="sm" width="100%">
                        <Thead position="sticky" top={0} bg="#172e36" zIndex={1} sx={{ th: { py: 3, color: '#febb31' }, 'tr:first-of-type th:first-of-type': { borderTopLeftRadius: '10px' }, 'tr:first-of-type th:last-of-type': { borderTopRightRadius: '10px' } }}>
                          <Tr>
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
                          {placements.map((p, i) => (
                            <Tr key={i}>
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
                  ) : (
                    <Text color="gray.500">No placements data</Text>
                  )}
                </Box>

                <Box bg="white" borderRadius="xl" p={4} boxShadow="md" borderLeft="4px solid" borderColor="teal.500">
                  <Heading as="h3" fontSize="md" mb={3}>Students & Job Offers</Heading>
                  {offersWithStudent.length > 0 ? (
                    <TableContainer>
                      <Table size="sm">
                        <Thead bg="#172e36" sx={{ th: { py: 3, color: '#febb31' }, 'tr:first-of-type th:first-of-type': { borderTopLeftRadius: '10px' }, 'tr:first-of-type th:last-of-type': { borderTopRightRadius: '10px' } }}>
                          <Tr>
                            <Th>USN</Th>
                            <Th>Student Name</Th>
                            <Th>School</Th>
                            <Th>CTC</Th>
                            <Th>Job Type</Th>
                            <Th>Designation</Th>
                            <Th>Offer Letter Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {offersWithStudent.map((row, i) => (
                            <Tr key={i} _hover={{ bg: 'gray.50' }} cursor="pointer" onClick={() => { console.log('[CompanyDetail] Click student row:', row.usn); navigate(`/placements/student/${encodeURIComponent(row.usn)}`); }}>
                              <Td><Badge colorScheme="blue">{row.usn}</Badge></Td>
                              <Td>{row.student_name}</Td>
                              <Td>{row.school}</Td>
                              <Td>{row.ctc}</Td>
                              <Td>{row.job_type}</Td>
                              <Td>{row.designation}</Td>
                              <Td>{row.offer_letter_status}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Text color="gray.500">No student job offer data</Text>
                  )}
                </Box>

                <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>Edit Company</ModalHeader>
                    <ModalBody>
                      <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                          <FormLabel>Company Name</FormLabel>
                          <CInput value={editForm.company_name} onChange={e => setEditForm({ ...editForm, company_name: e.target.value })} />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Description</FormLabel>
                          <CInput value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Company Type</FormLabel>
                          <CInput value={editForm.company_type} onChange={e => setEditForm({ ...editForm, company_type: e.target.value })} />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Website</FormLabel>
                          <CInput value={editForm.website} onChange={e => setEditForm({ ...editForm, website: e.target.value })} />
                        </FormControl>
                        <FormControl>
                          <FormLabel>LinkedIn</FormLabel>
                          <CInput value={editForm.linkedin} onChange={e => setEditForm({ ...editForm, linkedin: e.target.value })} />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Logo Link</FormLabel>
                          <CInput value={editForm.company_logo_link} onChange={e => setEditForm({ ...editForm, company_logo_link: e.target.value })} />
                        </FormControl>
                      </VStack>
                    </ModalBody>
                    <ModalFooter>
                      <HStack spacing={3}>
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button colorScheme="blue" onClick={async () => {
                          try {
                            await api.put(`/dashboard/placement/company/${encodeURIComponent(company?.company_name || '')}`, editForm);
                            setIsEditOpen(false);
                            const res = await api.get(`/dashboard/placement/company/${encodeURIComponent(editForm.company_name)}`);
                            setData(res.data?.data || data);
                          } catch (err) {
                            alert(err.response?.data?.message || 'Failed to update company');
                          }
                        }}>Save</Button>
                      </HStack>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </>
            ) : (
              <Box bg="white" borderRadius="xl" p={8} boxShadow="lg" textAlign="center">
                <Text>No company data</Text>
              </Box>
            )}
          </VStack>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default CompanyDetail;
