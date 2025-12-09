import { useEffect, useState } from 'react';
import { Box, Heading, Text, VStack, HStack, SimpleGrid, Image, Badge, Input, InputGroup, InputLeftElement, Spinner, Alert, AlertIcon, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, FormControl, FormLabel, Input as CInput } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

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

function CompanyCard({ name, onOpen }) {
  const [failed, setFailed] = useState(false);
  const base = (getCompanyLogoFilename(name) || '').replace(/\.png$/,'');
  const exts = ['png', 'jpg', 'jpeg'];
  const src = `/company_logos/${base}.${exts[0]}`;
  return (
    <Box cursor="pointer" onClick={onOpen}>
      {failed ? (
        <Box
          w="100%"
          h={{ base: '64px', sm: '80px', md: '100px' }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="white"
          borderRadius="md"
          border="none"
          borderColor="white"
          px={2}
        >
          <Text fontSize="sm" fontWeight="semibold" color="gray.700" noOfLines={2} textAlign="center">
            {name}
          </Text>
        </Box>
      ) : (
        <Image
          src={src}
          alt={`${name} Logo`}
          w="100%"
          h={{ base: '64px', sm: '80px', md: '100px' }}
          objectFit="contain"
          data-ext-index={0}
          onError={(e) => {
            const i = Number(e.currentTarget.getAttribute('data-ext-index') || 0);
            const next = i + 1;
            if (next < exts.length) {
              e.currentTarget.setAttribute('data-ext-index', String(next));
              e.currentTarget.src = `/company_logos/${base}.${exts[next]}`;
            } else {
              setFailed(true);
            }
          }}
        />
      )}
    </Box>
  );
}

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ company_name: '', description: '', company_type: '', website: '', linkedin: '', company_logo_link: '' });
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('[Companies] Fetching companies...');
        const res = await api.get('/dashboard/placement/companies');
        const list = res.data?.data?.companies || [];
        console.log('[Companies] Loaded companies:', list.length, list.slice(0, 5));
        setCompanies(list);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load companies';
        console.error('[Companies] Error:', msg, err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = companies.filter(name => name?.toLowerCase().includes(query.toLowerCase()));

  return (
    <AdminLayout>
      <Box bg="white" minH="100vh" pb={10}>
        <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 10 }} pt={{ base: 4, sm: 6, lg: 10 }}>
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between" align="center">
              <Box>
                <Heading as="h1" fontSize={{ base: '2xl', sm: '3xl' }} fontWeight="extrabold" color="gray.800">
                  All Companies
                </Heading>
                <Text fontSize="md" color="gray.600">Browse hiring partners; click for full details</Text>
              </Box>
              <HStack spacing={3}>
                {isSuperAdmin && (
                  <Button colorScheme="green" onClick={() => setIsAddOpen(true)}>Add Company</Button>
                )}
                <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
              </HStack>
            </HStack>

            <InputGroup maxW="md">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.400" />
              </InputLeftElement>
              <Input placeholder="Search companies" value={query} onChange={e => setQuery(e.target.value)} />
            </InputGroup>

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
              <SimpleGrid columns={{ base: 3, sm: 4, md: 6, lg: 8 }} spacing={4}>
                {filtered.length > 0 ? (
                  filtered.map((name, idx) => {
                    const onOpen = () => {
                      console.log('[Companies] Navigating to company detail:', name);
                      navigate(`/placements/company/${encodeURIComponent(name)}`);
                    };
                    return (
                      <CompanyCard key={`${name}-${idx}`} name={name} onOpen={onOpen} />
                    );
                  })
                ) : (
                  <Text color="gray.500">No companies found</Text>
                )}
              </SimpleGrid>
            )}
            {isSuperAdmin && (
              <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Add Company</ModalHeader>
                  <ModalBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl isRequired>
                        <FormLabel>Company Name</FormLabel>
                        <CInput value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        <CInput value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Company Type</FormLabel>
                        <CInput value={form.company_type} onChange={e => setForm({ ...form, company_type: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Website</FormLabel>
                        <CInput value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>LinkedIn</FormLabel>
                        <CInput value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Logo Link</FormLabel>
                        <CInput value={form.company_logo_link} onChange={e => setForm({ ...form, company_logo_link: e.target.value })} />
                      </FormControl>
                    </VStack>
                  </ModalBody>
                  <ModalFooter>
                    <HStack spacing={3}>
                      <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                      <Button colorScheme="green" onClick={async () => {
                        try {
                          await api.post('/dashboard/placement/company', form);
                          setIsAddOpen(false);
                          setForm({ company_name: '', description: '', company_type: '', website: '', linkedin: '', company_logo_link: '' });
                          const res = await api.get('/dashboard/placement/companies');
                          const list = res.data?.data?.companies || [];
                          setCompanies(list);
                        } catch (err) {
                          alert(err.response?.data?.message || 'Failed to add company');
                        }
                      }}>Save</Button>
                    </HStack>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            )}
          </VStack>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default Companies;
