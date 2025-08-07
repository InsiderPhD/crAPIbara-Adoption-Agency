#!/usr/bin/env node

/**
 * Script to run the pet ID migration and regenerate Prisma client
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Running Pet ID Migration...\n');

try {
  // Step 1: Run the migration script
  console.log('📦 Step 1: Running migration script...');
  execSync('node scripts/migrate-pet-ids.js migrate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  // Step 2: Generate new Prisma client
  console.log('\n🔧 Step 2: Generating new Prisma client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  // Step 3: Run database migration
  console.log('\n🗄️  Step 3: Running database migration...');
  execSync('npx prisma migrate dev --name change_pet_ids_to_integers', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n✅ Migration completed successfully!');
  console.log('\n📋 Summary:');
  console.log('- Pet IDs changed from UUID to integer');
  console.log('- Prisma client regenerated');
  console.log('- Database schema updated');
  console.log('\n⚠️  Note: You may need to restart your development server');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} 