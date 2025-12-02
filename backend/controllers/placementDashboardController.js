import { getSupabaseClient } from '../database/supabase.js';

// ==================== HELPER FUNCTIONS ====================

/**
 * Normalize school name for comparison (trim, lowercase, normalize whitespace)
 * @param {string} name - School name
 * @returns {string} Normalized school name
 */
const normalizeSchoolName = (name) => {
  if (!name) return '';
  // Trim, lowercase, and normalize multiple spaces to single space
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
};

/**
 * Get school USNs from school filter (case-insensitive matching)
 * Supports single school or multiple schools (comma-separated)
 * @param {Object} supabase - Supabase client
 * @param {string|Array} school - School name(s) - can be single string, comma-separated string, or array
 * @returns {Promise<Array|null>} Array of USNs or null if no filter
 */
const getSchoolUSNs = async (supabase, school) => {
  if (!school) return null;
  
  // Parse school parameter - support string, comma-separated string, or array
  let schoolNames = [];
  if (Array.isArray(school)) {
    schoolNames = school.map(s => s.trim()).filter(s => s);
  } else if (typeof school === 'string') {
    // Check if it's comma-separated
    if (school.includes(',')) {
      schoolNames = school.split(',').map(s => s.trim()).filter(s => s);
    } else {
      schoolNames = [school.trim()];
    }
  }
  
  if (schoolNames.length === 0) return null;
  
  // Fetch all students to do case-insensitive matching
  // (Supabase .in() is case-sensitive, so we need to filter manually)
  const { data: allStudents, error: allStudentsError } = await supabase
    .from('students')
    .select('usn, school');

  if (allStudentsError) throw allStudentsError;
  
  // Normalize all school names for comparison
  const normalizedSchoolNames = schoolNames.map(name => normalizeSchoolName(name));
  
  // Find matching school names (case-insensitive, exact match after normalization)
  const matchingUSNs = [];
  
  allStudents?.forEach(student => {
    if (student.school) {
      const normalizedStudentSchool = normalizeSchoolName(student.school);
      // Check if this student's school matches any of the requested schools
      if (normalizedSchoolNames.includes(normalizedStudentSchool)) {
        matchingUSNs.push(student.usn);
      }
    }
  });
  
  console.log(`[getSchoolUSNs] Filter: ${schoolNames.length} school(s) "${schoolNames.join(', ')}" -> Found ${matchingUSNs.length} matching students`);
  
  return matchingUSNs.length > 0 ? matchingUSNs : [];
};

/**
 * Normalize company name for deduplication
 * @param {string} name - Company name
 * @returns {string} Normalized company name
 */
const normalizeCompanyName = (name) => {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/-*\d+$/, '');
};

/**
 * Check if offer indicates placement
 * @param {Object} offer - Job offer object
 * @returns {boolean} True if offer indicates placement
 */
const isPlacementOffer = (offer) => {
  const jobType = (offer.job_type || '').trim().toLowerCase();
  const interviewStatus = (offer.final_interview_status || '').toLowerCase();
  const offerLetterStatus = (offer.offer_letter_status || '').toLowerCase();
  
  const isPlacementByJobType = 
    (jobType.includes('full time') || jobType.includes('fulltime')) && 
    !jobType.includes('internship') && 
    !jobType.includes('only');
  
  const isPlacementByStatus = 
    interviewStatus.includes('selected') || 
    offerLetterStatus.includes('accepted') || 
    offerLetterStatus.includes('received');
  
  const isInternshipCumFulltime = 
    jobType.includes('internship') && 
    jobType.includes('cum') && 
    jobType.includes('full time');
  
  return isPlacementByJobType || isPlacementByStatus || isInternshipCumFulltime;
};

// ==================== MAIN API ENDPOINTS ====================

/**
 * Get overall placement statistics
 * @route GET /api/dashboard/placement/overall
 * @access Private (Admin only)
 * Returns: All main statistics (students, offers, placed, internships, etc.)
 */
