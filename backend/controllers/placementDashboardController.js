import { getSupabaseClient } from '../database/supabase.js';

// @desc    Get overall placement dashboard statistics
// @route   GET /api/dashboard/placement/overall
// @access  Private (Admin only)
export const getOverallPlacementStats = async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    // Get total students count
    const { count: totalStudents, error: studentsError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (studentsError) throw studentsError;

    // Get all job offers with job_type for categorization
    const { data: allOffers, error: offersError } = await supabase
      .from('job_offers')
      .select('job_type');

    if (offersError) throw offersError;

    // Calculate total offers count
    const totalOffers = allOffers?.length || 0;

    // Calculate Total Offers Percentage
    const totalOffersPercent = totalStudents > 0 
      ? ((totalOffers / totalStudents) * 100).toFixed(2) 
      : '0.00';

    // Categorize offers by job_type
    // Total Placed: job_type = "Full time" OR "Full Time PPO" (case-insensitive)
    // Total Internships: job_type = "internship-only" (case-insensitive)
    // Total Internship-cum-Fulltime: job_type = "Internship cum Full time" (case-insensitive)
    let totalPlaced = 0;
    let totalInternships = 0;
    let totalInternshipCumFulltime = 0;

    allOffers?.forEach(offer => {
      const jobType = (offer.job_type || '').trim();
      const jobTypeLower = jobType.toLowerCase();
      
      // Check for Internship cum Full time first (most specific)
      // Handle variations: "internship cum full time", "internship-cum-fulltime", etc.
      if (jobTypeLower.includes('internship') && 
          jobTypeLower.includes('cum') && 
          jobTypeLower.includes('full time')) {
        totalInternshipCumFulltime++;
      }
      // Check for Full time or Full Time PPO (both are considered placed)
      // Handle variations: "full time", "full time ppo", "fulltime", etc.
      else if ((jobTypeLower.includes('full time') || jobTypeLower.includes('fulltime')) && 
               !jobTypeLower.includes('internship')) {
        totalPlaced++;
      }
      // Check for internship-only (handle both "internship-only" and "internship only")
      // Must contain "internship" and "only" but NOT "full time" or "cum"
      else if (jobTypeLower.includes('internship') && 
               jobTypeLower.includes('only') && 
               !jobTypeLower.includes('full time') && 
               !jobTypeLower.includes('cum')) {
        totalInternships++;
      }
    });

    // Calculate Total Placed (Full time + Internship cum Full time)
    const totalPlacedCombined = totalPlaced + totalInternshipCumFulltime;
    const totalPlacedCombinedPercent = totalStudents > 0 
      ? ((totalPlacedCombined / totalStudents) * 100).toFixed(2) 
      : '0.00';

    // Calculate percentages for each category
    const totalPlacedPercent = totalStudents > 0 
      ? ((totalPlaced / totalStudents) * 100).toFixed(2) 
      : '0.00';
    
    const totalInternshipsPercent = totalStudents > 0 
      ? ((totalInternships / totalStudents) * 100).toFixed(2) 
      : '0.00';
    
    const totalInternshipCumFulltimePercent = totalStudents > 0 
      ? ((totalInternshipCumFulltime / totalStudents) * 100).toFixed(2) 
      : '0.00';

    // Get all job offers to determine placed students (for backward compatibility)
    // A student is considered "placed" if they have at least one offer with final_interview_status = "Selected" (case-insensitive)
    // or if offer_letter_status indicates acceptance
    const { data: allOffersWithStatus, error: offersError2 } = await supabase
      .from('job_offers')
      .select('usn, final_interview_status, offer_letter_status');

    if (offersError2) throw offersError2;

    // Filter for placed students - check if status contains "selected" (case-insensitive)
    // or if offer_letter_status indicates acceptance
    const placedUSNs = new Set();
    allOffersWithStatus?.forEach(offer => {
      const interviewStatus = (offer.final_interview_status || '').toLowerCase();
      const offerLetterStatus = (offer.offer_letter_status || '').toLowerCase();
      
      // Consider placed if:
      // 1. final_interview_status contains "selected" (case-insensitive)
      // 2. offer_letter_status contains "accepted" or "received" (case-insensitive)
      if (interviewStatus.includes('selected') || 
          offerLetterStatus.includes('accepted') || 
          offerLetterStatus.includes('received')) {
        placedUSNs.add(offer.usn);
      }
    });

    const totalPlacedStudents = placedUSNs.size;

    // Calculate overall placement percentage (for backward compatibility)
    const overallPlacementPercent = totalStudents > 0 
      ? ((totalPlacedStudents / totalStudents) * 100).toFixed(2) 
      : '0.00';

    // Get unique hiring companies
    const { data: companiesData, error: companiesError } = await supabase
      .from('job_offers')
      .select('company_name')
      .not('company_name', 'is', null);

    if (companiesError) throw companiesError;

    // Normalize company names: trim, lowercase, and remove trailing dashes and numbers
    const normalizeCompanyName = (name) => {
      if (!name) return '';
      // Trim, lowercase, and remove trailing dashes/hyphens and numbers
      return name.trim().toLowerCase().replace(/-*\d+$/, '');
    };
    
    const normalizedCompanies = new Set();
    companiesData?.forEach(offer => {
      if (offer.company_name) {
        const normalized = normalizeCompanyName(offer.company_name);
        normalizedCompanies.add(normalized);
      }
    });
    const uniqueHiringCompanies = normalizedCompanies.size;

    // Get highest and lowest CTC from placed offers only
    const { data: ctcData, error: ctcError } = await supabase
      .from('job_offers')
      .select('ctc_max_lpa, ctc_min_lpa, final_interview_status, offer_letter_status');

    if (ctcError) throw ctcError;

    // Filter for placed students only
    const placedOffers = ctcData?.filter(offer => {
      const interviewStatus = (offer.final_interview_status || '').toLowerCase();
      const offerLetterStatus = (offer.offer_letter_status || '').toLowerCase();
      
      return interviewStatus.includes('selected') || 
             offerLetterStatus.includes('accepted') || 
             offerLetterStatus.includes('received');
    }) || [];

    let highestCTC = null;
    let lowestCTC = null;
    let averageCTC = null;
    let medianCTC = null;

    if (placedOffers.length > 0) {
      // Extract all CTC values (prefer max, fallback to min)
      const allCTCs = [];
      placedOffers.forEach(offer => {
        const ctc = parseFloat(offer.ctc_max_lpa || offer.ctc_min_lpa);
        if (!isNaN(ctc) && ctc > 0) {
          allCTCs.push(ctc);
        }
      });

      if (allCTCs.length > 0) {
        highestCTC = Math.max(...allCTCs);
        lowestCTC = Math.min(...allCTCs);
        
        // Calculate average
        averageCTC = allCTCs.reduce((sum, val) => sum + val, 0) / allCTCs.length;
        
        // Calculate median
        const sorted = [...allCTCs].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        medianCTC = sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalStudents: totalStudents || 0,
        totalOffersRecords: totalOffers || 0,
        totalOffersPercent: parseFloat(totalOffersPercent),
        totalPlacedCombined: totalPlacedCombined,
        totalPlacedCombinedPercent: parseFloat(totalPlacedCombinedPercent),
        totalPlaced: totalPlaced,
        totalPlacedPercent: parseFloat(totalPlacedPercent),
        totalInternships: totalInternships,
        totalInternshipsPercent: parseFloat(totalInternshipsPercent),
        totalInternshipCumFulltime: totalInternshipCumFulltime,
        totalInternshipCumFulltimePercent: parseFloat(totalInternshipCumFulltimePercent),
        // Backward compatibility fields
        totalPlacedStudents: totalPlacedStudents,
        overallPlacementPercent: parseFloat(overallPlacementPercent),
        uniqueHiringCompanies: uniqueHiringCompanies,
        highestCTCLPA: highestCTC,
        lowestCTCLPA: lowestCTC,
        averageCTCLPA: averageCTC ? parseFloat(averageCTC.toFixed(2)) : null,
        medianCTCLPA: medianCTC ? parseFloat(medianCTC.toFixed(2)) : null
      }
    });
  } catch (error) {
    console.error('Error fetching overall placement stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overall placement statistics',
      error: error.message
    });
  }
};

