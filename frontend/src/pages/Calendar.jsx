import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Box, Heading, Text, VStack, HStack, Button, IconButton, Grid, GridItem, Badge, Spinner, Alert, AlertIcon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, FormControl, FormLabel, Input as CInput, Select, Divider, Switch, InputGroup, ButtonGroup, Image } from '@chakra-ui/react';

import { FiChevronLeft, FiChevronRight, FiPlus, FiTrash } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import api from '../utils/api';

const Calendar = () => {
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [events, setEvents] = useState([]);
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [form, setForm] = useState({ title: '', description: '', date: '', start_time: '', end_time: '', notification_remarks: '', isPlacement: false, placement_company_name: '', placement_year: '' });
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [startMeridiem, setStartMeridiem] = useState('AM');
  const [startTimeError, setStartTimeError] = useState('');
  const [linkPlacement, setLinkPlacement] = useState(false);
  const [placementModalOpen, setPlacementModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyPlacements, setCompanyPlacements] = useState([]);
  const [placementCompanySearch, setPlacementCompanySearch] = useState('');
  const [placementCompanyName, setPlacementCompanyName] = useState('');
  const [newCompany, setNewCompany] = useState({ company_name: '', description: '', company_type: '', website: '', linkedin: '', company_logo_link: '' });
  const [placementSelection, setPlacementSelection] = useState('');
  const [isNewPlacement, setIsNewPlacement] = useState(false);
  const [placementItemSearch, setPlacementItemSearch] = useState('');
  const [pendingPlacementCompanyName, setPendingPlacementCompanyName] = useState('');
  const [pendingPlacementYear, setPendingPlacementYear] = useState('');
  const [pendingPlacementId, setPendingPlacementId] = useState(null);
  const [placementForm, setPlacementForm] = useState({ year: '', tpo: '', school: '', course: '', job_profile: '', job_type: '', avg_internship_stipend: '', ctc_in_lpa: '', final_selects: '', company_remarks: '' });
  const [companyMode, setCompanyMode] = useState('');
  const [placementMode, setPlacementMode] = useState('');
  const [linkStep, setLinkStep] = useState(1);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [placementDropdownOpen, setPlacementDropdownOpen] = useState(false);
  const companySearchInputRef = useRef(null);
  const placementSearchInputRef = useRef(null);
  const companyBoxRef = useRef(null);
  const placementBoxRef = useRef(null);
  const modalFocusRef = useRef(null);
  const [companyLogoFailed, setCompanyLogoFailed] = useState(false);

  

  const range = useMemo(() => {
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
    const startIdx = firstDay.getDay();
    const totalDays = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    const weeks = Math.ceil((startIdx + totalDays) / 7);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - startIdx);
    const days = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    const end = days[days.length - 1];
    return { days, start, end, weeks };
  }, [current]);

  const monthEvents = useMemo(() => {
    const ym = current.getMonth();
    const yf = current.getFullYear();
    return events.filter(e => {
      const ed = new Date(e.event_date);
      return ed.getMonth() === ym && ed.getFullYear() === yf;
    });
  }, [events, current]);

  const getCompanyLogoFilename = (companyName) => {
    if (!companyName) return '';
    const normalized = String(companyName).trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').replace(/-*\d+$/, '');
    return normalized + '.png';
  };
  const getCompanyLogoPath = (companyName) => {
    const filename = getCompanyLogoFilename(companyName);
    return `/company_logos/${filename}`;
  };

  useEffect(() => {
    const handler = (e) => {
      const t = e.target;
      const inCompany = companyBoxRef.current && companyBoxRef.current.contains(t);
      const inPlacement = placementBoxRef.current && placementBoxRef.current.contains(t);
      if (!inCompany) {
        setCompanyDropdownOpen(false);
        if (companySearchInputRef.current) companySearchInputRef.current.blur();
      }
      if (!inPlacement) {
        setPlacementDropdownOpen(false);
        if (placementSearchInputRef.current) placementSearchInputRef.current.blur();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  const fetchCompanies = async () => {
    try {
      const res = await api.get('/dashboard/placement/companies');
      setCompanies(res.data?.data?.companies || []);
    } catch {
      setCompanies([]);
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const startStr = formatDate(range.start);
      const endStr = formatDate(range.end);
      const res = await api.get(`/calendar/events?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`);
      setEvents(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const formatDMY = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}-${m}-${y}`;
  };
  const to24h = (hour12, minute, meridiem) => {
    let h = hour12 % 12;
    if (meridiem === 'PM') h += 12;
    if (meridiem === 'AM' && hour12 === 12) h = 0;
    return `${String(h).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
  };
  const dateColors = ['pink','blue','purple','orange','teal','cyan','red','yellow'];
  const getDateColorName = (d) => dateColors[(d.getDate() - 1) % dateColors.length];
  const now = new Date();
  const nowHour12 = ((now.getHours() + 11) % 12) + 1;
  const nowMinute = String(now.getMinutes()).padStart(2, '0');
  const validateStart = (hStr, mStr) => {
    const h = hStr === '' ? NaN : parseInt(hStr, 10);
    const m = mStr === '' ? NaN : parseInt(mStr, 10);
    if (hStr !== '' && (isNaN(h) || h < 1 || h > 12)) {
      setStartTimeError('Hour must be 1-12');
      return false;
    }
    if (mStr !== '' && (isNaN(m) || m < 0 || m > 59)) {
      setStartTimeError('Minute must be 00–59');
      return false;
    }
    setStartTimeError('');
    return hStr !== '' && mStr !== '';
  };
  const loadCompanyPlacements = async (name) => {
    try {
      const res = await api.get(`/dashboard/placement/company/${encodeURIComponent(name)}`);
      const data = res.data?.data || {};
      setCompanyPlacements(data.placements || []);
    } catch {
      setCompanyPlacements([]);
    }
  };

  const openAddForDate = (d) => {
    setSelectedDate(d);
    const iso = formatDate(d);
    setForm({ title: '', description: '', date: iso, start_time: '', end_time: '', notification_remarks: '', isPlacement: false, placement_company_name: '', placement_year: '' });
    setIsAddOpen(true);
  };

  const handleDayClick = (d) => {
    setSelectedDate(d);
    if (isAddOpen) {
      setForm(prev => ({ ...prev, date: formatDate(d) }));
    }
  };

  const saveEvent = async () => {
    try {
      const startValid = validateStart(startHour, startMinute);
      const startStr = startValid ? to24h(parseInt(startHour,10), parseInt(startMinute,10), startMeridiem) : null;
      const companyName = pendingPlacementCompanyName || null;
      const placementId = pendingPlacementId || null;
      const payload = {
        title: form.title,
        description: form.description,
        event_date: form.date,
        start_time: startStr,
        end_time: null,
        is_all_day: !startStr,
        status: 'scheduled',
        notification_remarks: form.notification_remarks || null,
        placement_company_name: linkPlacement ? (companyName || null) : null,
        placement_year: linkPlacement ? (pendingPlacementYear ? parseInt(pendingPlacementYear, 10) : null) : null,
        placement_id: linkPlacement ? placementId : null
      };
      await api.post('/calendar/events', payload);
      setIsAddOpen(false);
      await fetchEvents();
      const parts = String(form.date).split('-');
      const y = parseInt(parts[0] || '0', 10);
      const m = parseInt(parts[1] || '1', 10) - 1;
      const day = parseInt(parts[2] || '1', 10);
      setSelectedDate(new Date(y, m, day));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save event');
    }
  };

  const deleteEvent = async (id) => {
    try {
      await api.delete(`/calendar/events/${encodeURIComponent(id)}`);
      await fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const dayEvents = (d) => {
    const iso = formatDate(d);
    return monthEvents.filter(e => String(e.event_date).slice(0, 10) === iso);
  };

  return (
    <AdminLayout>
      <Box bg="#f7f7fa" minH="100vh" pb={10}>
        <Box maxW="100%" mx="auto" px={{ base: 4, sm: 6, lg: 10 }} pt={{ base: 4, sm: 6, lg: 10 }}>
          <VStack spacing={6} align="stretch">

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
              <HStack align="stretch" spacing={6}>
                <Box flex="1" bg="white" borderRadius="xl" p={0} boxShadow="lg" height="100%" overflow="hidden">
                  <Box bg="green.700" px={6} py={4} color="white">
                    <HStack justify="center" align="center" spacing={4}>
                      <IconButton aria-label="Previous month" size="sm" variant="ghost" colorScheme="whiteAlpha" icon={<FiChevronLeft />} onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))} />
                      <Heading as="h1" fontSize={{ base: 'lg', sm: 'xl' }} fontWeight="bold" textTransform="uppercase">
                        {current.toLocaleString(undefined, { month: 'short' })} {current.getFullYear()}
                      </Heading>
                      <IconButton aria-label="Next month" size="sm" variant="ghost" colorScheme="whiteAlpha" icon={<FiChevronRight />} onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))} />
                    </HStack>
                  </Box>
                  <VStack spacing={3} align="stretch" height="100%">
                    <Grid templateColumns="repeat(7, 1fr)" gap={0}>
                      {['SU','MO','TU','WE','TH','FR','SA'].map((w) => (
                        <Box key={w} bg="#fad373" py={4} px={3}>
                          <Text textAlign="center" fontSize="md" fontWeight="bold" color="gray.900">{w}</Text>
                        </Box>
                      ))}
                    </Grid>
                    <Grid templateColumns="repeat(7, 1fr)" templateRows={`repeat(${range.weeks}, 12vh)`} gap={0} borderTop="1px solid" borderLeft="1px solid" borderColor="gray.200">
                      {range.days.map((d, idx) => {
                        const inMonth = d.getMonth() === current.getMonth();
                        const evs = dayEvents(d);
                        const isSelected = d.toDateString() === selectedDate.toDateString();
                        const isSunday = d.getDay() === 0;
                        const isToday = new Date().toDateString() === d.toDateString();
                        const colorName = getDateColorName(d);
                        const hasEvents = evs.length > 0;
                        return (
                          <GridItem key={idx} cursor="pointer" onClick={() => handleDayClick(d)} borderRight="1px solid" borderBottom="1px solid" borderColor="gray.200">
                            <Box position="relative" p={4} bg={hasEvents ? `${colorName}.50` : 'white'} opacity={inMonth ? 1 : 0.5} _hover={{ bg: hasEvents ? `${colorName}.100` : 'gray.50' }} display="flex" flexDir="column" alignItems="center" justifyContent="center" height="100%" w="100%" border={isSelected || hasEvents ? '2px solid' : 'none'} borderColor={isSelected ? 'green.500' : hasEvents ? `${colorName}.300` : 'transparent'} borderRadius="md" boxShadow={isSelected ? '0 0 0 2px rgba(56, 161, 105, 0.35)' : 'none'}>
                              <Text fontWeight="bold" fontSize="xl" textAlign="center" color={isSelected ? 'green.600' : (isSunday ? 'red.500' : 'gray.800')}>{d.getDate()}</Text>
                              {isToday && (
                                <Box position="absolute" top={2} right={2} w="2" h="2" borderRadius="full" bg="green.500" />
                              )}
                              {hasEvents && (
                                <HStack spacing={1} position="absolute" bottom={2} left="50%" transform="translateX(-50%)">
                                  {evs.map((e, i) => (
                                    <Box key={e.id || i} boxSize="6px" borderRadius="full" bg={`${dateColors[i % dateColors.length]}.500`} />
                                  ))}
                                </HStack>
                              )}
                            </Box>
                          </GridItem>
                        );
                      })}
                    </Grid>
                  </VStack>
                </Box>
                <Box w={{ base: '100%', lg: 'sm' }} bg="white" borderRadius="xl" p={5} boxShadow="lg" height="100%" overflowY="auto">
                  <Heading as="h2" fontSize="lg" fontWeight="bold" color="gray.700" mb={3}>
                    {formatDMY(selectedDate)}
                  </Heading>
                  <Divider mb={3} />
                  {isAddOpen ? (
                    <VStack spacing={4} align="stretch">
                      <Heading as="h3" fontSize="md" color="gray.700">Add Event</Heading>
                      <FormControl isRequired>
                        <FormLabel>Title</FormLabel>
                        <CInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                      </FormControl>
                      <VStack spacing={3} align="stretch">
                        <FormControl isRequired>
                          <FormLabel>Date</FormLabel>
                          <CInput value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                        </FormControl>
                        <HStack spacing={3}>
                          <FormControl flex="1">
                            <FormLabel>Start Time</FormLabel>
                            <InputGroup size="sm">
                              <CInput w="70px" type="number" inputMode="numeric" min={1} max={12} placeholder={String(nowHour12)} value={startHour} onChange={e => { const v = e.target.value.replace(/[^0-9]/g,''); setStartHour(v); const ok = validateStart(v, startMinute); if (ok) setForm({ ...form, start_time: to24h(parseInt(v||'0',10), parseInt(startMinute||'0',10), startMeridiem) }); }} />
                              <CInput w="70px" type="number" inputMode="numeric" min={0} max={59} placeholder={nowMinute} value={startMinute} onChange={e => { const v = e.target.value.replace(/[^0-9]/g,''); setStartMinute(v); const ok = validateStart(startHour, v); if (ok) setForm({ ...form, start_time: to24h(parseInt(startHour||'0',10), parseInt(v||'0',10), startMeridiem) }); }} />
                              <ButtonGroup isAttached size="sm">
                                <Button variant={startMeridiem==='AM' ? 'solid' : 'outline'} colorScheme="green" onClick={() => { setStartMeridiem('AM'); const ok = validateStart(startHour, startMinute); if (ok) setForm({ ...form, start_time: to24h(parseInt(startHour||'0',10), parseInt(startMinute||'0',10), 'AM') }); }}>AM</Button>
                                <Button variant={startMeridiem==='PM' ? 'solid' : 'outline'} colorScheme="green" onClick={() => { setStartMeridiem('PM'); const ok = validateStart(startHour, startMinute); if (ok) setForm({ ...form, start_time: to24h(parseInt(startHour||'0',10), parseInt(startMinute||'0',10), 'PM') }); }}>PM</Button>
                              </ButtonGroup>
                            </InputGroup>
                            {startTimeError && (<Text fontSize="xs" color="red.500" mt={1}>{startTimeError}</Text>)}
                          </FormControl>
                        </HStack>
                        <FormControl>
                          <FormLabel>Link Placement</FormLabel>
                          <Switch isChecked={linkPlacement} onChange={e => { const v = e.target.checked; setLinkPlacement(v); if (v) { setCompanyMode('new'); setPlacementMode('new'); setLinkStep(1); setPlacementModalOpen(true); } }} />
                        </FormControl>
                      </VStack>
                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        <CInput value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Notification Remarks</FormLabel>
                        <CInput value={form.notification_remarks} onChange={e => setForm({ ...form, notification_remarks: e.target.value })} />
                      </FormControl>
                      
                      <HStack mt={2} spacing={3}>
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button colorScheme="green" onClick={saveEvent}>Save</Button>
                      </HStack>
                    </VStack>
                  ) : (
                    <>
                      <VStack spacing={4} align="stretch">
                        <Heading as="h3" fontSize="md" color="gray.700">Tasks</Heading>
                        {dayEvents(selectedDate).filter(e => !e.start_time && !e.end_time).length === 0 ? (
                          <Text color="gray.500">No tasks</Text>
                        ) : (
                          dayEvents(selectedDate).filter(e => !e.start_time && !e.end_time).map(e => {
                            const colorName = getDateColorName(selectedDate);
                            return (
                              <HStack key={e.id} p={3} borderRadius="md" bg={`${colorName}.50`} border="1px solid" borderColor={`${colorName}.200`} justifyContent="space-between" alignItems="center">
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="semibold" color={`${colorName}.800`}>{e.title}</Text>
                                  {e.notification_remarks && (<Text fontSize="xs" color={`${colorName}.700`}>{e.notification_remarks}</Text>)}
                                </VStack>
                                <IconButton aria-label="Delete" icon={<FiTrash />} size="sm" colorScheme="red" variant="ghost" onClick={() => deleteEvent(e.id)} />
                              </HStack>
                            );
                          })
                        )}

                        <Heading as="h3" fontSize="md" color="gray.700">Scheduled Events</Heading>
                        {dayEvents(selectedDate).filter(e => e.start_time || e.end_time).length === 0 ? (
                          <Text color="gray.500">No scheduled events</Text>
                        ) : (
                          dayEvents(selectedDate).filter(e => e.start_time || e.end_time).map(e => {
                            const colorName = getDateColorName(selectedDate);
                            return (
                              <HStack key={e.id} p={3} borderRadius="md" bg={`${colorName}.50`} border="1px solid" borderColor={`${colorName}.200`} justifyContent="space-between" alignItems="center">
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="semibold" color={`${colorName}.800`}>{e.title}</Text>
                                  <Text fontSize="xs" color={`${colorName}.700`}>{e.start_time || ''}</Text>
                                  {e.notification_remarks && (<Text fontSize="xs" color={`${colorName}.700`}>{e.notification_remarks}</Text>)}
                                </VStack>
                                <IconButton aria-label="Delete" icon={<FiTrash />} size="sm" colorScheme="red" variant="ghost" onClick={() => deleteEvent(e.id)} />
                              </HStack>
                            );
                          })
                        )}
                      </VStack>
                      <HStack mt={4} spacing={3}>
                        <Button colorScheme="green" leftIcon={<FiPlus />} onClick={() => openAddForDate(selectedDate)}>Add Event</Button>
                      </HStack>
                    </>
                  )}
                </Box>
              </HStack>
            )}

            
          </VStack>
        </Box>
      </Box>
      <Modal isOpen={placementModalOpen} onClose={() => { setPlacementModalOpen(false); setPlacementCompanyName(''); setCompanyPlacements([]); setPlacementSelection(''); setIsNewPlacement(false); setPlacementItemSearch(''); setPlacementCompanySearch(''); setLinkPlacement(false); setCompanyMode(''); setPlacementMode(''); setCompanyDropdownOpen(false); setPlacementDropdownOpen(false); setLinkStep(1); }} isCentered initialFocusRef={modalFocusRef}>
        <ModalOverlay />
        <ModalContent maxW="800px">
          <ModalHeader>
            <HStack justifyContent="space-between">
              <Heading as="h3" size="md">Link Placement</Heading>
              <Box ref={modalFocusRef} tabIndex={-1} />
            </HStack>
          </ModalHeader>
          <ModalBody>
            {linkStep === 1 ? (
            <VStack spacing={6} align="stretch">
              <Box>
                <HStack spacing={4} align="center">
                  <Heading as="h4" size="sm">Company</Heading>
                  {placementCompanyName && !companyLogoFailed && (
                    <Image src={getCompanyLogoPath(placementCompanyName)} alt={placementCompanyName} boxSize="96px" objectFit="contain" onError={() => setCompanyLogoFailed(true)} />
                  )}
                </HStack>
                <HStack mt={3} spacing={3}>
                  <Button variant={companyMode==='new' ? 'solid' : 'outline'} colorScheme="green" onClick={() => { setCompanyMode('new'); }}>
                    Add New Company
                  </Button>
                  <Button variant={companyMode==='existing' ? 'solid' : 'outline'} colorScheme="green" onClick={() => { setCompanyMode('existing'); }}>
                    Use Existing Company
                  </Button>
                </HStack>
                {companyMode === 'existing' && (
                  <Box ref={companyBoxRef} position="relative" mt={3}>
                    <CInput ref={companySearchInputRef} placeholder="Search or select company" value={placementCompanySearch} onChange={e => { setPlacementCompanySearch(e.target.value); }} onFocus={() => setCompanyDropdownOpen(true)} />
                    {companyDropdownOpen && (
                      <Box position="absolute" zIndex={20} bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" mt={1} w="full" maxH="220px" overflowY="auto" boxShadow="md">
                        {companies.filter(c => !placementCompanySearch || c.toLowerCase().includes(placementCompanySearch.toLowerCase())).map(c => (
                          <Box key={c} px={3} py={2} _hover={{ bg: 'gray.50' }} cursor="pointer" onClick={async () => { setPlacementCompanyName(c); setPlacementCompanySearch(c); setCompanyDropdownOpen(false); setCompanyLogoFailed(false); await loadCompanyPlacements(c); setPlacementMode(''); setPlacementSelection(''); }}>
                            {c}
                          </Box>
                        ))}
                        {companies.length === 0 && (
                          <Box px={3} py={2} color="gray.500">No companies</Box>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
                {companyMode === 'new' && (
                  <VStack spacing={3} align="stretch" mt={3}>
                    <FormControl><FormLabel>Company Name</FormLabel><CInput value={newCompany.company_name} onChange={e => setNewCompany({ ...newCompany, company_name: e.target.value })} /></FormControl>
                    <FormControl><FormLabel>Description</FormLabel><CInput value={newCompany.description} onChange={e => setNewCompany({ ...newCompany, description: e.target.value })} /></FormControl>
                    <HStack spacing={3}>
                      <FormControl><FormLabel>Type</FormLabel><CInput value={newCompany.company_type} onChange={e => setNewCompany({ ...newCompany, company_type: e.target.value })} /></FormControl>
                      <FormControl><FormLabel>Website</FormLabel><CInput value={newCompany.website} onChange={e => setNewCompany({ ...newCompany, website: e.target.value })} /></FormControl>
                    </HStack>
                    <HStack spacing={3}>
                      <FormControl><FormLabel>LinkedIn</FormLabel><CInput value={newCompany.linkedin} onChange={e => setNewCompany({ ...newCompany, linkedin: e.target.value })} /></FormControl>
                      <FormControl><FormLabel>Logo Link</FormLabel><CInput value={newCompany.company_logo_link} onChange={e => setNewCompany({ ...newCompany, company_logo_link: e.target.value })} /></FormControl>
                    </HStack>
                  </VStack>
                )}
              </Box>
            </VStack>
            ) : (
            <VStack spacing={6} align="stretch">
              <Box>
                <HStack spacing={4} align="center">
                  <Heading as="h4" size="sm">Placement</Heading>
                </HStack>
                <HStack mt={3} spacing={3}>
                  <Button variant={placementMode==='existing' ? 'solid' : 'outline'} colorScheme="green" onClick={() => setPlacementMode('existing')} isDisabled={!placementCompanyName && companyMode!=='new'}>
                    Use Existing Placements
                  </Button>
                  <Button variant={placementMode==='new' ? 'solid' : 'outline'} colorScheme="green" onClick={() => setPlacementMode('new')} isDisabled={!placementCompanyName && companyMode!=='new'}>
                    Add New Placements
                  </Button>
                </HStack>
                {placementMode === 'existing' && (
                  <Box ref={placementBoxRef} position="relative" mt={3}>
                    <CInput ref={placementSearchInputRef} placeholder="Search or select placement" value={placementItemSearch} onChange={e => setPlacementItemSearch(e.target.value)} onFocus={() => setPlacementDropdownOpen(true)} />
                    {placementDropdownOpen && (
                      <Box position="absolute" zIndex={20} bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" mt={1} w="full" maxH="220px" overflowY="auto" boxShadow="md">
                        {companyPlacements.filter(p => {
                          const q = (placementItemSearch || '').toLowerCase();
                          const s = `${p.year || ''} ${p.job_profile || ''} ${p.school || ''}`.toLowerCase();
                          return !q || s.includes(q);
                        }).map(p => (
                          <Box key={p.id} px={3} py={2} _hover={{ bg: 'gray.50' }} cursor="pointer" onClick={() => { setPlacementSelection(p.id); setPlacementItemSearch(`${p.year} • ${p.job_profile || 'Role'} • ${p.school || ''}`); setPlacementDropdownOpen(false); }}>
                            {p.year} • {p.job_profile || 'Role'} • {p.school || ''}
                          </Box>
                        ))}
                        {companyPlacements.length === 0 && (
                          <Box px={3} py={2} color="gray.500">No placements</Box>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
                {placementMode === 'new' && (
                  <VStack spacing={2} align="stretch" mt={3}>
                    <HStack spacing={3}>
                      <FormControl><FormLabel>Year</FormLabel><CInput value={placementForm.year} onChange={e => setPlacementForm({ ...placementForm, year: e.target.value })} /></FormControl>
                      <FormControl><FormLabel>TPO</FormLabel><CInput value={placementForm.tpo} onChange={e => setPlacementForm({ ...placementForm, tpo: e.target.value })} /></FormControl>
                    </HStack>
                    <HStack spacing={3}>
                      <FormControl><FormLabel>School</FormLabel><CInput value={placementForm.school} onChange={e => setPlacementForm({ ...placementForm, school: e.target.value })} /></FormControl>
                      <FormControl><FormLabel>Course</FormLabel><CInput value={placementForm.course} onChange={e => setPlacementForm({ ...placementForm, course: e.target.value })} /></FormControl>
                    </HStack>
                    <FormControl><FormLabel>Job Profile</FormLabel><CInput value={placementForm.job_profile} onChange={e => setPlacementForm({ ...placementForm, job_profile: e.target.value })} /></FormControl>
                    <FormControl><FormLabel>Job Type</FormLabel><CInput value={placementForm.job_type} onChange={e => setPlacementForm({ ...placementForm, job_type: e.target.value })} /></FormControl>
                    <HStack spacing={3}>
                      <FormControl><FormLabel>Avg Internship Stipend</FormLabel><CInput value={placementForm.avg_internship_stipend} onChange={e => setPlacementForm({ ...placementForm, avg_internship_stipend: e.target.value })} /></FormControl>
                      <FormControl><FormLabel>CTC in LPA</FormLabel><CInput value={placementForm.ctc_in_lpa} onChange={e => setPlacementForm({ ...placementForm, ctc_in_lpa: e.target.value })} /></FormControl>
                    </HStack>
                    <HStack spacing={3}>
                      <FormControl><FormLabel>Final Selects</FormLabel><CInput value={placementForm.final_selects} onChange={e => setPlacementForm({ ...placementForm, final_selects: e.target.value })} /></FormControl>
                      <FormControl><FormLabel>Remarks</FormLabel><CInput value={placementForm.company_remarks} onChange={e => setPlacementForm({ ...placementForm, company_remarks: e.target.value })} /></FormControl>
                    </HStack>
                  </VStack>
                )}
              </Box>
            </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={() => { setPlacementModalOpen(false); setPlacementCompanyName(''); setCompanyPlacements([]); setPlacementSelection(''); setIsNewPlacement(false); setPlacementItemSearch(''); setPlacementCompanySearch(''); setLinkPlacement(false); setCompanyMode(''); setPlacementMode(''); setCompanyDropdownOpen(false); setPlacementDropdownOpen(false); }}>Close</Button>
              {linkStep === 1 && (
                <Button colorScheme="green" onClick={async () => {
                  if (companyMode === 'new' && newCompany.company_name) {
                    setPlacementCompanyName(newCompany.company_name);
                    setCompanyLogoFailed(false);
                    setCompanyDropdownOpen(false);
                  }
                  if (companyMode === 'existing' && placementCompanyName) {
                    await loadCompanyPlacements(placementCompanyName);
                  }
                  if (!placementMode) { setPlacementMode('new'); }
                  setLinkStep(2);
                }} isDisabled={(companyMode==='existing' && !placementCompanyName) || (companyMode==='new' && !newCompany.company_name)}>
                  Next
                </Button>
              )}
              {linkStep === 2 && (
              <Button colorScheme="green" onClick={async () => {
                let companyName = placementCompanyName;
                if (companyMode === 'new' && newCompany.company_name) {
                  await api.post('/dashboard/placement/company', newCompany);
                  const companiesRes = await api.get('/dashboard/placement/companies');
                  const companyNames = companiesRes.data?.data?.companies || [];
                  setCompanies(companyNames);
                  companyName = newCompany.company_name;
                  setPlacementCompanyName(companyName);
                  setCompanyLogoFailed(false);
                  await loadCompanyPlacements(companyName);
                }
                if (placementMode === 'new') {
                  const resp = await api.post('/dashboard/placement/placements', { ...placementForm, company_name: companyName });
                  const newId = resp.data?.data?.id || null;
                  setPendingPlacementCompanyName(companyName);
                  setPendingPlacementYear(placementForm.year || '');
                  setPendingPlacementId(newId);
                  setLinkPlacement(!!newId);
                } else if (placementMode === 'existing') {
                  const sel = placementSelection || null;
                  const picked = companyPlacements.find(p => String(p.id) === String(sel));
                  setPendingPlacementCompanyName(companyName || picked?.company_name || '');
                  setPendingPlacementYear(picked?.year || '');
                  setPendingPlacementId(sel);
                  setLinkPlacement(!!sel);
                } else {
                  setPendingPlacementCompanyName(companyName || '');
                  setPendingPlacementYear('');
                  setPendingPlacementId(null);
                  setLinkPlacement(false);
                }
                setPlacementModalOpen(false);
              }} isDisabled={(placementMode==='existing' && !placementSelection) || (placementMode==='new' && (!placementForm.year || !placementForm.job_profile))}>Save</Button>
              )}
              {linkStep === 2 && (
                <Button variant="outline" onClick={() => setLinkStep(1)}>Back</Button>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={companyModalOpen} onClose={() => setCompanyModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Company</ModalHeader>
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <CInput placeholder="Company Name" value={newCompany.company_name} onChange={e => setNewCompany({ ...newCompany, company_name: e.target.value })} />
              <CInput placeholder="Description" value={newCompany.description} onChange={e => setNewCompany({ ...newCompany, description: e.target.value })} />
              <CInput placeholder="Company Type" value={newCompany.company_type} onChange={e => setNewCompany({ ...newCompany, company_type: e.target.value })} />
              <CInput placeholder="Website" value={newCompany.website} onChange={e => setNewCompany({ ...newCompany, website: e.target.value })} />
              <CInput placeholder="LinkedIn" value={newCompany.linkedin} onChange={e => setNewCompany({ ...newCompany, linkedin: e.target.value })} />
              <CInput placeholder="Logo Link" value={newCompany.company_logo_link} onChange={e => setNewCompany({ ...newCompany, company_logo_link: e.target.value })} />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={() => setCompanyModalOpen(false)}>Close</Button>
              <Button colorScheme="purple" onClick={async () => {
                await api.post('/dashboard/placement/company', newCompany);
                const companiesRes = await api.get('/dashboard/placement/companies');
                const companyNames = companiesRes.data?.data?.companies || [];
                setCompanies(companyNames);
                setPlacementCompanyName(newCompany.company_name);
                await loadCompanyPlacements(newCompany.company_name);
                setCompanyModalOpen(false);
              }}>Save</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
};

export default Calendar;




// import React, { useEffect, useMemo, useState, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ChevronLeft, ChevronRight, Plus, X, Check, Clock, AlignLeft } from 'lucide-react';

// // --- MOCK API (Replace with your actual '../utils/api' import in production) ---
// const api = {
//   get: async (url) => {
//     console.log(`GET request to ${url}`);
//     // Return dummy data for preview purposes
//     if (url.includes('companies')) return { data: { data: { companies: ['Google', 'Microsoft', 'Amazon'] } } };
//     if (url.includes('events')) return { data: { data: [] } };
//     return { data: { data: [] } };
//   },
//   post: async (url, data) => {
//     console.log(`POST request to ${url}`, data);
//     return { data: { success: true } };
//   }
// };

// // --- Custom Styles for Binder Rings & Fonts ---
// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Roboto:wght@400;500&display=swap');
  
//   .font-serif-custom { font-family: "Playfair Display", serif; }
//   .font-sans-custom { font-family: "Roboto", sans-serif; }
  
//   /* Binder Rings Effect */
//   .ring-container {
//       display: flex;
//       justify-content: space-around;
//       position: absolute;
//       top: -15px;
//       left: 20px;
//       right: 20px;
//       z-index: 20;
//   }
//   .binder-ring {
//       width: 20px;
//       height: 45px;
//       background: linear-gradient(to right, #2d3748 0%, #4a5568 40%, #2d3748 100%);
//       border-radius: 12px;
//       box-shadow: 0 4px 6px rgba(0,0,0,0.3);
//   }
//   .binder-hole {
//       width: 24px;
//       height: 24px;
//       background-color: #3e7e22; 
//       border-radius: 50%;
//       box-shadow: inset 0 2px 5px rgba(0,0,0,0.4);
//       margin: 0 auto;
//       margin-bottom: 25px;
//   }
  
//   .modal-animate { animation: fadeIn 0.2s ease-out forwards; }
//   @keyframes fadeIn {
//       from { opacity: 0; transform: scale(0.95); }
//       to { opacity: 1; transform: scale(1); }
//   }
// `;

// const Calendar = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [companies, setCompanies] = useState([]);
//   const [events, setEvents] = useState([]);
//   const [current, setCurrent] = useState(() => {
//     const d = new Date();
//     return new Date(d.getFullYear(), d.getMonth(), 1);
//   });
//   const [isAddOpen, setIsAddOpen] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(() => new Date());
//   const [form, setForm] = useState({ 
//     title: '', description: '', date: '', start_time: '', end_time: '', 
//     notification_remarks: '', isPlacement: false, placement_company_name: '', placement_year: '' 
//   });

//   const monthLabel = useMemo(() => {
//     return current.toLocaleString(undefined, { month: 'long' }).toUpperCase();
//   }, [current]);

//   const yearLabel = useMemo(() => {
//     return current.getFullYear();
//   }, [current]);

//   const range = useMemo(() => {
//     const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
//     const startIdx = firstDay.getDay(); // 0 is Sunday
//     const start = new Date(firstDay);
//     start.setDate(firstDay.getDate() - startIdx);
//     const days = [];
//     for (let i = 0; i < 42; i++) {
//       const d = new Date(start);
//       d.setDate(start.getDate() + i);
//       days.push(d);
//     }
//     const end = days[41];
//     return { days, start, end };
//   }, [current]);

//   const monthEvents = useMemo(() => {
//     const ym = current.getMonth();
//     const yf = current.getFullYear();
//     return events.filter(e => {
//       const ed = new Date(e.event_date);
//       return ed.getMonth() === ym && ed.getFullYear() === yf;
//     });
//   }, [events, current]);

//   const fetchCompanies = async () => {
//     try {
//       const res = await api.get('/dashboard/placement/companies');
//       setCompanies(res.data?.data?.companies || []);
//     } catch {
//       setCompanies([]);
//     }
//   };

//   const fetchEvents = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError('');
//       const startStr = range.start.toISOString().slice(0, 10);
//       const endStr = range.end.toISOString().slice(0, 10);
//       const res = await api.get(`/calendar/events?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`);
//       setEvents(res.data?.data || []);
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to load calendar events');
//     } finally {
//       setLoading(false);
//     }
//   }, [range.start, range.end]);

//   useEffect(() => {
//     fetchCompanies();
//   }, []);

//   useEffect(() => {
//     fetchEvents();
//   }, [fetchEvents]);

//   const openAddForDate = (d) => {
//     setSelectedDate(d);
//     // Adjust to local timezone ISO string for input value
//     const offset = d.getTimezoneOffset() * 60000;
//     const localISOTime = (new Date(d - offset)).toISOString().slice(0, 10);
    
//     setForm({ 
//       title: '', description: '', date: localISOTime, start_time: '', end_time: '', 
//       notification_remarks: '', isPlacement: false, placement_company_name: '', placement_year: '' 
//     });
//     setIsAddOpen(true);
//   };

//   const saveEvent = async () => {
//     try {
//       const payload = {
//         title: form.title,
//         description: form.description,
//         event_date: form.date,
//         start_time: form.start_time || null,
//         end_time: form.end_time || null,
//         is_all_day: !form.start_time && !form.end_time,
//         status: 'scheduled',
//         notification_remarks: form.notification_remarks || null,
//         placement_company_name: form.isPlacement ? form.placement_company_name || null : null,
//         placement_year: form.isPlacement ? (form.placement_year ? parseInt(form.placement_year, 10) : null) : null
//       };
//       await api.post('/calendar/events', payload);
      
//       // Manually add event to state for preview since mock API won't persist
//       const newEvent = { ...payload, id: Date.now() };
//       setEvents(prev => [...prev, newEvent]);

//       setIsAddOpen(false);
//     } catch (err) {
//       alert(err.response?.data?.message || 'Failed to save event');
//     }
//   };

//   const dayEvents = (d) => {
//     // Robust date matching
//     return monthEvents.filter(e => {
//         const eventDate = new Date(e.event_date);
//         return eventDate.getDate() === d.getDate() && 
//                eventDate.getMonth() === d.getMonth() && 
//                eventDate.getFullYear() === d.getFullYear();
//     });
//   };

//   const selectedDayEvents = dayEvents(selectedDate);
//   const tasks = selectedDayEvents.filter(e => !e.start_time && !e.end_time);
//   const scheduled = selectedDayEvents.filter(e => e.start_time || e.end_time);

//   return (
//     <div className="min-h-screen font-sans-custom p-4 md:p-8" style={{ background: 'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)' }}>
//       <style>{styles}</style>
      
//       {/* Main Container */}
//       <div className="relative w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden mt-8">
        
//         {/* Binder Rings */}
//         <div className="ring-container">
//             {[...Array(6)].map((_, i) => <div key={i} className="binder-ring" />)}
//         </div>

//         {/* Green Header */}
//         <div className="bg-[#4C9A2A] pt-12 pb-4 px-8 relative">
//             <div className="absolute top-3 left-0 right-0 flex justify-around px-[20px]">
//                 {[...Array(6)].map((_, i) => <div key={i} className="binder-hole" />)}
//             </div>

//             <div className="flex justify-between items-end text-white font-serif-custom mt-2">
//                 <div className="flex items-center gap-2">
//                     <button 
//                         onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))} 
//                         className="hover:bg-white/20 rounded-full p-1 transition-colors"
//                     >
//                         <ChevronLeft size={24} />
//                     </button>
//                     <h1 className="text-4xl font-bold tracking-wide uppercase">{monthLabel}</h1>
//                 </div>
//                 <div className="flex items-center gap-2">
//                     <span className="text-4xl font-bold opacity-90">{yearLabel}</span>
//                     <button 
//                         onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))} 
//                         className="hover:bg-white/20 rounded-full p-1 transition-colors"
//                     >
//                         <ChevronRight size={24} />
//                     </button>
//                 </div>
//             </div>
//         </div>

//         {/* Calendar Body */}
//         <div className="p-6 pb-8 bg-white font-serif-custom">
            
//             {/* Headers */}
//             <div className="grid grid-cols-7 mb-0 border-b-2 border-slate-200 pb-2">
//                 {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((day, i) => (
//                     <div key={day} className={`text-center font-bold text-2xl ${i === 0 ? 'text-[#e74c3c]' : 'text-slate-800'}`}>
//                         {day}
//                     </div>
//                 ))}
//             </div>

//             {/* Grid */}
//             {loading ? (
//                 <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
//             ) : error ? (
//                 <div className="h-64 flex items-center justify-center text-red-500">{error}</div>
//             ) : (
//                 <div className="grid grid-cols-7 border-l border-t border-slate-200">
//                     {range.days.map((d, idx) => {
//                         const inMonth = d.getMonth() === current.getMonth();
//                         const isSunday = d.getDay() === 0;
//                         const isSelected = d.toDateString() === selectedDate.toDateString();
//                         const evs = dayEvents(d);

//                         return (
//                             <div 
//                                 key={idx}
//                                 onClick={() => setSelectedDate(d)}
//                                 className={`
//                                     h-16 border-r border-b border-slate-200 p-2 flex flex-col items-center justify-center 
//                                     cursor-pointer transition-colors relative group
//                                     ${!inMonth ? 'bg-slate-50/30 text-slate-300' : 
//                                       isSunday ? 'bg-[#ffdcdc] text-[#e74c3c] hover:bg-[#ffcfcf]' : 'bg-white text-slate-800 hover:bg-slate-50'}
//                                     ${isSelected ? 'ring-2 ring-inset ring-[#4C9A2A] z-10' : ''}
//                                 `}
//                             >
//                                 <span className={`font-bold text-3xl leading-none ${!inMonth ? 'opacity-30' : ''}`}>
//                                     {d.getDate()}
//                                 </span>
//                                 {evs.length > 0 && inMonth && (
//                                     <div className="absolute bottom-1 flex gap-1 justify-center w-full">
//                                         {[...Array(Math.min(evs.length, 3))].map((_, i) => (
//                                             <div key={i} className="w-1.5 h-1.5 bg-[#4C9A2A] rounded-full" />
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     })}
//                 </div>
//             )}

//             {/* Bottom Panel: Selected Date Details */}
//             <div className="flex flex-col md:flex-row justify-between items-start mt-8 gap-6 pt-6 border-t border-slate-100">
                
//                 <div className="flex-1 w-full font-sans-custom">
//                     <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">
//                         {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
//                     </h3>
                    
//                     {selectedDayEvents.length === 0 ? (
//                         <div className="text-slate-400 italic text-sm">No notes for this date</div>
//                     ) : (
//                         <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
//                             {tasks.map(e => (
//                                 <div key={e.id} className="flex items-center gap-3 bg-yellow-50 p-2 rounded-lg border border-yellow-100">
//                                     <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
//                                     <div className="min-w-0">
//                                         <p className="font-bold text-slate-700 text-sm truncate">{e.title}</p>
//                                         {e.notification_remarks && <p className="text-xs text-slate-500 truncate">{e.notification_remarks}</p>}
//                                     </div>
//                                 </div>
//                             ))}
//                             {scheduled.map(e => (
//                                 <div key={e.id} className="flex items-center gap-3 bg-green-50 p-2 rounded-lg border border-green-100">
//                                     <div className="w-2 h-2 rounded-full bg-[#4C9A2A] flex-shrink-0" />
//                                     <div className="min-w-0">
//                                         <p className="font-bold text-slate-700 text-sm truncate">{e.title}</p>
//                                         <p className="text-xs text-slate-500">
//                                             {e.start_time || ''}{e.end_time ? ` - ${e.end_time}` : ''}
//                                         </p>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>

//                 <div className="flex-shrink-0">
//                     <button 
//                         onClick={() => openAddForDate(selectedDate)}
//                         className="flex items-center gap-2 px-6 py-3 bg-[#4C9A2A] hover:bg-[#3e7e22] text-white rounded-full font-sans-custom font-medium shadow-lg hover:shadow-xl transition-all transform active:scale-95"
//                     >
//                         <Plus className="w-5 h-5" />
//                         Add Note
//                     </button>
//                     <button 
//                         onClick={() => navigate(-1)} 
//                         className="block w-full mt-3 text-center text-sm text-slate-500 hover:text-slate-700"
//                     >
//                         Back
//                     </button>
//                 </div>
//             </div>

//         </div>
//       </div>

//       {/* Modal - Tailwind Implementation */}
//       {isAddOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
//             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-animate overflow-hidden font-sans-custom">
                
//                 {/* Modal Header */}
//                 <div className="bg-[#4C9A2A] p-4 flex justify-between items-center text-white">
//                     <h3 className="font-serif-custom font-bold text-xl">Add Note</h3>
//                     <button onClick={() => setIsAddOpen(false)} className="hover:bg-white/20 rounded-full p-1">
//                         <X className="w-5 h-5" />
//                     </button>
//                 </div>

//                 {/* Modal Body */}
//                 <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    
//                     {/* Date Display */}
//                     <div className="text-center pb-4 border-b border-slate-100">
//                         <p className="text-xs font-bold text-slate-400 uppercase">Selected Date</p>
//                         <p className="text-2xl font-serif-custom font-bold text-[#4C9A2A]">
//                             {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
//                         </p>
//                     </div>

//                     <div className="space-y-4">
//                         <div>
//                             <label className="block text-xs font-bold text-slate-500 mb-1">Title *</label>
//                             <input 
//                                 value={form.title} 
//                                 onChange={e => setForm({ ...form, title: e.target.value })}
//                                 className="w-full border-b-2 border-slate-200 py-2 text-lg focus:outline-none focus:border-[#4C9A2A] transition-colors bg-transparent placeholder-slate-300"
//                                 placeholder="Event Title"
//                             />
//                         </div>

//                         <div className="flex gap-4">
//                             <div className="flex-1">
//                                 <label className="block text-xs font-bold text-slate-500 mb-1">Start Time</label>
//                                 <div className="flex items-center border-b-2 border-slate-200">
//                                     <Clock className="text-slate-400 mr-2" />
//                                     <input 
//                                         type="time"
//                                         value={form.start_time} 
//                                         onChange={e => setForm({ ...form, start_time: e.target.value })}
//                                         className="w-full py-2 focus:outline-none bg-transparent"
//                                     />
//                                 </div>
//                             </div>
//                             <div className="flex-1">
//                                 <label className="block text-xs font-bold text-slate-500 mb-1">End Time</label>
//                                 <div className="flex items-center border-b-2 border-slate-200">
//                                     <Clock className="text-slate-400 mr-2" />
//                                     <input 
//                                         type="time"
//                                         value={form.end_time} 
//                                         onChange={e => setForm({ ...form, end_time: e.target.value })}
//                                         className="w-full py-2 focus:outline-none bg-transparent"
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         <div>
//                             <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
//                             <div className="flex items-center border-b-2 border-slate-200">
//                                 <AlignLeft className="text-slate-400 mr-2" />
//                                 <input 
//                                     value={form.description} 
//                                     onChange={e => setForm({ ...form, description: e.target.value })}
//                                     className="w-full py-2 focus:outline-none bg-transparent"
//                                     placeholder="Add details..."
//                                 />
//                             </div>
//                         </div>

//                         <div>
//                             <label className="block text-xs font-bold text-slate-500 mb-1">Remarks</label>
//                             <input 
//                                 value={form.notification_remarks} 
//                                 onChange={e => setForm({ ...form, notification_remarks: e.target.value })}
//                                 className="w-full border-b-2 border-slate-200 py-2 focus:outline-none focus:border-[#4C9A2A] bg-transparent"
//                                 placeholder="Any notes?"
//                             />
//                         </div>

//                         {/* Placement Logic */}
//                         <div className="pt-2">
//                              <label className="block text-xs font-bold text-slate-500 mb-1">Placement Event</label>
//                              <select 
//                                 value={form.isPlacement ? (form.placement_company_name || '') : ''} 
//                                 onChange={e => {
//                                     const val = e.target.value;
//                                     setForm(prev => ({ 
//                                         ...prev, 
//                                         isPlacement: !!val, 
//                                         placement_company_name: val,
//                                         placement_year: val ? prev.placement_year : '' 
//                                     }));
//                                 }}
//                                 className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#4C9A2A]"
//                              >
//                                 <option value="">None</option>
//                                 {companies.map(c => <option key={c} value={c}>{c}</option>)}
//                              </select>
//                         </div>
                        
//                         {form.isPlacement && (
//                             <div>
//                                 <label className="block text-xs font-bold text-slate-500 mb-1">Placement Year</label>
//                                 <input 
//                                     type="number"
//                                     value={form.placement_year} 
//                                     onChange={e => setForm({ ...form, placement_year: e.target.value })}
//                                     className="w-full border-b-2 border-slate-200 py-2 focus:outline-none focus:border-[#4C9A2A] bg-transparent"
//                                 />
//                             </div>
//                         )}
//                     </div>
//                 </div>

//                 {/* Modal Footer */}
//                 <div className="p-4 border-t border-slate-100 flex gap-3">
//                     <button 
//                         onClick={() => setIsAddOpen(false)}
//                         className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
//                     >
//                         Cancel
//                     </button>
//                     <button 
//                         onClick={saveEvent}
//                         className="flex-1 py-3 bg-[#4C9A2A] text-white font-bold rounded-xl shadow-lg hover:bg-[#3e7e22] transition-colors flex items-center justify-center gap-2"
//                     >
//                         <Check /> Save
//                     </button>
//                 </div>

//             </div>
//         </div>
//       )}

//     </div>
//   );
// };

// export default Calendar;