export const getOverallStats = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    // Only superadmins can filter by school - regular admins always see all data
    const { school } = req.query;
    const isSuperAdmin = req.user?.role === 'superadmin';
    const schoolFilter = isSuperAdmin ? school : null;
    const schoolUSNs = await getSchoolUSNs(supabase, schoolFilter);

    // Handle empty result case
    if (schoolUSNs !== null && schoolUSNs.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalStudents: 0,
          totalOffers: 0,
          totalOffersPercent: 0,
          totalPlaced: 0,
          totalPlacedPercent: 0,
          totalPlacedCombined: 0,
          totalPlacedCombinedPercent: 0,
          totalInternships: 0,
          totalInternshipsPercent: 0,
          totalInternshipCumFulltime: 0,
          totalInternshipCumFulltimePercent: 0,
          totalPlacedStudents: 0,
          overallPlacementPercent: 0
        }
      });
    }

    // Get total students
    let studentsQuery = supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    if (schoolUSNs !== null && schoolUSNs.length > 0) {
      studentsQuery = studentsQuery.in('usn', schoolUSNs);
    }
    const { count: totalStudents, error: studentsError } = await studentsQuery;
    if (studentsError) throw studentsError;

    // Get all job offers
    let offersQuery = supabase
      .from('job_offers')
      .select('job_type, usn, final_interview_status, offer_letter_status');
    if (schoolUSNs !== null && schoolUSNs.length > 0) {
      offersQuery = offersQuery.in('usn', schoolUSNs);
    }
    const { data: allOffers, error: offersError } = await offersQuery;
    if (offersError) throw offersError;

    // Calculate statistics
    const totalOffers = allOffers?.length || 0;
    const totalOffersPercent = totalStudents > 0 
      ? parseFloat(((totalOffers / totalStudents) * 100).toFixed(2))
      : 0;

    // Categorize offers
    let totalPlaced = 0;
    let totalInternships = 0;
    let totalInternshipCumFulltime = 0;
    const placedUSNs = new Set();

    allOffers?.forEach(offer => {
      const jobType = (offer.job_type || '').trim().toLowerCase();
      const interviewStatus = (offer.final_interview_status || '').toLowerCase();
      const offerLetterStatus = (offer.offer_letter_status || '').toLowerCase();
      
      // Check for placed students
      if (interviewStatus.includes('selected') || 
          offerLetterStatus.includes('accepted') || 
          offerLetterStatus.includes('received')) {
        placedUSNs.add(offer.usn);
      }
      
      // Categorize by job type
      if (jobType.includes('internship') && jobType.includes('cum') && jobType.includes('full time')) {
        totalInternshipCumFulltime++;
      } else if ((jobType.includes('full time') || jobType.includes('fulltime')) && 
                 !jobType.includes('internship')) {
        totalPlaced++;
      } else if (jobType.includes('internship') && 
                 jobType.includes('only') && 
                 !jobType.includes('full time') && 
                 !jobType.includes('cum')) {
        totalInternships++;
      } else {
        // If offer doesn't fit into any category, count it as internship
        totalInternships++;
      }
    });

    const totalPlacedCombined = totalPlaced + totalInternshipCumFulltime;
    const totalPlacedStudents = placedUSNs.size;

    // Calculate percentages
    const totalPlacedPercent = totalStudents > 0 
      ? parseFloat(((totalPlaced / totalStudents) * 100).toFixed(2))
      : 0;
    const totalPlacedCombinedPercent = totalStudents > 0 
      ? parseFloat(((totalPlacedCombined / totalStudents) * 100).toFixed(2))
      : 0;
    const totalInternshipsPercent = totalStudents > 0 
      ? parseFloat(((totalInternships / totalStudents) * 100).toFixed(2))
      : 0;
    const totalInternshipCumFulltimePercent = totalStudents > 0 
      ? parseFloat(((totalInternshipCumFulltime / totalStudents) * 100).toFixed(2))
      : 0;
    const overallPlacementPercent = totalStudents > 0 
      ? parseFloat(((totalPlacedStudents / totalStudents) * 100).toFixed(2))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalStudents: totalStudents || 0,
        totalOffers,
        totalOffersPercent,
        totalPlaced,
        totalPlacedPercent,
        totalPlacedCombined,
        totalPlacedCombinedPercent,
        totalInternships,
        totalInternshipsPercent,
        totalInternshipCumFulltime,
        totalInternshipCumFulltimePercent,
        totalPlacedStudents,
        overallPlacementPercent
      }
    });
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overall placement statistics',
      error: error.message
    });
  }
};

/**
 * Get CTC statistics
 * @route GET /api/dashboard/placement/ctc
 * @access Private (Admin only)
 * Returns: All CTC statistics (average, median, highest, lowest, distribution array)
 */
