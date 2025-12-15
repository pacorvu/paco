import { useEffect, useMemo, useState } from 'react';
import { Box, Heading, Text, VStack, HStack, Avatar, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Badge, Button, Spinner, Alert, AlertIcon, Input, InputGroup, InputLeftElement, Select } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import api from '../utils/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/dashboard/students');
        setStudents(res.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const schools = useMemo(() => {
    return Array.from(new Set((students || []).map(s => s.school).filter(Boolean))).sort();
  }, [students]);

  const programs = useMemo(() => {
    return Array.from(new Set((students || []).map(s => s.program).filter(Boolean))).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = students;
    if (schoolFilter) {
      list = list.filter(stu => (stu.school || '') === schoolFilter);
    }
    if (programFilter) {
      list = list.filter(stu => (stu.program || '') === programFilter);
    }
    if (!q) return list;
    const cols = ['usn', 'student_name', 'school', 'program', 'specialization', 'contact_number'];
    return list.filter(stu => {
      return cols.some(c => String(stu?.[c] || '').toLowerCase().includes(q));
    });
  }, [students, query, schoolFilter, programFilter]);

  return (
    <AdminLayout>
      <Box bg="#f7f7fa" minH="100vh" pb={10}>
        <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 10 }} pt={{ base: 4, sm: 6, lg: 10 }}>
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between" align="center">
              <Box>
                <Heading as="h1" fontSize={{ base: '2xl', sm: '3xl' }} fontWeight="extrabold" color="gray.800">
                  All Students
                </Heading>
                <Text fontSize="md" color="gray.600">Browse all students; click a row for details</Text>
              </Box>
              <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
            </HStack>

            <InputGroup maxW="lg">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.400" />
              </InputLeftElement>
              <Input placeholder="Search by any field" value={query} onChange={e => setQuery(e.target.value)} />
            </InputGroup>

            <HStack spacing={4}>
              <Select placeholder="Filter by School" value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} maxW="xs">
                {schools.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <Select placeholder="Filter by Program" value={programFilter} onChange={e => setProgramFilter(e.target.value)} maxW="xs">
                {programs.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
              <Button variant="outline" size="sm" whiteSpace="nowrap" onClick={() => { setSchoolFilter(''); setProgramFilter(''); }}>Clear Filters</Button>
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
                      <Th>#</Th>
                      <Th>Name</Th>
                      <Th>USN</Th>
                      <Th>School</Th>
                      <Th>Program</Th>
                      <Th>Specialization</Th>
                      <Th>Email</Th>
                      <Th>Contact</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {[...filtered]
                      .sort((a, b) => {
                        const q = query.trim().toLowerCase();
                        const nameA = String(a.student_name || '').toLowerCase();
                        const nameB = String(b.student_name || '').toLowerCase();

                        if (!q) {
                          return nameA.localeCompare(nameB);
                        }

                        const posNameA = nameA.indexOf(q);
                        const posNameB = nameB.indexOf(q);

                        if (posNameA !== -1 || posNameB !== -1) {
                          if (posNameA !== -1 && posNameB === -1) return -1;
                          if (posNameA === -1 && posNameB !== -1) return 1;
                          if (posNameA !== posNameB) return posNameA - posNameB;
                          return nameA.localeCompare(nameB);
                        }

                        const otherCols = ['usn', 'school', 'program', 'specialization', 'contact_number'];

                        const bestOtherPos = (stu) => {
                          let best = Infinity;
                          for (const c of otherCols) {
                            const val = String(stu?.[c] || '').toLowerCase();
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
                      .map((stu, idx) => (
                      <Tr key={idx} _hover={{ bg: 'gray.50' }} cursor="pointer" onClick={() => navigate(`/placements/student/${encodeURIComponent(stu.usn)}`)}>
                        <Td>{idx + 1}</Td>
                        <Td>
                          <HStack spacing={3} align="center">
                            <Avatar name={stu.student_name} size="sm" />
                            <Text fontWeight="medium">{stu.student_name || '—'}</Text>
                          </HStack>
                        </Td>
                        <Td><Badge colorScheme="blue">{stu.usn || '—'}</Badge></Td>
                        <Td>{stu.school || '—'}</Td>
                        <Td>{stu.program || '—'}</Td>
                        <Td>{stu.specialization || '—'}</Td>
                        <Td>{stu.email_id || '—'}</Td>
                        <Td>{stu.contact_number || '—'}</Td>
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

export default Students;
