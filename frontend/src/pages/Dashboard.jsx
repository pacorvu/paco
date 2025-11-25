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
  const { user, isAdmin, isVC } = useAuth();
  const [overallStats, setOverallStats] = useState(null);
  const [schoolStats, setSchoolStats] = useState([]);
  const [schoolDistribution, setSchoolDistribution] = useState([]);
  const [ctcData, setCtcData] = useState([]);
  const [hiringPartners, setHiringPartners] = useState([]);
  const [ctcStats, setCtcStats] = useState({ averageCTC: 0, medianCTC: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTotalOffersHovered, setIsTotalOffersHovered] = useState(false);
  const [isTotalPlacedHovered, setIsTotalPlacedHovered] = useState(false);
  const [failedLogos, setFailedLogos] = useState(new Set());

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
        borderColor: '#9ca3af',
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#172e36',
        pointBorderColor: '#172e36',
        pointHoverBackgroundColor: '#172e36',
        pointHoverBorderColor: '#172e36',
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

  // Normalize company name for comparison (trim, lowercase, and remove trailing dashes and numbers)
  const normalizeCompanyName = (companyName) => {
    if (!companyName) return '';
    // Trim, lowercase, and remove trailing dashes/hyphens and numbers
    return companyName.trim().toLowerCase().replace(/-*\d+$/, '');
  };

  // Convert company name to logo filename format (no spaces, lowercase, .png)
  const getCompanyLogoFilename = (companyName) => {
    if (!companyName) return '';
    return companyName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '') + '.png';
  };

  // Get logo path for a company
  const getCompanyLogoPath = (companyName) => {
    const filename = getCompanyLogoFilename(companyName);
    return `/company_logos/${filename}`;
  };

  useEffect(() => {
    if (isAdmin || isVC) {
      fetchPlacementStats();
    }
  }, [isAdmin, isVC]);

  // Reset failed logos when hiring partners data changes
  useEffect(() => {
    setFailedLogos(new Set());
  }, [hiringPartners]);

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
  const totalOffersPercent = overallStats?.totalOffersPercent || 0;
  const totalPlacedCombined = overallStats?.totalPlacedCombined || 0;
  const totalPlacedCombinedPercent = overallStats?.totalPlacedCombinedPercent || 0;
  const totalPlaced = overallStats?.totalPlaced || 0;
  const totalPlacedPercent = overallStats?.totalPlacedPercent || 0;
  const totalInternships = overallStats?.totalInternships || 0;
  const totalInternshipsPercent = overallStats?.totalInternshipsPercent || 0;
  const totalInternshipCumFulltime = overallStats?.totalInternshipCumFulltime || 0;
  const totalInternshipCumFulltimePercent = overallStats?.totalInternshipCumFulltimePercent || 0;
  // Backward compatibility
  const placedStudents = overallStats?.totalPlacedStudents || 0;
  const placementRate = overallStats?.overallPlacementPercent || 0;
  const uniqueCompanies = overallStats?.uniqueHiringCompanies || 0;
  const highestCTC = overallStats?.highestCTCLPA || 0;
  const averageCTC = ctcStats?.averageCTC || overallStats?.averageCTCLPA || 0;
  const medianCTC = ctcStats?.medianCTC || overallStats?.medianCTCLPA || 0;
  const lowestCTC = overallStats?.lowestCTCLPA || 0;

  // Transform school stats to match table format
  const placementBySchool = schoolStats.map(stat => {
    return {
      school: stat.school,
      total: stat.totalStudents,
      placed: stat.placedStudents,
      percent: parseFloat(stat.placementPercent?.toFixed(2) || 0)
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
                  bgGradient="linear(to-r, #172e36, #1e3a47)"
                  p={6}
                  borderRadius="xl"
                  boxShadow="2xl"
                  color="white"
                >
                  <Flex justify="space-between" align="center">
                    <Text fontSize="lg" fontWeight="medium" textTransform="uppercase" letterSpacing="widest" opacity={0.8}>
                      Total Students Enrolled
                    </Text>
                    <Icon as={FiUsers} boxSize={8} color="#d1a85d" opacity={0.9} />
                  </Flex>
                  <Text fontSize="5xl" fontWeight="extrabold" mt={1}>
                    {totalStudents}
                  </Text>
                </Box>

                {/* Row 2: Total Offers and Total Placed */}
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 4, sm: 6 }}>
                  <Box
                    bg={cardBg}
                    p={4}
                    borderRadius="xl"
                    boxShadow="lg"
                    borderBottom="4px solid"
                    borderColor="#d1a85d"
                    onMouseEnter={() => setIsTotalOffersHovered(true)}
                    onMouseLeave={() => setIsTotalOffersHovered(false)}
                    cursor="pointer"
                    transition="all 0.3s ease"
                    _hover={{
                      transform: 'scale(1.02)',
                      boxShadow: 'xl',
                      borderColor: '#d1a85d'
                    }}
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
                    borderColor="#d1a85d"
                  >
                    <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                      Total Offers Percentage
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="#d1a85d" mt={1}>
                      {totalOffersPercent.toFixed(2)}%
                    </Text>
                  </Box>

                  <Box
                    bg={cardBg}
                    p={4}
                    borderRadius="xl"
                    boxShadow="lg"
                    borderBottom="4px solid"
                    borderColor="#d1a85d"
                    onMouseEnter={() => setIsTotalPlacedHovered(true)}
                    onMouseLeave={() => setIsTotalPlacedHovered(false)}
                    cursor="pointer"
                    transition="all 0.3s ease"
                    _hover={{
                      transform: 'scale(1.02)',
                      boxShadow: 'xl',
                      borderColor: '#d1a85d'
                    }}
                  >
                    <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                      Total Placed
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.900" mt={1}>
                      {totalPlacedCombined}
                    </Text>
                  </Box>

                  <Box
                    bg={cardBg}
                    p={4}
                    borderRadius="xl"
                    boxShadow="lg"
                    borderBottom="4px solid"
                    borderColor="#d1a85d"
                  >
                    <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                      Total Placed Percentage
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="#d1a85d" mt={1}>
                      {totalPlacedCombinedPercent.toFixed(2)}%
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* Row 4: Three Categories */}
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, sm: 6 }}>
                  {/* Total Full time */}
                  <Box
                    bg={(isTotalOffersHovered || isTotalPlacedHovered) ? 'green.50' : cardBg}
                    p={4}
                    borderRadius="xl"
                    boxShadow={(isTotalOffersHovered || isTotalPlacedHovered) ? 'xl' : 'lg'}
                    borderBottom="4px solid"
                    borderColor={(isTotalOffersHovered || isTotalPlacedHovered) ? 'green.600' : 'green.500'}
                    border={(isTotalOffersHovered || isTotalPlacedHovered) ? '2px solid' : 'none'}
                    borderTopColor={(isTotalOffersHovered || isTotalPlacedHovered) ? 'green.600' : 'transparent'}
                    borderLeftColor={(isTotalOffersHovered || isTotalPlacedHovered) ? 'green.600' : 'transparent'}
                    borderRightColor={(isTotalOffersHovered || isTotalPlacedHovered) ? 'green.600' : 'transparent'}
                    transition="all 0.4s ease-out"
                    transform={(isTotalOffersHovered || isTotalPlacedHovered) ? 'scale(1.05)' : 'scale(1)'}
                    position="relative"
                    overflow="hidden"
                  >
                    {(isTotalOffersHovered || isTotalPlacedHovered) && (
                      <Box
                        position="absolute"
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        bgGradient="linear(to-br, green.100, green.50)"
                        opacity={0.5}
                        zIndex={0}
                      />
                    )}
                    <Box position="relative" zIndex={1}>
                      <Text fontSize="xs" fontWeight="medium" color={(isTotalOffersHovered || isTotalPlacedHovered) ? 'green.700' : 'gray.500'} textTransform="uppercase" letterSpacing="wider">
                        Total Full time
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold" color={(isTotalOffersHovered || isTotalPlacedHovered) ? 'green.800' : 'gray.900'} mt={1}>
                        {totalPlaced}
                      </Text>
                      <Text fontSize="sm" fontWeight="medium" color={(isTotalOffersHovered || isTotalPlacedHovered) ? 'green.700' : 'green.600'} mt={2}>
                        Total Full time %: {totalPlacedPercent.toFixed(2)}%
                      </Text>
                    </Box>
                  </Box>

                  {/* Total Internships */}
                  <Box
                    bg={isTotalOffersHovered ? 'purple.50' : cardBg}
                    p={4}
                    borderRadius="xl"
                    boxShadow={isTotalOffersHovered ? 'xl' : 'lg'}
                    borderBottom="4px solid"
                    borderColor={isTotalOffersHovered ? 'purple.600' : 'purple.500'}
                    border={isTotalOffersHovered ? '2px solid' : 'none'}
                    borderTopColor={isTotalOffersHovered ? 'purple.600' : 'transparent'}
                    borderLeftColor={isTotalOffersHovered ? 'purple.600' : 'transparent'}
                    borderRightColor={isTotalOffersHovered ? 'purple.600' : 'transparent'}
                    transition="all 0.4s ease-out"
                    transform={isTotalOffersHovered ? 'scale(1.05)' : 'scale(1)'}
                    position="relative"
                    overflow="hidden"
                  >
                    {isTotalOffersHovered && (
                      <Box
                        position="absolute"
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        bgGradient="linear(to-br, purple.100, purple.50)"
                        opacity={0.5}
                        zIndex={0}
                      />
                    )}
                    <Box position="relative" zIndex={1}>
                      <Text fontSize="xs" fontWeight="medium" color={isTotalOffersHovered ? 'purple.700' : 'gray.500'} textTransform="uppercase" letterSpacing="wider">
                        Total Internships
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold" color={isTotalOffersHovered ? 'purple.800' : 'gray.900'} mt={1}>
                        {totalInternships}
                      </Text>
                      <Text fontSize="sm" fontWeight="medium" color={isTotalOffersHovered ? 'purple.700' : 'purple.600'} mt={2}>
                        Total Internships %: {totalInternshipsPercent.toFixed(2)}%
                      </Text>
                    </Box>
                  </Box>

                  {/* Total Internship-cum-Fulltime */}
                  <Box
                    bg={(isTotalOffersHovered || isTotalPlacedHovered) ? 'orange.50' : cardBg}
                    p={4}
                    borderRadius="xl"
                    boxShadow={(isTotalOffersHovered || isTotalPlacedHovered) ? 'xl' : 'lg'}
                    borderBottom="4px solid"
                    borderColor={(isTotalOffersHovered || isTotalPlacedHovered) ? 'orange.600' : 'orange.500'}
                    border={(isTotalOffersHovered || isTotalPlacedHovered) ? '2px solid' : 'none'}
                    borderTopColor={(isTotalOffersHovered || isTotalPlacedHovered) ? 'orange.600' : 'transparent'}
                    borderLeftColor={(isTotalOffersHovered || isTotalPlacedHovered) ? 'orange.600' : 'transparent'}
                    borderRightColor={(isTotalOffersHovered || isTotalPlacedHovered) ? 'orange.600' : 'transparent'}
                    transition="all 0.4s ease-out"
                    transform={(isTotalOffersHovered || isTotalPlacedHovered) ? 'scale(1.05)' : 'scale(1)'}
                    position="relative"
                    overflow="hidden"
                  >
                    {(isTotalOffersHovered || isTotalPlacedHovered) && (
                      <Box
                        position="absolute"
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        bgGradient="linear(to-br, orange.100, orange.50)"
                        opacity={0.5}
                        zIndex={0}
                      />
                    )}
                    <Box position="relative" zIndex={1}>
                      <Text fontSize="xs" fontWeight="medium" color={(isTotalOffersHovered || isTotalPlacedHovered) ? 'orange.700' : 'gray.500'} textTransform="uppercase" letterSpacing="wider">
                        Total Internship-cum-Fulltime
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold" color={(isTotalOffersHovered || isTotalPlacedHovered) ? 'orange.800' : 'gray.900'} mt={1}>
                        {totalInternshipCumFulltime}
                      </Text>
                      <Text fontSize="sm" fontWeight="medium" color={(isTotalOffersHovered || isTotalPlacedHovered) ? 'orange.700' : 'orange.600'} mt={2}>
                        Total Internship-cum-Fulltime %: {totalInternshipCumFulltimePercent.toFixed(2)}%
                      </Text>
                    </Box>
                  </Box>
                </SimpleGrid>

                {/* Row 5: CTC Financial Summary */}
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
                        <Line data={chartData} options={chartOptions} />
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

                {/* Row 6: Hiring Partners */}
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
                    width="100%"
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
                    {hiringPartners.length > 0 ? (() => {
                      // Deduplicate companies by normalizing names (trim, lowercase, remove trailing dashes and numbers)
                      const normalizedMap = new Map();
                      hiringPartners.forEach(companyName => {
                        if (companyName) {
                          const normalized = normalizeCompanyName(companyName);
                          if (!normalizedMap.has(normalized)) {
                            normalizedMap.set(normalized, companyName.trim());
                          }
                        }
                      });
                      const uniqueCompanies = Array.from(normalizedMap.values());

                      // Render logo/item component
                      const renderCompanyItem = (companyName, setIndex, itemIndex) => {
                        const logoPath = getCompanyLogoPath(companyName);
                        const logoFailed = failedLogos.has(companyName);
                        return (
                          <Box 
                            key={`set${setIndex}-${companyName}-${itemIndex}`} 
                            flexShrink={0} 
                            px={8} 
                            display="inline-flex" 
                            alignItems="center" 
                            justifyContent="center" 
                            minH="64px"
                            minW="120px"
                          >
                            {logoFailed ? (
                              <Text
                                fontSize="sm"
                                fontWeight="medium"
                                color="gray.600"
                                textAlign="center"
                                whiteSpace="nowrap"
                                maxW="180px"
                                overflow="hidden"
                                textOverflow="ellipsis"
                              >
                                {companyName}
                              </Text>
                            ) : (
                              <Image
                                src={logoPath}
                                alt={`${companyName} Logo`}
                                h={16}
                                w="auto"
                                maxW="180px"
                                objectFit="contain"
                                bg="transparent"
                                onError={() => {
                                  // Track failed logo and update state
                                  setFailedLogos(prev => new Set([...prev, companyName]));
                                }}
                              />
                            )}
                          </Box>
                        );
                      };

                      return (
                        <Box
                          display="flex"
                          whiteSpace="nowrap"
                          width="max-content"
                          sx={{
                            '@keyframes scroll-left': {
                              '0%': {
                                transform: 'translateX(0)'
                              },
                              '100%': {
                                transform: 'translateX(calc(-100% / 2))'
                              }
                            },
                            animation: 'scroll-left 40s linear infinite',
                            '&:hover': {
                              animationPlayState: 'paused'
                            }
                          }}
                        >
                          {/* Logo Set 1 */}
                          {uniqueCompanies.map((companyName, index) => 
                            renderCompanyItem(companyName, 1, index)
                          )}
                          {/* Logo Set 2 (Duplicated for seamless loop) */}
                          {uniqueCompanies.map((companyName, index) => 
                            renderCompanyItem(companyName, 2, index)
                          )}
                        </Box>
                      );
                    })() : (
                      <Text color="gray.500" textAlign="center" width="100%">
                        No hiring partners data available
                      </Text>
                    )}
                  </Box>
                </Box>

                {/* Row 7: Student Distribution by School */}
                <Box>
                  <Heading as="h2" fontSize="xl" fontWeight="bold" color="gray.700" mb={4}>
                    Student Distribution by School
                  </Heading>
                  <SimpleGrid columns={{ base: 2, sm: 4, lg: 8 }} spacing={4} mb={8}>
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

                {/* Row 8: Placement by School Table */}
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
                        <Thead bgGradient="linear(to-r, #172e36, #1e3a47)" borderBottom="2px solid" borderColor="#1e3a47">
                          <Tr>
                            <Th color="white" fontSize="sm" fontWeight="extrabold" textTransform="uppercase" letterSpacing="wider" py={3} px={6}>
                              School
                            </Th>
                            <Th isNumeric color="white" fontSize="sm" fontWeight="extrabold" textTransform="uppercase" letterSpacing="wider" py={3} px={6}>
                              Total Students
                            </Th>
                            <Th isNumeric color="white" fontSize="sm" fontWeight="extrabold" textTransform="uppercase" letterSpacing="wider" py={3} px={6}>
                              Total Offers
                            </Th>
                            <Th isNumeric color="white" fontSize="sm" fontWeight="extrabold" textTransform="uppercase" letterSpacing="wider" py={3} px={6}>
                              Offer %
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {placementBySchool.length > 0 ? (
                            placementBySchool.map((row, index) => (
                              <Tr
                                key={`${row.school}-${index}`}
                                bg="white"
                                _hover={{ bg: 'rgba(23, 46, 54, 0.05)', transition: 'background 0.15s' }}
                                cursor="pointer"
                              >
                                <Td
                                  px={6}
                                  py={4}
                                  fontSize="base"
                                  fontWeight="medium"
                                  color="gray.800"
                                >
                                  <Text>{row.school}</Text>
                                </Td>
                                <Td isNumeric px={6} py={4} fontSize="base" fontWeight="normal" color="gray.600">
                                  {row.total}
                                </Td>
                                <Td isNumeric px={6} py={4} fontSize="base" fontWeight="normal" color="gray.600">
                                  {row.placed}
                                </Td>
                                <Td isNumeric px={6} py={4} fontSize="base" fontWeight="medium">
                                  <Badge
                                    fontSize="xs"
                                    fontWeight="bold"
                                    px={4}
                                    py={1}
                                    borderRadius="full"
                                    colorScheme={row.percent === 0 ? 'red' : row.percent > 10 ? 'green' : 'blue'}
                                    bg={row.percent === 0 ? 'red.50' : row.percent > 10 ? 'green.50' : 'blue.50'}
                                    color={row.percent === 0 ? 'red.700' : row.percent > 10 ? 'green.700' : 'blue.700'}
                                    border="1px solid"
                                    borderColor={row.percent === 0 ? 'red.200' : row.percent > 10 ? 'green.200' : 'blue.200'}
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
                          <Tr 
                            bgGradient="linear(to-r, rgba(23, 46, 54, 0.08), rgba(30, 58, 71, 0.08))" 
                            fontWeight="bold" 
                            color="gray.800" 
                            borderTop="2px solid" 
                            borderColor="#172e36"
                          >
                            <Td px={6} py={4} fontSize="sm" textTransform="uppercase" fontWeight="700">
                              Total
                            </Td>
                            <Td isNumeric px={6} py={4} fontSize="sm" fontWeight="700">
                              {totalStudents}
                            </Td>
                            <Td isNumeric px={6} py={4} fontSize="sm" fontWeight="700">
                              {placedStudents}
                            </Td>
                            <Td isNumeric px={6} py={4} fontSize="sm" fontWeight="700">
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