export const getCTCStats = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    // Only superadmins can filter by school - regular admins always see all data
    const { school } = req.query;
    const isSuperAdmin = req.user?.role === 'superadmin';
    const schoolFilter = isSuperAdmin ? school : null;
    const schoolUSNs = await getSchoolUSNs(supabase, schoolFilter);

    // Handle empty result case
    if (schoolUSNs !== null && schoolUSNs.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          averageCTC: 0,
          medianCTC: 0,
          highestCTC: 0,
          lowestCTC: 0,
          distribution: []
        }
      });
    }

    // Get CTC data
    let ctcQuery = supabase
      .from('job_offers')
      .select('ctc_max_lpa, ctc_min_lpa, final_interview_status, offer_letter_status, job_type, usn');
    if (schoolUSNs !== null && schoolUSNs.length > 0) {
      ctcQuery = ctcQuery.in('usn', schoolUSNs);
    }
    const { data: ctcData, error: ctcError } = await ctcQuery;
    if (ctcError) throw ctcError;

    // Filter for placed offers
    const placedOffers = ctcData?.filter(offer => isPlacementOffer(offer)) || [];

    // Extract CTC values
    const ctcValues = [];
    placedOffers.forEach(offer => {
      const ctcMax = parseFloat(offer.ctc_max_lpa);
      const ctcMin = parseFloat(offer.ctc_min_lpa);
      const ctc = !isNaN(ctcMax) && ctcMax > 0 ? ctcMax : (!isNaN(ctcMin) && ctcMin > 0 ? ctcMin : null);
      if (ctc !== null && ctc > 0) {
        ctcValues.push(ctc);
      }
    });

    // Calculate statistics
    let averageCTC = 0;
    let medianCTC = 0;
    let highestCTC = 0;
    let lowestCTC = 0;

    if (ctcValues.length > 0) {
      highestCTC = Math.max(...ctcValues);
      lowestCTC = Math.min(...ctcValues);
      averageCTC = ctcValues.reduce((sum, val) => sum + val, 0) / ctcValues.length;
      
      const sorted = [...ctcValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianCTC = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    }

    res.status(200).json({
      success: true,
      data: {
        averageCTC: parseFloat(averageCTC.toFixed(2)),
        medianCTC: parseFloat(medianCTC.toFixed(2)),
        highestCTC: parseFloat(highestCTC.toFixed(2)),
        lowestCTC: parseFloat(lowestCTC.toFixed(2)),
        distribution: ctcValues
      }
    });
  } catch (error) {
    console.error('Error fetching CTC stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching CTC statistics',
      error: error.message
    });
  }
};

/**
 * Get company statistics
 * @route GET /api/dashboard/placement/companies
 * @access Private (Admin only)
 * Returns: Company count and list of unique companies
 */
export const getCompanyStats = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    // Only superadmins can filter by school - regular admins always see all data
    const { school } = req.query;
    const isSuperAdmin = req.user?.role === 'superadmin';
    const schoolFilter = isSuperAdmin ? school : null;
    const schoolUSNs = await getSchoolUSNs(supabase, schoolFilter);

    // Handle empty result case
    if (schoolUSNs !== null && schoolUSNs.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          uniqueCompanies: 0,
          companies: []
        }
      });
    }

    // Get company data
    let companiesQuery = supabase
      .from('job_offers')
      .select('company_name, usn')
      .not('company_name', 'is', null);
    if (schoolUSNs !== null && schoolUSNs.length > 0) {
      companiesQuery = companiesQuery.in('usn', schoolUSNs);
    }
    const { data: companiesData, error: companiesError } = await companiesQuery;
    if (companiesError) throw companiesError;

    // Normalize and deduplicate company names
    const normalizedMap = new Map();
    companiesData?.forEach(offer => {
      if (offer.company_name) {
        const normalized = normalizeCompanyName(offer.company_name);
        if (!normalizedMap.has(normalized)) {
          normalizedMap.set(normalized, offer.company_name.trim());
        }
      }
    });

    const uniqueCompanies = Array.from(normalizedMap.values());

    res.status(200).json({
      success: true,
      data: {
        uniqueCompanies: uniqueCompanies.length,
        companies: uniqueCompanies
      }
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company statistics',
      error: error.message
    });
  }
};

/**
 * Get school distribution
 * @route GET /api/dashboard/placement/schools
 * @access Private (Admin only)
 * Returns: School distribution with student counts
 */
