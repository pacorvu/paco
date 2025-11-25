import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Flex,
  useColorModeValue,
  Icon,
  Image,
  Container
} from '@chakra-ui/react';
import {
  ViewIcon,
  InfoIcon,
  CheckCircleIcon
} from '@chakra-ui/icons';
import { FiUsers, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AdminLayout from '../components/AdminLayout';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);


const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [overallStats, setOverallStats] = useState(null);
  const [schoolStats, setSchoolStats] = useState([]);
  const [schoolDistribution, setSchoolDistribution] = useState([]);
  const [ctcData, setCtcData] = useState([]);
  const [hiringPartners, setHiringPartners] = useState([]);
  const [ctcStats, setCtcStats] = useState({ averageCTC: 0, medianCTC: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('white', 'gray.900');

  // Calculate distribution for chart
  const calculateDistribution = (data, binSize = 2, min = 0, max = null) => {
    if (!data || data.length === 0) {
      return { labels: [], data: [] };
    }

    // Auto-calculate max if not provided
    const actualMax = max || Math.ceil(Math.max(...data) + binSize);
    const actualMin = min || Math.floor(Math.min(...data));

    const bins = {};
    const labels = [];
    for (let i = actualMin; i <= actualMax; i += binSize) {
      const label = `${i} - ${i + binSize} LPA`;
      labels.push(label);
      bins[label] = 0;
    }

    data.forEach(value => {
      let binFound = false;
      for (let i = actualMin; i <= actualMax; i += binSize) {
        if (value >= i && value < i + binSize) {
          const label = `${i} - ${i + binSize} LPA`;
          bins[label]++;
          binFound = true;
          break;
        }
      }
      if (!binFound && value >= actualMax) {
        const lastLabel = labels[labels.length - 1];
        bins[lastLabel]++;
      }
    });

    return {
      labels: labels.filter(label => bins[label] > 0),
      data: labels.filter(label => bins[label] > 0).map(label => bins[label])
    };
  };

  const distribution = calculateDistribution(ctcData);

  // Chart data configuration
  const chartData = {
    labels: distribution.labels,
    datasets: [
      {
        label: 'Number of Placements',
        data: distribution.data,
        borderColor: '#4c51bf',
        backgroundColor: 'rgba(76, 81, 191, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#4c51bf',
        pointHoverRadius: 7,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Placement Frequency by CTC Range',
        font: { size: 14, weight: 'bold' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Students',
          font: { size: 12 }
        },
        ticks: {
          precision: 0
        }
      },
      x: {
        title: {
          display: true,
          text: 'CTC Range (LPA)',
          font: { size: 12 }
        }
      }
    }
  };

  // Generate color for hiring partner logos
  const getPartnerColor = (index) => {
    const colors = ['4c51bf', 'f97316', '10b981', '6366f1', 'ef4444', '3b82f6', '14b8a6', 'cc5e2e', '8b5cf6', 'ec4899'];
    return colors[index % colors.length];
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPlacementStats();
    }
  }, [isAdmin]);

  const fetchPlacementStats = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        overallResponse,
        schoolResponse,
        schoolDistResponse,
        ctcDistResponse,
        hiringPartnersResponse,
        ctcStatsResponse
      ] = await Promise.all([
        api.get('/dashboard/placement/overall'),
        api.get('/dashboard/placement/by-school'),
        api.get('/dashboard/placement/school-distribution'),
        api.get('/dashboard/placement/ctc-distribution'),
        api.get('/dashboard/placement/hiring-partners'),
        api.get('/dashboard/placement/ctc-stats')
      ]);

      setOverallStats(overallResponse.data.data);
      setSchoolStats(schoolResponse.data.data);
      setSchoolDistribution(schoolDistResponse.data.data || []);
      setCtcData(ctcDistResponse.data.data || []);
      setHiringPartners(hiringPartnersResponse.data.data || []);
      setCtcStats(ctcStatsResponse.data.data || { averageCTC: 0, medianCTC: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load placement statistics');
      console.error('Error fetching placement stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalStudents = overallStats?.totalStudents || 0;
  const totalOffers = overallStats?.totalOffersRecords || 0;
  const placedStudents = overallStats?.totalPlacedStudents || 0;
  const placementRate = overallStats?.overallPlacementPercent || 0;
  const offerRate = totalStudents > 0 ? ((totalOffers / totalStudents) * 100).toFixed(2) : '0.00';
  const uniqueCompanies = overallStats?.uniqueHiringCompanies || 0;
  const highestCTC = overallStats?.highestCTCLPA || 0;
  const averageCTC = ctcStats?.averageCTC || overallStats?.averageCTCLPA || 0;
  const medianCTC = ctcStats?.medianCTC || overallStats?.medianCTCLPA || 0;
  const lowestCTC = overallStats?.lowestCTCLPA || 0;

  // Transform school stats to match table format
  const placementBySchool = schoolStats.map(stat => {
    // Find if this school has the highest placement percentage
    const maxPercent = Math.max(...schoolStats.map(s => s.placementPercent || 0));
    const isTop = stat.placementPercent === maxPercent && maxPercent > 0;
    
    return {
      school: stat.school,
      total: stat.totalStudents,
      placed: stat.placedStudents,
      percent: parseFloat(stat.placementPercent?.toFixed(2) || 0),
      isTop: isTop
    };
  }).sort((a, b) => (b.percent || 0) - (a.percent || 0)); // Sort by placement percentage descending

  return (
    <AdminLayout>
      <Box bg="#f7f7fa" minH="100vh" pb={10}>
        <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 10 }} pt={{ base: 4, sm: 6, lg: 10 }}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <Box>
              <Heading as="h1" fontSize={{ base: '2xl', sm: '3xl' }} fontWeight="extrabold" color="gray.800">
                Admin Overview
              </Heading>
              <Text fontSize="lg" fontWeight="medium" color="gray.500" mt={1}>
                Key metrics and placement statistics.
              </Text>
            </Box>

            {loading ? (
              <Box textAlign="center" py={12} bg={cardBg} borderRadius="xl" boxShadow="2xl" border="1px solid" borderColor={borderColor}>
                <Spinner size="xl" color="blue.500" thickness="4px" />
                <Text mt={4} color="gray.600" fontSize="lg">Loading statistics...</Text>
              </Box>
            ) : error ? (
              <Alert status="error" borderRadius="xl" variant="left-accent">
                <AlertIcon />
                {error}
              </Alert>
            ) : (
              <>
                {/* Row 1: Total Students */}
                <Box
                  bgGradient="linear(to-r, #343a85, #4c51bf)"
                  p={6}
                  borderRadius="xl"
                  boxShadow="2xl"
                  color="white"
                >
                  <Flex justify="space-between" align="center">
                    <Text fontSize="lg" fontWeight="medium" textTransform="uppercase" letterSpacing="widest" opacity={0.8}>
                      Total Students Enrolled
                    </Text>
                    <Icon as={FiUsers} boxSize={8} opacity={0.7} />
                  </Flex>
                  <Text fontSize="5xl" fontWeight="extrabold" mt={1}>
                    {totalStudents}
                  </Text>
                </Box>

                {/* Row 2: Student Distribution by School */}
                <Box>
                  <Heading as="h2" fontSize="xl" fontWeight="bold" color="gray.700" mb={4}>
                    Student Distribution by School
                  </Heading>
                  <SimpleGrid columns={{ base: 2, sm: 4, lg: 8 }} spacing={4}>
                    {schoolDistribution.length > 0 ? (
                      schoolDistribution.map((school) => {
                        // Determine if this is the top school by student count
                        const maxCount = Math.max(...schoolDistribution.map(s => s.total || 0));
                        const isTopSchool = school.total === maxCount && maxCount > 0;
                        
                        return (
                          <Box
                            key={school.name}
                            bg={cardBg}
                            p={3}
                            borderRadius="xl"
                            boxShadow="md"
                            textAlign="center"
                            borderBottom="2px solid"
                            borderColor={isTopSchool ? 'green.500' : 'blue.400'}
                          >
                            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                              {school.name}
                            </Text>
                            <Text
                              fontSize="xl"
                              fontWeight="bold"
                              color={isTopSchool ? 'green.600' : 'blue.600'}
                            >
                              {school.total || 0}
                            </Text>
                          </Box>
                        );
                      })
                    ) : (
                      <Text color="gray.500" textAlign="center" gridColumn="1 / -1">
                        No school distribution data available
                      </Text>
                    )}
                  </SimpleGrid>
                </Box>

                {/* Row 3: Core Metrics */}
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 4, sm: 6 }}>
                  <Box
                    bg={cardBg}
                    p={4}
                    borderRadius="xl"
                    boxShadow="lg"
                    borderBottom="4px solid"
                    borderColor="blue.400"
                  >
                    <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                      Total Offers
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.900" mt={1}>
                      {totalOffers}
                    </Text>
                  </Box>

                  <Box
                    bg={cardBg}
                    p={4}
                    borderRadius="xl"
                    boxShadow="lg"
                    borderBottom="4px solid"
                    borderColor="indigo.400"
                  >
                    <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                      Offer Rate
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="indigo.600" mt={1}>
                      {offerRate}%
                    </Text>
                  </Box>

                  <Box
                    bg={cardBg}
                    p={4}
                    borderRadius="xl"
                    boxShadow="lg"
                    borderBottom="4px solid"
                    borderColor="green.500"
                  >
                    <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                      Placed Students
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.900" mt={1}>
                      {placedStudents}
                    </Text>
                  </Box>

                  <Box
                    bg={cardBg}
                    p={4}
                    borderRadius="xl"
                    boxShadow="lg"
                    borderBottom="4px solid"
                    borderColor="blue.600"
                  >
                    <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                      Placement Rate
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600" mt={1}>
                      {placementRate}%
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* Row 4: CTC Financial Summary */}
                <Box
                  bg={cardBg}
                  p={6}
                  borderRadius="xl"
                  boxShadow="xl"
                  borderLeft="4px solid"
                  borderColor="yellow.500"
                >
                  <HStack mb={6}>
                    <Icon as={FiDollarSign} boxSize={6} color="yellow.600" />
                    <Heading as="h3" fontSize="xl" fontWeight="bold" color="gray.700">
                      CTC Financial Summary (Cost to Company)
                    </Heading>
                  </HStack>

                  <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
                    {/* Chart */}
                    <Box gridColumn={{ base: '1', lg: 'span 2' }} h="80">
                      {distribution.labels.length > 0 ? (
                        <>
                          <Line data={chartData} options={chartOptions} />
                          <Text fontSize="xs" color="gray.400" mt={2} textAlign="center">
                            Data points represent the number of students placed within each 2 LPA salary range.
                          </Text>
                        </>
                      ) : (
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          h="100%"
                          color="gray.500"
                        >
                          <Text>No CTC distribution data available</Text>
                        </Box>
                      )}
                    </Box>

                    {/* Summary Metrics */}
                    <VStack spacing={4} align="stretch" pt={{ base: 4, lg: 0 }} borderTop={{ base: '1px solid', lg: 'none' }} borderColor="gray.100" pl={{ lg: 6 }} borderLeft={{ lg: '1px solid' }} borderLeftColor={{ lg: 'gray.100' }}>
                      <Box
                        p={3}
                        borderRadius="lg"
                        bg="green.50"
                        border="1px solid"
                        borderColor="green.200"
                        boxShadow="sm"
                        _hover={{ boxShadow: 'lg', transform: 'scale(1.02)', transition: 'all 0.3s' }}
                        cursor="pointer"
                      >
                        <Text fontSize="sm" fontWeight="medium" color="gray.500" textTransform="uppercase">
                          Highest CTC
                        </Text>
                        <Text fontSize="3xl" fontWeight="extrabold" color="green.700" mt={1}>
                          {highestCTC} LPA
                        </Text>
                      </Box>

                      <Box
                        p={3}
                        borderRadius="lg"
                        bg="blue.50"
                        border="1px solid"
                        borderColor="blue.200"
                        boxShadow="sm"
                        _hover={{ boxShadow: 'lg', transform: 'scale(1.02)', transition: 'all 0.3s' }}
                        cursor="pointer"
                      >
                        <Text fontSize="sm" fontWeight="medium" color="gray.500" textTransform="uppercase">
                          Average CTC
                        </Text>
                        <Text fontSize="3xl" fontWeight="extrabold" color="blue.600" mt={1}>
                          {averageCTC} LPA
                        </Text>
                      </Box>

                      <Box
                        p={3}
                        borderRadius="lg"
                        bg="yellow.50"
                        border="1px solid"
                        borderColor="yellow.200"
                        boxShadow="sm"
                        _hover={{ boxShadow: 'lg', transform: 'scale(1.02)', transition: 'all 0.3s' }}
                        cursor="pointer"
                      >
                        <Text fontSize="sm" fontWeight="medium" color="gray.500" textTransform="uppercase">
                          Median CTC
                        </Text>
                        <Text fontSize="3xl" fontWeight="extrabold" color="yellow.700" mt={1}>
                          {medianCTC} LPA
                        </Text>
                      </Box>

                      <Box
                        p={3}
                        borderRadius="lg"
                        bg="red.50"
                        border="1px solid"
                        borderColor="red.200"
                        boxShadow="sm"
                        _hover={{ boxShadow: 'lg', transform: 'scale(1.02)', transition: 'all 0.3s' }}
                        cursor="pointer"
                      >
                        <Text fontSize="sm" fontWeight="medium" color="gray.500" textTransform="uppercase">
                          Lowest CTC
                        </Text>
                        <Text fontSize="3xl" fontWeight="extrabold" color="red.700" mt={1}>
                          {lowestCTC} LPA
                        </Text>
                      </Box>
                    </VStack>
                  </SimpleGrid>
                </Box>

                {/* Row 5: Hiring Partners */}
                <Box
                  bg={cardBg}
                  p={6}
                  borderRadius="xl"
                  boxShadow="xl"
                  borderLeft="4px solid"
                  borderColor="indigo.500"
                >
                  <HStack mb={6}>
                    <Icon as={FiTrendingUp} boxSize={6} color="indigo.600" />
                    <Heading as="h3" fontSize="xl" fontWeight="bold" color="gray.700">
                      Hiring Partners (
                      <Text as="span" color="blue.600" fontWeight="extrabold">
                        {uniqueCompanies}
                      </Text>{' '}
                      Unique Companies)
                    </Heading>
                  </HStack>

                  {/* Logo Loop Container */}
                  <Box
                    overflow="hidden"
                    py={4}
                    borderTop="1px solid"
                    borderColor="gray.100"
                    position="relative"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '10%',
                      bgGradient: 'linear(to-r, white, transparent)',
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}
                    _after={{
                      content: '""',
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '10%',
                      bgGradient: 'linear(to-l, white, transparent)',
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}
                  >
                    <Box
                      display="flex"
                      whiteSpace="nowrap"
                      width="200%"
                      sx={{
                        animation: 'scroll-left 40s linear infinite',
                        '&:hover': {
                          animationPlayState: 'paused'
                        }
                      }}
                    >
                      {/* Logo Set 1 */}
                      {hiringPartners.length > 0 ? (
                        <>
                          {hiringPartners.map((companyName, index) => {
                            const color = getPartnerColor(index);
                            return (
                              <Box key={`set1-${companyName}-${index}`} flexShrink={0} px={6} display="inline-block">
                                <Image
                                  src={`https://placehold.co/100x40/${color}/ffffff?text=${encodeURIComponent(companyName)}`}
                                  alt={`${companyName} Logo`}
                                  h={10}
                                  w="auto"
                                  objectFit="contain"
                                  borderRadius="md"
                                  p={1}
                                  border="1px solid"
                                  borderColor="gray.200"
                                  onError={(e) => {
                                    e.target.src = `https://placehold.co/100x40/${color}/ffffff?text=Co${index + 1}`;
                                  }}
                                />
                              </Box>
                            );
                          })}
                          {/* Logo Set 2 (Duplicated for seamless loop) */}
                          {hiringPartners.map((companyName, index) => {
                            const color = getPartnerColor(index);
                            return (
                              <Box key={`set2-${companyName}-${index}`} flexShrink={0} px={6} display="inline-block">
                                <Image
                                  src={`https://placehold.co/100x40/${color}/ffffff?text=${encodeURIComponent(companyName)}`}
                                  alt={`${companyName} Logo`}
                                  h={10}
                                  w="auto"
                                  objectFit="contain"
                                  borderRadius="md"
                                  p={1}
                                  border="1px solid"
                                  borderColor="gray.200"
                                  onError={(e) => {
                                    e.target.src = `https://placehold.co/100x40/${color}/ffffff?text=Co${index + 1}`;
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </>
                      ) : (
                        <Text color="gray.500" textAlign="center" width="100%">
                          No hiring partners data available
                        </Text>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Row 6: Placement by School Table */}
                <Box>
                  <Heading as="h2" fontSize="2xl" fontWeight="bold" color="gray.700" mb={4}>
                    Placement by School
                  </Heading>
                  <Text color="gray.500" mb={6}>
                    School-wise placement summary
                  </Text>

                  <Box
                    bg={cardBg}
                    borderRadius="xl"
                    boxShadow="2xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <TableContainer overflowX="auto">
                      <Table variant="simple">
                        <Thead bg="blue.800" borderBottom="2px solid" borderColor="blue.600">
                          <Tr>
                            <Th color="white" fontSize="sm" fontWeight="extrabold" textTransform="uppercase" letterSpacing="wider" py={3} px={6}>
                              School
                            </Th>
                            <Th isNumeric color="white" fontSize="sm" fontWeight="extrabold" textTransform="uppercase" letterSpacing="wider" py={3} px={6}>
                              Total Students
                            </Th>
                            <Th isNumeric color="white" fontSize="sm" fontWeight="extrabold" textTransform="uppercase" letterSpacing="wider" py={3} px={6}>
                              Placed Students
                            </Th>
                            <Th isNumeric color="white" fontSize="sm" fontWeight="extrabold" textTransform="uppercase" letterSpacing="wider" py={3} px={6}>
                              Placement %
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {placementBySchool.length > 0 ? (
                            placementBySchool.map((row, index) => (
                              <Tr
                                key={`${row.school}-${index}`}
                                bg={row.isTop ? 'green.50' : index % 2 === 0 ? 'white' : 'gray.50'}
                                _hover={{ bg: 'blue.50', transition: 'background 0.15s' }}
                                cursor="pointer"
                                borderY={row.isTop ? '2px solid' : 'none'}
                                borderColor={row.isTop ? 'green.400' : 'transparent'}
                                boxShadow={row.isTop ? 'md' : 'none'}
                              >
                              <Td
                                px={6}
                                py={4}
                                fontSize="base"
                                fontWeight={row.isTop ? 'extrabold' : 'medium'}
                                color={row.isTop ? 'green.700' : 'gray.800'}
                              >
                                <HStack>
                                  {row.isTop && <Text fontSize="xl">🌟</Text>}
                                  <Text>{row.school}</Text>
                                </HStack>
                              </Td>
                              <Td isNumeric px={6} py={4} fontSize="base" fontWeight={row.isTop ? 'bold' : 'normal'} color="gray.600">
                                {row.total}
                              </Td>
                              <Td isNumeric px={6} py={4} fontSize="base" fontWeight={row.isTop ? 'bold' : 'normal'} color="gray.600">
                                {row.placed}
                              </Td>
                              <Td isNumeric px={6} py={4} fontSize="base" fontWeight={row.isTop ? 'bold' : 'medium'}>
                                <Badge
                                  fontSize={row.isTop ? 'sm' : 'xs'}
                                  fontWeight={row.isTop ? 'extrabold' : 'bold'}
                                  px={4}
                                  py={1}
                                  borderRadius="full"
                                  colorScheme={row.percent === 0 ? 'red' : row.isTop ? 'green' : 'blue'}
                                  bg={row.isTop ? 'green.600' : row.percent === 0 ? 'red.50' : 'blue.50'}
                                  color={row.isTop ? 'white' : row.percent === 0 ? 'red.700' : 'blue.700'}
                                  border="1px solid"
                                  borderColor={row.isTop ? 'green.600' : row.percent === 0 ? 'red.200' : 'blue.200'}
                                  boxShadow={row.isTop ? 'lg' : 'none'}
                                >
                                  {row.percent}%
                                </Badge>
                              </Td>
                            </Tr>
                            ))
                          ) : (
                            <Tr>
                              <Td colSpan={4} textAlign="center" py={8} color="gray.500">
                                No placement data available
                              </Td>
                            </Tr>
                          )}
                          {/* Footer Row */}
                          <Tr bg="gray.100" fontWeight="bold" color="gray.700" borderTop="2px solid" borderColor="gray.300">
                            <Td px={6} py={4} fontSize="sm" textTransform="uppercase">
                              Total
                            </Td>
                            <Td isNumeric px={6} py={4} fontSize="sm">
                              {totalStudents}
                            </Td>
                            <Td isNumeric px={6} py={4} fontSize="sm">
                              {placedStudents}
                            </Td>
                            <Td isNumeric px={6} py={4} fontSize="sm">
                              {placementRate}%
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              </>
            )}
          </VStack>
        </Container>
      </Box>
    </AdminLayout>
  );
};

// Export Dashboard component
export default Dashboard;