// @desc    Get placement statistics by school
// @route   GET /api/dashboard/placement/by-school
// @access  Private (Admin only)
export const getPlacementBySchool = async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    // Get all students grouped by school
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('usn, school');

    if (studentsError) throw studentsError;

    // Get all job offers with placement status
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

    // Create a map of placed students (USNs with selected status)
    const placedUSNs = new Set();
    offersData?.forEach(offer => {
      const interviewStatus = (offer.final_interview_status || '').toLowerCase();
      const offerLetterStatus = (offer.offer_letter_status || '').toLowerCase();
      
      // Consider placed if:
      // 1. final_interview_status contains "selected" (case-insensitive)
      // 2. offer_letter_status contains "accepted" or "received" (case-insensitive)
      if (interviewStatus.includes('selected') || 
          offerLetterStatus.includes('accepted') || 
          offerLetterStatus.includes('received')) {
        placedUSNs.add(offer.usn);
      }
    });

    // Calculate placement stats by school
    const schoolStats = Object.keys(schoolStudentsMap).map(school => {
      const schoolData = schoolStudentsMap[school];
      const placedCount = Array.from(schoolData.studentUSNs).filter(usn => 
        placedUSNs.has(usn)
      ).length;
      
      const placementPercent = schoolData.totalStudents > 0
        ? ((placedCount / schoolData.totalStudents) * 100).toFixed(2)
        : '0.00';

      return {
        school: school,
        totalStudents: schoolData.totalStudents,
        placedStudents: placedCount,
        placementPercent: parseFloat(placementPercent)
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

// @desc    Get school distribution (students count by school)
// @route   GET /api/dashboard/placement/school-distribution
// @access  Private (Admin only)
export const getSchoolDistribution = async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    // Get all students with their schools
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('usn, school');

    if (studentsError) throw studentsError;

    // Get all job offers with job_type to categorize
    const { data: offersData, error: offersError } = await supabase
      .from('job_offers')
      .select('usn, job_type');

    if (offersError) throw offersError;

    // Categorize offers by job_type
    // If job_type contains "full time" (case-insensitive) → placement
    // If job_type contains "internship" (case-insensitive) → internship-only
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
      }
    });

    // Count students by school and categorize offers
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
      
      // Categorize students by offer type
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

