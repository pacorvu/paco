import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getSupabaseClient } from '../database/supabase.js';

// Load environment variables from backend/.env even when running inside utils/
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env');
dotenv.config({ path: envPath });
console.log('[LogoGen] Loaded .env from:', envPath);
console.log('[LogoGen] SUPABASE_URL present:', !!process.env.SUPABASE_URL);
console.log('[LogoGen] SUPABASE_SERVICE_ROLE_KEY present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function generateLogoRequirements() {
  try {
    console.log('Starting logo requirements generation...\n');

    const supabase = getSupabaseClient();
    console.log('[LogoGen] Connected to Supabase client');
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('company_name')
      .not('company_name', 'is', null);

    if (companiesError) {
      throw new Error(`Database error: ${companiesError.message}`);
    }

    // Normalize and deduplicate company names (trim, lowercase, remove trailing dashes and numbers)
    const normalizedMap = new Map();
    companiesData?.forEach(row => {
      if (row.company_name) {
        const normalized = normalizeCompanyName(row.company_name);
        // Only keep the first occurrence of each normalized name
        if (!normalizedMap.has(normalized)) {
          normalizedMap.set(normalized, row.company_name.trim());
        }
      }
    });

    // Get unique company names (using original names from the map)
    const uniqueCompanies = Array.from(normalizedMap.values());
    
    if (uniqueCompanies.length === 0) {
      console.log('No companies found in database.');
      return;
    }

    console.log(`Found ${uniqueCompanies.length} unique companies in database.\n`);

    // Path to company_logos folder (in frontend/public)
    const frontendPublicPath = path.join(__dirname, '../../frontend/public');
    const companyLogosPath = path.join(frontendPublicPath, 'company_logos');
    const requirementFilePath = path.join(companyLogosPath, 'requirement.txt');

    // Create company_logos folder if it doesn't exist
    if (!fs.existsSync(companyLogosPath)) {
      fs.mkdirSync(companyLogosPath, { recursive: true });
      console.log(`Created directory: ${companyLogosPath}\n`);
    }

    // Delete existing requirement.txt if it exists
    if (fs.existsSync(requirementFilePath)) {
      fs.unlinkSync(requirementFilePath);
      console.log('Deleted existing requirement.txt\n');
    }

    // Get list of existing logo files
    const existingLogos = new Set();
    if (fs.existsSync(companyLogosPath)) {
      const files = fs.readdirSync(companyLogosPath);
      files.forEach(file => {
        if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg') || file.toLowerCase().endsWith('.svg')) {
          existingLogos.add(file.toLowerCase());
        }
      });
    }

    // Generate logo filenames for each company
    const missingLogos = [];
    const foundLogos = [];

    uniqueCompanies.forEach(companyName => {
      const logoFilename = getCompanyLogoFilename(companyName);
      const logoFilenameLower = logoFilename.toLowerCase();
      
      // Check if logo exists (case-insensitive check)
      const logoExists = Array.from(existingLogos).some(existing => 
        existing === logoFilenameLower || 
        existing.replace(/\.(png|jpg|jpeg|svg)$/, '') === logoFilenameLower.replace('.png', '')
      );

      if (!logoExists) {
        missingLogos.push(logoFilename);
      } else {
        foundLogos.push(logoFilename);
      }
    });

    // Write requirement.txt with missing logos
    if (missingLogos.length > 0) {
      const requirementContent = missingLogos.join('\n');
      fs.writeFileSync(requirementFilePath, requirementContent, 'utf8');
      console.log(`Generated requirement.txt with ${missingLogos.length} missing logos:\n`);
      console.log(requirementContent);
      console.log(`\n\nTotal companies: ${uniqueCompanies.length}`);
      console.log(`Logos found: ${foundLogos.length}`);
      console.log(`Logos missing: ${missingLogos.length}`);
      console.log(`\nRequirement file saved to: ${requirementFilePath}`);
    } else {
      console.log('All company logos are present! No requirement.txt generated.');
      console.log(`\nTotal companies: ${uniqueCompanies.length}`);
      console.log(`All ${foundLogos.length} logos found in: ${companyLogosPath}`);
    }

  } catch (error) {
    console.error('Error generating logo requirements:', error);
    process.exit(1);
  }
}

// Run the script
generateLogoRequirements();

