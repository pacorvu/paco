// Script to generate bcrypt password hashes for default users
// Run with: node generate-password-hashes.js

import bcrypt from 'bcryptjs';

async function generateHashes() {
  console.log('Generating password hashes...\n');
  
  const adminPassword = 'admin123';
  const pdPassword = 'pd123';
  
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const pdHash = await bcrypt.hash(pdPassword, 10);
  
  console.log('=== Copy these hashes to your Supabase migration ===\n');
  console.log('Admin User (password: admin123):');
  console.log(adminHash);
  console.log('\nPlacement Director (password: pd123):');
  console.log(pdHash);
  console.log('\n=== SQL UPDATE statements ===\n');
  console.log(`-- Update admin password`);
  console.log(`UPDATE users SET password = '${adminHash}' WHERE email = 'admin@example.com';`);
  console.log(`\n-- Update placement director password`);
  console.log(`UPDATE users SET password = '${pdHash}' WHERE email = 'pd@example.com';`);
}

generateHashes().catch(console.error);

