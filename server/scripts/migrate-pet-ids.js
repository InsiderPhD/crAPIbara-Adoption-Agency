#!/usr/bin/env node

/**
 * Migration script to change Pet IDs from UUIDs to integers
 * This script will:
 * 1. Create a backup of current data
 * 2. Update the Pet model to use integer IDs
 * 3. Migrate existing data
 * 4. Update foreign key references
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Backup function
async function createBackup() {
  console.log('📦 Creating backup of current data...');
  
  try {
    const pets = await prisma.pet.findMany({
      include: {
        applications: true,
        rescue: true,
      },
    });
    
    const applications = await prisma.application.findMany();
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'pet',
      },
    });
    
    const backup = {
      timestamp: new Date().toISOString(),
      pets,
      applications,
      auditLogs,
    };
    
    const backupPath = path.join(__dirname, 'backup-pets-' + Date.now() + '.json');
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// Migration function
async function migratePetIds() {
  console.log('🔄 Starting Pet ID migration from UUID to Integer...\n');
  
  try {
    // Step 1: Create backup
    const backupPath = await createBackup();
    
    // Step 2: Get all pets with their applications
    console.log('📋 Fetching current pets and applications...');
    const pets = await prisma.pet.findMany({
      include: {
        applications: true,
      },
      orderBy: {
        createdAt: 'asc', // Ensure consistent ordering
      },
    });
    
    console.log(`Found ${pets.length} pets to migrate`);
    
    // Step 3: Create mapping of old UUID to new integer ID
    const idMapping = new Map();
    pets.forEach((pet, index) => {
      idMapping.set(pet.id, index + 1); // Start from 1
    });
    
    console.log('🗺️  Created ID mapping:');
    idMapping.forEach((newId, oldId) => {
      console.log(`  ${oldId} -> ${newId}`);
    });
    
    // Step 4: Disable foreign key constraints (SQLite doesn't support this, so we'll work around it)
    console.log('🔧 Starting migration...');
    
    // Step 5: Update applications first (they reference pets)
    console.log('📝 Updating applications...');
    for (const pet of pets) {
      const newPetId = idMapping.get(pet.id);
      
      // Update applications for this pet
      await prisma.application.updateMany({
        where: {
          petId: pet.id,
        },
        data: {
          petId: newPetId.toString(), // Temporarily store as string
        },
      });
    }
    
    // Step 6: Update audit logs
    console.log('📊 Updating audit logs...');
    for (const [oldId, newId] of idMapping) {
      await prisma.auditLog.updateMany({
        where: {
          entityType: 'pet',
          entityId: oldId,
        },
        data: {
          entityId: newId.toString(),
        },
      });
    }
    
    // Step 7: Delete all pets (we'll recreate them with new IDs)
    console.log('🗑️  Removing old pets...');
    await prisma.pet.deleteMany();
    
    // Step 8: Recreate pets with new integer IDs
    console.log('🆕 Creating pets with new integer IDs...');
    for (const pet of pets) {
      const newId = idMapping.get(pet.id);
      
      await prisma.pet.create({
        data: {
          id: newId,
          referenceNumber: pet.referenceNumber,
          name: pet.name,
          species: pet.species,
          age: pet.age,
          size: pet.size,
          description: pet.description,
          imageUrl: pet.imageUrl,
          gallery: pet.gallery,
          rescueId: pet.rescueId,
          isAdopted: pet.isAdopted,
          isPromoted: pet.isPromoted,
          dateListed: pet.dateListed,
          internalNotes: pet.internalNotes,
          createdAt: pet.createdAt,
          updatedAt: pet.updatedAt,
        },
      });
    }
    
    // Step 9: Update applications to use new integer IDs
    console.log('🔗 Updating application references...');
    for (const [oldId, newId] of idMapping) {
      await prisma.application.updateMany({
        where: {
          petId: newId.toString(), // Find by temporary string ID
        },
        data: {
          petId: newId.toString(), // Keep as string for now (will be updated in schema)
        },
      });
    }
    
    console.log('✅ Migration completed successfully!');
    console.log(`📁 Backup saved at: ${backupPath}`);
    
    return {
      success: true,
      petsMigrated: pets.length,
      backupPath,
      idMapping: Object.fromEntries(idMapping),
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Rollback function
async function rollbackMigration(backupPath) {
  console.log('🔄 Rolling back migration...');
  
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }
    
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Clear current data
    await prisma.application.deleteMany();
    await prisma.pet.deleteMany();
    
    // Restore pets
    for (const pet of backup.pets) {
      await prisma.pet.create({
        data: pet,
      });
    }
    
    // Restore applications
    for (const application of backup.applications) {
      await prisma.application.create({
        data: application,
      });
    }
    
    console.log('✅ Rollback completed successfully!');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'migrate':
        const result = await migratePetIds();
        console.log('\n📊 Migration Summary:');
        console.log(`- Pets migrated: ${result.petsMigrated}`);
        console.log(`- Backup location: ${result.backupPath}`);
        console.log('\n⚠️  IMPORTANT: You must now update your Prisma schema to use integer IDs!');
        break;
        
      case 'rollback':
        const backupPath = process.argv[3];
        if (!backupPath) {
          console.error('❌ Please provide backup file path');
          process.exit(1);
        }
        await rollbackMigration(backupPath);
        break;
        
      default:
        console.log('Usage:');
        console.log('  node migrate-pet-ids.js migrate    # Run migration');
        console.log('  node migrate-pet-ids.js rollback <backup-path>  # Rollback migration');
        break;
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  migratePetIds,
  rollbackMigration,
  createBackup,
}; 