export const getSchoolDistribution = async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    // Get all students with their schools
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('usn, school');

    if (studentsError) throw studentsError;

    // Get all job offers
    const { data: offersData, error: offersError } = await supabase
      .from('job_offers')
      .select('usn, job_type');

    if (offersError) throw offersError;

    // Categorize offers
    const studentsWithPlacement = new Set();
    const studentsWithInternship = new Set();
    const studentsWithAnyOffer = new Set();

    offersData?.forEach(offer => {
      const jobType = (offer.job_type || '').toLowerCase();
      studentsWithAnyOffer.add(offer.usn);
      
      if (jobType.includes('full time')) {
        studentsWithPlacement.add(offer.usn);
      } else if (jobType.includes('internship')) {
        studentsWithInternship.add(offer.usn);
      } else {
        // If offer doesn't fit into any category, count it as internship
        studentsWithInternship.add(offer.usn);
      }
    });

    // Count students by school
    const schoolCounts = {};
    const schoolPlacementCounts = {};
    const schoolInternshipCounts = {};
    const schoolAnyOfferCounts = {};
    
    studentsData?.forEach(student => {
      const school = student.school || 'Unknown';
      schoolCounts[school] = (schoolCounts[school] || 0) + 1;
      
      if (!schoolPlacementCounts[school]) {
        schoolPlacementCounts[school] = new Set();
        schoolInternshipCounts[school] = new Set();
        schoolAnyOfferCounts[school] = new Set();
      }
      
      if (studentsWithPlacement.has(student.usn)) {
        schoolPlacementCounts[school].add(student.usn);
      }
      if (studentsWithInternship.has(student.usn)) {
        schoolInternshipCounts[school].add(student.usn);
      }
      if (studentsWithAnyOffer.has(student.usn)) {
        schoolAnyOfferCounts[school].add(student.usn);
      }
    });

    // Convert to array format
    const distribution = Object.keys(schoolCounts).map(school => ({
      name: school,
      total: schoolCounts[school],
      placement: schoolPlacementCounts[school]?.size || 0,
      internship: schoolInternshipCounts[school]?.size || 0,
      anyOffer: schoolAnyOfferCounts[school]?.size || 0
    }));

    // Sort by total count descending
    distribution.sort((a, b) => b.total - a.total);

    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Error fetching school distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching school distribution',
      error: error.message
    });
  }
};

/**
 * Get placement statistics by school
 * @route GET /api/dashboard/placement/by-school
 * @access Private (Admin only)
 * Returns: Placement statistics grouped by school
 */
export const getPlacementBySchool = async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    // Get all students grouped by school
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('usn, school');

    if (studentsError) throw studentsError;

    // Get all job offers (need usn to map to schools)
    const { data: offersData, error: offersError } = await supabase
      .from('job_offers')
      .select('usn, final_interview_status, offer_letter_status');

    if (offersError) throw offersError;

    // Create a map of school to students
    const schoolStudentsMap = {};
    studentsData?.forEach(student => {
      const school = student.school || 'Unknown';
      if (!schoolStudentsMap[school]) {
        schoolStudentsMap[school] = {
          totalStudents: 0,
          studentUSNs: new Set()
        };
      }
      schoolStudentsMap[school].totalStudents++;
      schoolStudentsMap[school].studentUSNs.add(student.usn);
    });

    // Create a map of student USN to school for quick lookup
    const usnToSchoolMap = {};
    studentsData?.forEach(student => {
      usnToSchoolMap[student.usn] = student.school || 'Unknown';
    });

    // Count all offers per school (including uncategorized ones)
    const schoolOffersCount = {};
    const placedUSNs = new Set();
    
    offersData?.forEach(offer => {
      const school = usnToSchoolMap[offer.usn] || 'Unknown';
      
      // Count all offers (including uncategorized ones)
      if (!schoolOffersCount[school]) {
        schoolOffersCount[school] = 0;
      }
      schoolOffersCount[school]++;
      
      // Track placed students
      const interviewStatus = (offer.final_interview_status || '').toLowerCase();
      const offerLetterStatus = (offer.offer_letter_status || '').toLowerCase();
      
      if (interviewStatus.includes('selected') || 
          offerLetterStatus.includes('accepted') || 
          offerLetterStatus.includes('received')) {
        placedUSNs.add(offer.usn);
      }
    });

    // Get all schools that have either students or offers (union of both)
    const allSchools = new Set([
      ...Object.keys(schoolStudentsMap),
      ...Object.keys(schoolOffersCount)
    ]);

    // Calculate placement stats by school
    const schoolStats = Array.from(allSchools).map(school => {
      const schoolData = schoolStudentsMap[school] || {
        totalStudents: 0,
        studentUSNs: new Set()
      };
      const totalOffers = schoolOffersCount[school] || 0;
      const placedCount = Array.from(schoolData.studentUSNs).filter(usn => 
        placedUSNs.has(usn)
      ).length;
      
      // Calculate offer percentage (total offers / total students)
      const offerPercent = schoolData.totalStudents > 0
        ? parseFloat(((totalOffers / schoolData.totalStudents) * 100).toFixed(2))
        : 0;
      
      // Calculate placement percentage (placed students / total students)
      const placementPercent = schoolData.totalStudents > 0
        ? parseFloat(((placedCount / schoolData.totalStudents) * 100).toFixed(2))
        : 0;

      return {
        school: school,
        totalStudents: schoolData.totalStudents,
        totalOffers: totalOffers,
        placedStudents: placedCount,
        offerPercent: offerPercent,
        placementPercent: placementPercent
      };
    });

    // Sort by school name
    schoolStats.sort((a, b) => a.school.localeCompare(b.school));

    res.status(200).json({
      success: true,
      data: schoolStats
    });
  } catch (error) {
    console.error('Error fetching placement by school:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching placement statistics by school',
      error: error.message
    });
  }
};