// @desc    Get CTC distribution for chart
// @route   GET /api/dashboard/placement/ctc-distribution
// @access  Private (Admin only)
export const getCTCDistribution = async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    // Get all CTC values from job offers
    const { data: ctcData, error: ctcError } = await supabase
      .from('job_offers')
      .select('ctc_max_lpa, ctc_min_lpa, final_interview_status, offer_letter_status');

    if (ctcError) throw ctcError;

    // Filter for placed students only (selected status)
    const placedOffers = ctcData?.filter(offer => {
      const interviewStatus = (offer.final_interview_status || '').toLowerCase();
      const offerLetterStatus = (offer.offer_letter_status || '').toLowerCase();
      
      return interviewStatus.includes('selected') || 
             offerLetterStatus.includes('accepted') || 
             offerLetterStatus.includes('received');
    }) || [];

    // Extract all CTC values (prefer max, fallback to min)
    const ctcValues = [];
    placedOffers.forEach(offer => {
      const ctc = parseFloat(offer.ctc_max_lpa || offer.ctc_min_lpa);
      if (!isNaN(ctc) && ctc > 0) {
        ctcValues.push(ctc);
      }
    });

    res.status(200).json({
      success: true,
      data: ctcValues
    });
  } catch (error) {
    console.error('Error fetching CTC distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching CTC distribution',
      error: error.message
    });
  }
};

// @desc    Get hiring partners (unique companies)
// @route   GET /api/dashboard/placement/hiring-partners
// @access  Private (Admin only)
export const getHiringPartners = async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    // Get all unique company names from job offers
    const { data: companiesData, error: companiesError } = await supabase
      .from('job_offers')
      .select('company_name')
      .not('company_name', 'is', null);

    if (companiesError) throw companiesError;

    // Normalize company names: trim, lowercase, and remove trailing dashes and numbers
    // Use a Map to track normalized -> original name mapping (keep the first occurrence)
    const normalizedMap = new Map();
    
    const normalizeCompanyName = (name) => {
      if (!name) return '';
      // Trim, lowercase, and remove trailing dashes/hyphens and numbers
      return name.trim().toLowerCase().replace(/-*\d+$/, '');
    };
    
    companiesData?.forEach(offer => {
      if (offer.company_name) {
        const normalized = normalizeCompanyName(offer.company_name);
        // Only keep the first occurrence of each normalized name
        if (!normalizedMap.has(normalized)) {
          normalizedMap.set(normalized, offer.company_name.trim());
        }
      }
    });

    // Get unique company names (using original names from the map)
    const uniqueCompanies = Array.from(normalizedMap.values());

    res.status(200).json({
      success: true,
      data: uniqueCompanies
    });
  } catch (error) {
    console.error('Error fetching hiring partners:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hiring partners',
      error: error.message
    });
  }
};

// @desc    Get CTC statistics (average and median)
// @route   GET /api/dashboard/placement/ctc-stats
// @access  Private (Admin only)
export const getCTCStats = async (req, res) => {
  try {
    const supabase = getSupabaseClient();

    // Get all CTC values from placed offers
    const { data: ctcData, error: ctcError } = await supabase
      .from('job_offers')
      .select('ctc_max_lpa, ctc_min_lpa, final_interview_status, offer_letter_status');

    if (ctcError) throw ctcError;

    // Filter for placed students only
    const placedOffers = ctcData?.filter(offer => {
      const interviewStatus = (offer.final_interview_status || '').toLowerCase();
      const offerLetterStatus = (offer.offer_letter_status || '').toLowerCase();
      
      return interviewStatus.includes('selected') || 
             offerLetterStatus.includes('accepted') || 
             offerLetterStatus.includes('received');
    }) || [];

    // Extract all CTC values (prefer max, fallback to min)
    const ctcValues = [];
    placedOffers.forEach(offer => {
      const ctc = parseFloat(offer.ctc_max_lpa || offer.ctc_min_lpa);
      if (!isNaN(ctc) && ctc > 0) {
        ctcValues.push(ctc);
      }
    });

    // Calculate average
    const averageCTC = ctcValues.length > 0
      ? ctcValues.reduce((sum, val) => sum + val, 0) / ctcValues.length
      : 0;

    // Calculate median
    let medianCTC = 0;
    if (ctcValues.length > 0) {
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
        medianCTC: parseFloat(medianCTC.toFixed(2))
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

